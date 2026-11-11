<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ProjectWallItem } from "~/composables/useProjectsWallData";

// PROTOTYPE: the project wall seen from inside a dome. An endless grid of
// project cards drifts slowly; every card is warped so the grid bulges toward
// the screen edges (a concave "dome" lens), and the cards near the cursor are
// pushed apart a little more. Drag (with inertia), the wheel and the arrow
// keys move the grid; a click that did not drag opens the project.
//
// Each card is a plain DOM element whose four corners are projected and turned
// into a CSS matrix3d (a square-to-quad homography), so the images stay sharp
// HTML images and no WebGL is needed.
const props = defineProps<{ projects: ProjectWallItem[] }>();

const COPY: Record<string, { label: string; play: string; pause: string; center: string; hint: string; open: string }> = {
  en: { label: "OneBranding projects", play: "Play", pause: "Pause", center: "Center", hint: "Drag, scroll or use the arrow keys", open: "Open project" },
  ru: { label: "Проекты OneBranding", play: "Пуск", pause: "Пауза", center: "В центр", hint: "Тяните, прокручивайте или используйте стрелки", open: "Открыть проект" },
  uz: { label: "OneBranding loyihalari", play: "Davom", pause: "Pauza", center: "Markaz", hint: "Suring, gʻildirakni aylantiring yoki strelkalardan foydalaning", open: "Loyihani ochish" },
};
const { locale } = useI18n();
const copy = computed(() => COPY[locale.value] ?? COPY.en!);

const img = useImage();
const WIDTHS = [640, 1024];
const src = (url: string, width = WIDTHS[0]!) => img(url, { width, format: "webp", quality: 80 });
const srcset = (url: string) => WIDTHS.map((w) => `${src(url, w)} ${w}w`).join(", ");

const root = ref<HTMLElement | null>(null);
const surface = ref<HTMLElement | null>(null);
const paused = ref(false);
const ready = ref(false);
const hovered = ref(-1);

type Tile = { column: number; row: number; project: ProjectWallItem; key: string };
const tiles = ref<Tile[]>([]);
const tileEls: HTMLElement[] = [];
const imageEls: HTMLElement[] = [];
const setTileEl = (el: unknown, i: number) => { if (el) tileEls[i] = el as HTMLElement; };
const setImageEl = (el: unknown, i: number) => { if (el) imageEls[i] = el as HTMLElement; };

const mod = (v: number, n: number) => ((v % n) + n) % n;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
// Neighbouring rows are shifted by two projects, so with as few as five
// projects no card sits next to a copy of itself.
const projectAt = (column: number, row: number) => {
  const list = props.projects;
  return list[mod(column + row * 2, list.length)]!;
};

// Layout (measured): card size, grid step and how many cards cover the screen.
let width = 0, height = 0, cardW = 0, cardH = 0, stepX = 0, stepY = 0, cols = 0, rows = 0;

const buildTiles = () => {
  if (!props.projects.length) return;
  // Whole multiples of the pattern's period keep the wrap seamless.
  const period = props.projects.length;
  cols = Math.ceil((Math.ceil(width / stepX) + 3) / period) * period;
  rows = Math.ceil(height / stepY) + 3;
  const next: Tile[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const column = c - Math.floor(cols / 2);
      const row = r - Math.floor(rows / 2);
      next.push({ column, row, project: projectAt(column, row), key: `${column}:${row}` });
    }
  }
  tileEls.length = 0;
  imageEls.length = 0;
  tiles.value = next;
};

const measure = () => {
  const el = root.value;
  if (!el) return;
  width = el.clientWidth;
  height = el.clientHeight;
  const mobile = width < 768;
  cardW = mobile ? clamp(width * 0.72, 240, 420) : clamp(width / 3.3, 280, 600);
  cardH = cardW / 1.6;
  const gap = Math.max(10, cardW * 0.03);
  stepX = cardW + gap;
  stepY = cardH + gap;
  el.style.setProperty("--dome-card-w", `${cardW}px`);
  el.style.setProperty("--dome-card-h", `${cardH}px`);
  const needed = Math.ceil((Math.ceil(width / stepX) + 3) / Math.max(1, props.projects.length)) * Math.max(1, props.projects.length);
  if (needed !== cols || Math.ceil(height / stepY) + 3 !== rows) buildTiles();
};

// Motion state: offset of the grid (x, y), its target, drift and drag velocity,
// the cursor (in screen-centered coordinates) and the strength of its lens.
let x = 0, y = 0, tx = 0, ty = 0, vx = 0, vy = 0;
let cursorX = 0, cursorY = 0, cursorTX = 0, cursorTY = 0, lens = 0, lensT = 0;
let intro = 0;
let reduced = false;
const DRIFT = { x: -0.32, y: -0.18 }; // px per frame at 60 fps

// The dome: points move outward with the square of their distance from the
// center (edges bulge toward the viewer), then the cursor pushes nearby points
// away from itself.
const warp = (px: number, py: number) => {
  const nx = px / (width / 2), ny = py / (height / 2);
  const k = 1 + 0.16 * (nx * nx + ny * ny);
  let wx = px * k, wy = py * k;
  if (lens > 0.001) {
    const dx = wx - cursorX, dy = wy - cursorY;
    const reach = stepX * 1.4;
    const push = 0.22 * lens * Math.exp(-(dx * dx + dy * dy) / (reach * reach));
    wx += dx * push;
    wy += dy * push;
  }
  return [wx + width / 2, wy + height / 2] as const;
};

// CSS matrix3d that maps an element of size w x h (origin top-left) onto the
// quad p0 (top-left), p1 (top-right), p2 (bottom-right), p3 (bottom-left).
const quadMatrix = (p: readonly (readonly [number, number])[], w: number, h: number) => {
  const [x0, y0] = p[0]!, [x1, y1] = p[1]!, [x2, y2] = p[2]!, [x3, y3] = p[3]!;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1 || 1e-9;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${hh / h},0,0,1,0,${c},${f},0,1)`;
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const paint = () => {
  const spanX = cols * stepX, spanY = rows * stepY;
  const list = tiles.value;
  for (let i = 0; i < list.length; i++) {
    const tile = list[i]!;
    const el = tileEls[i];
    if (!el) continue;
    let px = mod(tile.column * stepX + x + spanX / 2, spanX) - spanX / 2;
    let py = mod(tile.row * stepY + y + spanY / 2, spanY) - spanY / 2;
    const visible = Math.abs(px) < width / 2 + stepX * 1.2 && Math.abs(py) < height / 2 + stepY * 1.2;
    el.style.visibility = visible ? "visible" : "hidden";
    if (!visible) continue;

    // Entrance: cards fly in from beyond the edges, the nearest ones first.
    let alpha = 1;
    if (intro < 1) {
      const dist = Math.hypot(px / width, py / height);
      const t = easeOut(clamp((intro - dist * 0.35) / 0.65, 0, 1));
      const scale = 1 + (1 - t) * 1.6;
      px *= scale;
      py *= scale;
      alpha = t;
    }
    const hw = cardW / 2, hh = cardH / 2;
    el.style.transform = quadMatrix([warp(px - hw, py - hh), warp(px + hw, py - hh), warp(px + hw, py + hh), warp(px - hw, py + hh)], cardW, cardH);
    el.style.opacity = String(alpha);

    // The picture inside drifts against the cursor: a little depth per card.
    const image = imageEls[i];
    if (image) {
      const ix = clamp((cursorX - px) / (stepX * 1.5), -1, 1) * 10 * lens;
      const iy = clamp((cursorY - py) / (stepX * 1.5), -1, 1) * 10 * lens;
      image.style.transform = `translate3d(${ix}px, ${iy}px, 0) scale(1.06)`;
    }
  }
};

// Drag, wheel and keys set a target; the grid eases toward it. Velocity keeps
// a released drag gliding.
let pointerId: number | null = null;
let dragStartX = 0, dragStartY = 0, dragTX = 0, dragTY = 0, dragDistance = 0;
let lastMoveX = 0, lastMoveY = 0, lastMoveT = 0;
let frame = 0, last = 0, running = false;

const tick = (now: number) => {
  frame = 0;
  const dt = Math.min(48, now - (last || now));
  last = now;
  const f = dt / 16.67;
  if (!reduced) {
    if (intro < 1) intro = Math.min(1, intro + dt / 1500);
    if (pointerId === null) {
      tx += vx * f;
      ty += vy * f;
      vx *= Math.pow(0.92, f);
      vy *= Math.pow(0.92, f);
      if (!paused.value && intro >= 1) {
        tx += DRIFT.x * f;
        ty += DRIFT.y * f;
      }
    }
    const blend = 1 - Math.pow(0.88, f);
    x += (tx - x) * blend;
    y += (ty - y) * blend;
    cursorX += (cursorTX - cursorX) * (1 - Math.pow(0.86, f));
    cursorY += (cursorTY - cursorY) * (1 - Math.pow(0.86, f));
    // The lens calms down while the grid moves fast, so a drag stays readable.
    const calm = 1 / (1 + (Math.abs(tx - x) + Math.abs(ty - y)) / 50);
    lens += (lensT * calm - lens) * (1 - Math.pow(0.9, f));
  } else {
    x = tx;
    y = ty;
    intro = 1;
    lens = 0;
  }
  paint();
  const moving = !reduced && (!paused.value || pointerId !== null || Math.abs(tx - x) + Math.abs(ty - y) > 0.1 || Math.abs(vx) + Math.abs(vy) > 0.05 || intro < 1 || Math.abs(lens - lensT) > 0.002);
  if (moving && running) frame = requestAnimationFrame(tick);
};
const wake = () => {
  if (!running || frame) return;
  last = 0;
  frame = requestAnimationFrame(tick);
};

const onPointerDown = (e: PointerEvent) => {
  if (e.button !== 0) return;
  pointerId = e.pointerId;
  dragStartX = lastMoveX = e.clientX;
  dragStartY = lastMoveY = e.clientY;
  lastMoveT = performance.now();
  dragTX = tx;
  dragTY = ty;
  dragDistance = 0;
  vx = vy = 0;
  surface.value?.setPointerCapture(e.pointerId);
  root.value?.classList.add("is-dragging");
  wake();
};
const onPointerMove = (e: PointerEvent) => {
  const rect = root.value?.getBoundingClientRect();
  if (rect && e.pointerType === "mouse") {
    cursorTX = e.clientX - rect.left - width / 2;
    cursorTY = e.clientY - rect.top - height / 2;
    lensT = 1;
  }
  if (e.pointerId === pointerId) {
    const speed = e.pointerType === "touch" ? 1.8 : 1.25;
    const dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
    dragDistance = Math.max(dragDistance, Math.hypot(dx, dy));
    tx = dragTX + dx * speed;
    ty = dragTY + dy * speed;
    const now = performance.now();
    const ms = Math.max(1, now - lastMoveT);
    vx = ((e.clientX - lastMoveX) / ms) * 16.67 * speed;
    vy = ((e.clientY - lastMoveY) / ms) * 16.67 * speed;
    lastMoveX = e.clientX;
    lastMoveY = e.clientY;
    lastMoveT = now;
  }
  wake();
};
const onPointerUp = (e: PointerEvent) => {
  if (e.pointerId !== pointerId) return;
  pointerId = null;
  root.value?.classList.remove("is-dragging");
  // A stale velocity (the pointer rested before release) must not fling the grid.
  if (performance.now() - lastMoveT > 80) vx = vy = 0;
  wake();
};
const onPointerLeave = () => {
  lensT = 0;
  hovered.value = -1;
  wake();
};
// A click that ended a drag is not a click on the project.
const onClickCapture = (e: MouseEvent) => {
  if (dragDistance > 6) {
    e.preventDefault();
    e.stopPropagation();
  }
};
const onWheel = (e: WheelEvent) => {
  if (e.ctrlKey) return;
  e.preventDefault();
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1;
  tx -= e.deltaX * unit;
  ty -= e.deltaY * unit;
  vx = vy = 0;
  wake();
};
const onKeydown = (e: KeyboardEvent) => {
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [stepX * 0.8, 0],
    ArrowRight: [-stepX * 0.8, 0],
    ArrowUp: [0, stepY * 0.8],
    ArrowDown: [0, -stepY * 0.8],
  };
  const move = moves[e.key];
  if (move) {
    e.preventDefault();
    tx += move[0];
    ty += move[1];
    vx = vy = 0;
    wake();
  } else if (e.key === "Enter") {
    // Opens the card nearest the center of the screen.
    const nearest = nearestTile();
    if (nearest) navigateTo(nearest.project.to);
  }
};
const nearestTile = () => {
  const spanX = cols * stepX, spanY = rows * stepY;
  let best: Tile | null = null, bestD = Infinity;
  for (const tile of tiles.value) {
    const px = mod(tile.column * stepX + x + spanX / 2, spanX) - spanX / 2;
    const py = mod(tile.row * stepY + y + spanY / 2, spanY) - spanY / 2;
    const d = px * px + py * py;
    if (d < bestD) { bestD = d; best = tile; }
  }
  return best;
};

const togglePause = () => {
  paused.value = !paused.value;
  wake();
};
// Snaps the nearest card to the middle of the screen and holds the drift there.
const recenter = () => {
  tx = Math.round(x / stepX) * stepX;
  ty = Math.round(y / stepY) * stepY;
  vx = vy = 0;
  paused.value = true;
  wake();
};

// Like the classic wall: the page itself never scrolls behind the dome.
useHead({
  htmlAttrs: { class: "projects-wall-document" },
  bodyAttrs: { class: "projects-wall-document" },
});

let resizeObserver: ResizeObserver | null = null;
const onVisibility = () => { if (!document.hidden) wake(); };

onMounted(() => {
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  paused.value = reduced;
  if (reduced) intro = 1;
  measure();
  running = true;
  resizeObserver = new ResizeObserver(() => { measure(); requestAnimationFrame(() => { paint(); wake(); }); });
  if (root.value) resizeObserver.observe(root.value);
  document.addEventListener("visibilitychange", onVisibility);
  requestAnimationFrame(() => {
    paint();
    ready.value = true;
    wake();
  });
});

watch(() => props.projects.length, () => { measure(); requestAnimationFrame(() => { paint(); wake(); }); });

onBeforeUnmount(() => {
  running = false;
  cancelAnimationFrame(frame);
  resizeObserver?.disconnect();
  document.removeEventListener("visibilitychange", onVisibility);
});
</script>

<template>
  <section
    ref="root"
    class="dome"
    :class="{ 'is-ready': ready, 'has-hover': hovered >= 0 }"
    :aria-label="copy.label"
    tabindex="0"
    data-lenis-prevent
    @keydown="onKeydown"
  >
    <!-- For screen readers and keyboard users: the projects once, as a list. -->
    <ul class="sr-only">
      <li v-for="project in props.projects" :key="project.id">
        <NuxtLink :to="project.to">{{ project.title }}</NuxtLink>
      </li>
    </ul>

    <div
      ref="surface"
      class="dome__surface"
      aria-hidden="true"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerLeave"
      @click.capture="onClickCapture"
      @wheel="onWheel"
    >
      <NuxtLink
        v-for="(tile, i) in tiles"
        :key="tile.key"
        :ref="(el) => setTileEl((el as { $el?: unknown } | null)?.$el ?? el, i)"
        :to="tile.project.to"
        class="dome__card"
        :class="{ 'is-hover': hovered === i }"
        tabindex="-1"
        draggable="false"
        @pointerenter="hovered = i"
        @pointerleave="hovered = -1"
        @dragstart.prevent
      >
        <span class="dome__media">
          <img
            :ref="(el) => setImageEl(el, i)"
            :src="src(tile.project.image)"
            :srcset="srcset(tile.project.image)"
            sizes="(max-width: 767px) 420px, 640px"
            alt=""
            decoding="async"
            draggable="false"
          >
        </span>
        <span class="dome__shade" />
        <span class="dome__meta">
          <span class="dome__title">{{ tile.project.title }}</span>
          <span class="dome__open">{{ copy.open }} ↗</span>
        </span>
      </NuxtLink>
    </div>

    <div class="dome__vignette" aria-hidden="true" />

    <div class="dome__controls">
      <span class="dome__hint">{{ copy.hint }}</span>
      <button type="button" class="dome__button" :aria-pressed="paused" @click="togglePause">
        <svg v-if="paused" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
        <span>{{ paused ? copy.play : copy.pause }}</span>
      </button>
      <button type="button" class="dome__button" @click="recenter">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
        <span>{{ copy.center }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
:global(html.projects-wall-document),
:global(body.projects-wall-document) {
  overflow: hidden;
  overscroll-behavior: none;
}

.dome {
  position: fixed;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  background: #000;
  outline: none;
  touch-action: none;
  user-select: none;
}

.dome:focus-visible {
  box-shadow: inset 0 0 0 0.1875rem #03cb00;
}

.dome__surface {
  position: absolute;
  inset: 0;
  cursor: grab;
}

.dome.is-dragging .dome__surface {
  cursor: grabbing;
}

.dome__card {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--dome-card-w, 480px);
  height: var(--dome-card-h, 300px);
  overflow: hidden;
  border-radius: 1.1rem;
  background: #0d0d0d;
  transform-origin: 0 0;
  will-change: transform;
  visibility: hidden;
  /* Every card sits a little in the dark; the one under the cursor lights up. */
  filter: brightness(0.62) saturate(0.9);
  transition: filter 0.45s ease;
}

.dome.is-ready .dome__card {
  visibility: visible;
}

.dome.has-hover .dome__card:not(.is-hover) {
  filter: brightness(0.45) saturate(0.8);
}

.dome__card.is-hover {
  filter: brightness(1.04) saturate(1);
}

.dome__media {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.dome__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  will-change: transform;
}

.dome__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgb(0 0 0 / 0.78) 0%, rgb(0 0 0 / 0.35) 22%, rgb(0 0 0 / 0) 45%);
  pointer-events: none;
}

.dome__meta {
  position: absolute;
  left: 1.1rem;
  right: 1.1rem;
  bottom: 0.9rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  color: #fff;
  pointer-events: none;
}

.dome__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  max-width: 70%;
  font-family: var(--app-font-display);
  font-size: clamp(0.95rem, 1.15vw, 1.35rem);
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.12;
}

.dome__open {
  flex: none;
  padding: 0.35rem 0.7rem;
  border: 1px solid rgb(32 232 72 / 0.6);
  border-radius: 999px;
  color: #20e848;
  font-family: var(--app-font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.dome__card.is-hover .dome__open {
  opacity: 1;
  transform: none;
}

.dome__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 75% 70% at 50% 50%, rgb(0 0 0 / 0) 55%, rgb(0 0 0 / 0.55) 100%),
    linear-gradient(to bottom, rgb(0 0 0 / 0.35) 0%, rgb(0 0 0 / 0) 18%, rgb(0 0 0 / 0) 82%, rgb(0 0 0 / 0.45) 100%);
}

.dome__controls {
  position: absolute;
  z-index: 2;
  right: max(1.25rem, env(safe-area-inset-right));
  bottom: max(1.25rem, env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dome__hint {
  display: inline-flex;
  align-items: center;
  min-height: 2.6rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.6);
  color: rgb(255 255 255 / 0.7);
  font-family: var(--app-font-sans);
  font-size: 0.8rem;
  backdrop-filter: blur(0.75rem);
  -webkit-backdrop-filter: blur(0.75rem);
}

.dome__button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.6rem;
  padding: 0.5rem 1rem;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 999px;
  background: rgb(0 0 0 / 0.6);
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(0.75rem);
  -webkit-backdrop-filter: blur(0.75rem);
  transition: border-color 0.2s ease, color 0.2s ease;
}

.dome__button:hover,
.dome__button:focus-visible {
  border-color: #03cb00;
  color: #20e848;
}

.dome__button:focus-visible {
  outline: 0.1875rem solid #03cb00;
  outline-offset: 0.1875rem;
}

.dome__button svg {
  width: 1rem;
  height: 1rem;
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 0;
}

.dome__button svg circle,
.dome__button svg path[d^="M12 2"] {
  fill: none;
  stroke-width: 2;
}

@media (max-width: 767px) {
  .dome__hint {
    display: none;
  }

  /* Above the page's heading pill, which sits at the bottom on phones. */
  .dome__controls {
    bottom: calc(max(1.25rem, env(safe-area-inset-bottom)) + 3.6rem);
    right: 50%;
    transform: translateX(50%);
  }
}
</style>
