<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import type { ProjectWallItem } from "~/composables/useProjectsWallData";
import { createIntro, easeOut3, easeOutExpo, type Intro, type SlideSize } from "~/utils/projectsIntro";
import { createPlane, createScene, VIEW_HEIGHT, type Picture, type Plane, type Scene } from "~/utils/projectsScene";

// The projects page's slider view, after mathildedechiara.com, in its
// numbers (taken from the original and kept in its world units: the screen is
// VIEW_HEIGHT units tall, slides 0.04 of it apart). The slides are the site's
// own project cards: 16:9, 500px wide (390 up to 1024px, 285 up to 640px,
// growing with the site past 1920px), corners rounded 1.25rem.
//
// Opening: the brand's name and line rise into view; 2.5 s after the page
// mounts they leave, and the projects' pictures fly in as a diamond mosaic and
// fold into the column (utils/projectsIntro.ts). The overlay then comes in.
//
// Scrolling is free, with no snap: the wheel feeds an impulse that drains into
// the target position, a drag moves it directly and leaves a glide behind, and
// the drawn position eases after the target. Its frame-to-frame speed bends
// every slide (more near the centre) and swells the whole screen through the
// lens (utils/projectsScene.ts). The slide nearest the centre is the current
// one: its number rolls in the counter and its category shows below.
//
// A click on the centred slide reveals it at its own proportions (the others
// make way), with its title above and its line below, a minimap of all the
// projects at the right, and "Explore" under the diamond; a second click
// opens the project. A click on another slide brings it to the centre and
// reveals it on the way. The wheel, a drag or Escape put it back.
//
// The page is rendered on the server as a plain column of the same slides,
// which shows if WebGL is missing; the projects' links are in the list for
// screen readers and crawlers. The opening plays once per visit: coming back
// from the grid (opening false) the column is there at once.

const props = withDefaults(defineProps<{ projects: ProjectWallItem[]; category: string; opening?: boolean }>(), { opening: true });
const emit = defineEmits<{ live: []; reveal: [shown: boolean] }>();

const { t } = useI18n();
const img = useImage();
const slideSrc = (url: string, width = 1280) => img(url, { width, format: "webp", quality: 80 });
const thumbSrc = (url: string) => img(url, { width: 120, format: "webp", quality: 70 });

const count = computed(() => props.projects.length);
const slotCount = computed(() => Math.min(9, count.value));
const mod = (value: number, size: number) => ((value % size) + size) % size;
const coarse = import.meta.client && window.matchMedia("(pointer: coarse)").matches;

// --- What the template shows -------------------------------------------------

const centre = ref(0);
const current = computed(() => (count.value ? props.projects[mod(centre.value, count.value)] : undefined));
const currentNumber = computed(() => (count.value ? mod(centre.value, count.value) + 1 : 0));
const pad = (value: number) => String(value).padStart(2, "0");
const digits = computed(() => pad(currentNumber.value).split(""));
const total = computed(() => pad(count.value));
const matches = (project: ProjectWallItem | undefined) => Boolean(project) && (!props.category || project!.category === props.category);

// The title splits at its colon: "Poyqadam: logo and brand identity".
const parts = (project: ProjectWallItem | undefined) => {
  const [title = "", ...rest] = (project?.title ?? "").split(":");
  return { title: title.trim(), line: rest.join(":").trim() || project?.category || "" };
};

const ui = reactive({
  phase: "text" as "text" | "mosaic" | "slider",
  // The opening's text is taken out 1 s after it leaves.
  textGone: !props.opening,
  live: false,
  gl: false,
  shown: false,
  hoverSlug: "" as string,
  coverCentre: false,
  revealed: -1,
  revealDone: false,
  minimap: false,
  rect: { left: 0, top: 0, right: 0, bottom: 0 },
  category: "",
  categoryState: "in" as "in" | "out" | "reset",
});
const revealedProject = computed(() => (ui.revealed >= 0 ? props.projects[ui.revealed] : undefined));
const hint = computed(() => {
  if (ui.revealed >= 0) return 2;
  const centred = current.value;
  if (!centred || !matches(centred) || ui.phase !== "slider") return 0;
  if (coarse) return ui.coverCentre ? 1 : 0;
  return ui.hoverSlug === centred.id ? 1 : 0;
});

// --- State, in world units ---------------------------------------------------

let scene: Scene | null = null;
const pictures = new Map<string, Picture | null>();
let planes: Plane[] = [];
let target = 0;
let position = 0;
let impulse = 0;
let glide = 0;
let speed = 0;
let lens = 0;
let dragging = false;
let jump: { from: number; to: number; start: number } | null = null;
let reveal: {
  index: number;
  state: "growing" | "shown" | "collapsing";
  start: number;
  duration: number;
  from: { w: number; h: number };
  to: { w: number; h: number };
  resolve?: () => void;
} | null = null;
let intro: Intro | null = null;
// The slide, measured from the page's card size (see measureSlide).
let slide: SlideSize = { width: 2.6, height: 1.3, pitch: 1.47 };
let radius = 0;
let introStart = 0;
let framesWanted = 0;

const stage = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const counter = ref<HTMLElement | null>(null);

const view = () => scene?.view() ?? { width: VIEW_HEIGHT * 16 / 9, height: VIEW_HEIGHT, pxHeight: 900 };
const pictureOf = (index: number) => pictures.get(slideSrc(props.projects[mod(index, count.value)]!.image)) ?? null;
const want = (frames = 3) => {
  framesWanted = Math.max(framesWanted, frames);
  run();
};

// The revealed size: the picture's own proportions, inside 0.7 x 0.55 of the
// screen (0.8 x 0.58 on phones).
const revealSize = (index: number) => {
  const { width } = view();
  const narrow = window.innerWidth <= 768;
  const maxW = (narrow ? 0.8 : 0.7) * width;
  const maxH = (narrow ? 0.58 : 0.55) * VIEW_HEIGHT;
  const picture = pictureOf(index);
  const ratio = picture ? picture.width / picture.height : 1;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w, h };
};

// How far the other slides move apart around a revealed one.
const pushFor = (height: number) => {
  const extra = height - slide.height;
  if (extra <= 0) return 0;
  return extra / 2 + Math.min(1, extra / Math.max(0.8 * VIEW_HEIGHT - slide.height, 0.01)) * 0.6 * VIEW_HEIGHT;
};

const startReveal = (index: number, duration: number) => {
  reveal = { index, state: "growing", start: performance.now(), duration, from: { w: slide.width, h: slide.height }, to: revealSize(index) };
  ui.revealed = index;
  ui.revealDone = false;
  ui.minimap = true;
  want();
};

const collapse = () => new Promise<void>((resolve) => {
  if (!reveal) return resolve();
  const plane = planes.find((each) => each.picture === pictureOf(reveal!.index));
  reveal = {
    ...reveal,
    state: "collapsing",
    start: performance.now(),
    duration: 0.45,
    from: { w: plane?.width ?? reveal.to.w, h: plane?.height ?? reveal.to.h },
    to: { w: slide.width, h: slide.height },
    resolve,
  };
  ui.revealDone = false;
  ui.minimap = false;
  want();
});

const jumpTo = (index: number) => {
  const total = count.value * slide.pitch;
  const base = index * slide.pitch;
  const turns = Math.round((target - base) / total);
  jump = { from: target, to: base + turns * total, start: performance.now() };
  glide = 0;
  want();
};

const go = (index: number) => {
  jumpTo(index);
  startReveal(mod(index, count.value), 1.6);
};

const select = async (index: number) => {
  if (ui.phase !== "slider") return;
  if (reveal) await collapse();
  // The current one is revealed where it stands (as in the original).
  if (mod(index, count.value) === mod(centre.value, count.value)) startReveal(mod(index, count.value), 0.6);
  else go(nearestCopy(index));
};

// The copy of an item nearest the current place, round the endless column.
const nearestCopy = (index: number) => {
  const base = Math.round(position / slide.pitch);
  return base + (((mod(index, count.value) - mod(base, count.value)) % count.value) + count.value + Math.floor(count.value / 2)) % count.value - Math.floor(count.value / 2);
};

// --- The frame ---------------------------------------------------------------

const layoutSlider = (now: number, frameMs: number) => {
  const n = count.value;
  if (!n) return;
  const frames = frameMs / 16.67;

  if (impulse !== 0) {
    if (dragging || jump) impulse = 0;
    else {
      const step = impulse * 0.22;
      target += step;
      impulse = Math.abs(impulse - step) < 1e-4 ? 0 : impulse - step;
    }
  }
  if (jump) {
    const progress = Math.min((now - jump.start) / 1600, 1);
    target = jump.from + (jump.to - jump.from) * easeOutExpo(progress);
    if (progress >= 1) jump = null;
  } else if (!dragging) {
    const limit = coarse ? 0.75 : 0.12;
    glide = Math.max(-limit, Math.min(limit, glide));
    target += glide;
    glide *= coarse ? Math.pow(0.95, frames) : 0.95;
    if (Math.abs(glide) < 1e-4) glide = 0;
  }
  const before = position;
  if (jump) position = target;
  else position += (target - position) * (coarse ? 1 - Math.pow(0.82, frames) : 0.1);
  const limit = coarse ? 0.35 : 0.25;
  speed = Math.max(-limit, Math.min(limit, position - before));

  // Reveal / collapse.
  let revealPlane: { w: number; h: number; lift: number; wind: number } | null = null;
  if (reveal) {
    const progress = Math.min((now - reveal.start) / 1000 / reveal.duration, 1);
    const eased = easeOut3(progress);
    revealPlane = {
      w: reveal.from.w + (reveal.to.w - reveal.from.w) * eased,
      h: reveal.from.h + (reveal.to.h - reveal.from.h) * eased,
      lift: Math.sin(Math.PI * eased) * 0.1,
      wind: Math.sin(Math.PI * eased),
    };
    if (progress >= 1) {
      if (reveal.state === "growing") {
        reveal.state = "shown";
        ui.revealDone = true;
      } else if (reveal.state === "collapsing") {
        const done = reveal.resolve;
        reveal = null;
        revealPlane = null;
        ui.revealed = -1;
        done?.();
      }
    }
  }

  const measure = position / slide.pitch;
  const base = Math.round(measure);
  const frac = measure - base;
  const half = Math.floor(slotCount.value / 2);
  let nearest = Infinity;
  let nearestIndex = base;
  let revealY: number | null = null;
  for (let slot = 0; slot < slotCount.value; slot++) {
    const plane = planes[slot]!;
    const offset = slot - half;
    const index = mod(base + offset, n);
    plane.picture = pictureOf(index);
    const y = -(offset - frac) * slide.pitch;
    plane.y = y;
    plane.x = 0;
    plane.z = 0;
    plane.rotation = 0;
    plane.uvAngle = 0;
    plane.sphere = 0;
    plane.width = slide.width;
    plane.height = slide.height;
    plane.radius = radius;
    plane.wind = 0;
    plane.windX = 0;
    plane.windY = 0;
    const off = matches(props.projects[index]) ? 0 : 1;
    plane.inactive = Math.abs(plane.inactive - off) < 0.001 ? off : plane.inactive + (off - plane.inactive) * 0.15;
    if (plane.inactive !== off) want(2);
    plane.distortion = Math.min(1.5, Math.abs(speed) * 3 * (1 - Math.min(Math.abs(y) / (VIEW_HEIGHT / 2), 1)));
    if (revealPlane && reveal && index === reveal.index && revealY === null) {
      plane.width = revealPlane.w;
      plane.height = revealPlane.h;
      plane.z = revealPlane.lift;
      plane.wind = revealPlane.wind;
      plane.windY = -1;
      revealY = y;
    }
    if (Math.abs(y) < nearest) {
      nearest = Math.abs(y);
      nearestIndex = base + offset;
    }
  }
  // The others make way for a revealed slide.
  if (revealPlane && revealY !== null) {
    const push = pushFor(revealPlane.h);
    planes.slice(0, slotCount.value).forEach((plane) => {
      if (plane.y === revealY) return;
      plane.y += plane.y > revealY! ? push : -push;
    });
  }
  if (nearestIndex !== centre.value) centre.value = nearestIndex;
  ui.coverCentre = Math.abs(frac * slide.pitch) < slide.height / 2;

  // The lens follows the speed.
  const lensTarget = Math.min(3, Math.abs(speed) * 16);
  lens += (lensTarget - lens) * 0.15;
  if (Math.abs(lens - lensTarget) < 1e-4) lens = lensTarget;

  // The revealed slide's rectangle, for the title and line around it.
  if (reveal && revealY !== null && revealPlane) {
    const { width } = view();
    const w = stage.value?.clientWidth ?? 1;
    const h = stage.value?.clientHeight ?? 1;
    const left = ((-revealPlane.w / 2) / width + 0.5) * w;
    const right = ((revealPlane.w / 2) / width + 0.5) * w;
    const top = (0.5 - (revealY + revealPlane.h / 2) / VIEW_HEIGHT) * h;
    const bottom = (0.5 - (revealY - revealPlane.h / 2) / VIEW_HEIGHT) * h;
    ui.rect = { left, top, right, bottom };
  }

  if (Math.abs(target - position) > 1e-4 || Math.abs(speed) > 1e-4 || Math.abs(glide) > 1e-4 || dragging || reveal?.state === "growing" || reveal?.state === "collapsing" || lens > 1e-4 || jump) want(2);
};

const layoutIntro = (now: number) => {
  if (!intro) return;
  const time = (now - introStart) / 1000;
  const frame = intro.frame(time);
  scene?.setCameraZ(frame.cameraZ);
  planes = frame.tiles.map((tile, index) => {
    const plane = planes[index] ?? createPlane();
    Object.assign(plane, {
      x: tile.x, y: tile.y, z: 0, rotation: tile.rotation, uvAngle: tile.uvAngle,
      width: tile.width, height: tile.height, radius, distortion: tile.distortion, wind: tile.wind, windX: tile.windX, windY: 0,
      sphere: tile.sphere, sphereDepth: tile.sphereDepth, inactive: 0, alpha: 1, ready: 1,
      picture: pictureOf(tile.item),
    });
    return plane;
  });
  if (time >= intro.end + 0.1) handOver();
  else want(2);
};

// The fold's last frame is the slider's first: the slides in the column stay.
const handOver = () => {
  intro = null;
  scene?.setCameraZ(5);
  planes = Array.from({ length: slotCount.value }, () => createPlane());
  target = position = centre.value * slide.pitch;
  ui.phase = "slider";
  setTimeout(() => {
    ui.live = true;
    emit("live");
  }, 500);
  want();
};

let frame = 0;
let last = 0;
const tick = (now: number) => {
  frame = 0;
  const frameMs = last ? Math.min(64, now - last) : 16.67;
  last = now;
  if (ui.phase === "mosaic") layoutIntro(now);
  else if (ui.phase === "slider") layoutSlider(now, frameMs);
  if (scene && ui.gl) scene.render(ui.phase === "slider" ? planes.slice(0, slotCount.value) : planes, ui.phase === "slider" ? lens : 0);
  else paintFallback();
  framesWanted -= 1;
  if (framesWanted > 0) run();
  else last = 0;
};
const run = () => {
  if (!frame) frame = requestAnimationFrame(tick);
};

// Without WebGL the server's column moves instead.
const fallbackColumn = ref<HTMLElement | null>(null);
const paintFallback = () => {
  fallbackColumn.value?.style.setProperty("--pos", (position / slide.pitch).toFixed(4));
};

// --- Input -------------------------------------------------------------------

const toWorld = (clientX: number, clientY: number) => {
  const rect = stage.value!.getBoundingClientRect();
  const { width } = view();
  return {
    x: ((clientX - rect.left) / rect.width - 0.5) * width,
    y: (0.5 - (clientY - rect.top) / rect.height) * VIEW_HEIGHT,
  };
};
const hitTest = (clientX: number, clientY: number) => {
  if (ui.phase !== "slider" || !count.value) return -1;
  const point = toWorld(clientX, clientY);
  const measure = position / slide.pitch;
  const base = Math.round(measure);
  const half = Math.floor(slotCount.value / 2);
  for (let slot = 0; slot < slotCount.value; slot++) {
    const plane = planes[slot];
    if (!plane) continue;
    if (Math.abs(point.x - plane.x) <= plane.width / 2 && Math.abs(point.y - plane.y) <= plane.height / 2) {
      const index = base + slot - half;
      return matches(props.projects[mod(index, count.value)]) ? index : -1;
    }
  }
  return -1;
};

const onWheel = (event: WheelEvent) => {
  event.preventDefault();
  if (ui.phase !== "slider") return;
  if (reveal && reveal.state !== "collapsing") void collapse();
  jump = null;
  const pixels = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
  impulse += Math.max(-120, Math.min(120, pixels)) * 0.008;
  want();
};

let startY = 0;
let startTarget = 0;
let lastSample = { y: 0, t: 0 };
let samples: Array<{ y: number; t: number }> = [];
const worldPerPx = () => VIEW_HEIGHT / (stage.value?.clientHeight || window.innerHeight);
const onPointerDown = (event: PointerEvent) => {
  if (ui.phase !== "slider" || event.button !== 0) return;
  jump = null;
  dragging = true;
  glide = 0;
  startY = event.clientY;
  startTarget = target;
  lastSample = { y: event.clientY, t: performance.now() };
  samples = [lastSample];
  stage.value?.setPointerCapture(event.pointerId);
  want();
};
const onPointerMove = (event: PointerEvent) => {
  if (!dragging) {
    if (event.pointerType === "mouse" && ui.phase === "slider") {
      const index = hitTest(event.clientX, event.clientY);
      ui.hoverSlug = index >= 0 ? props.projects[mod(index, count.value)]!.id : "";
    }
    return;
  }
  const travel = event.clientY - startY;
  if (reveal && reveal.state !== "collapsing" && Math.abs(travel) >= 5) void collapse();
  const direction = event.pointerType === "mouse" ? 1 : -1;
  target = startTarget + direction * travel * worldPerPx();
  const now = performance.now();
  if (event.pointerType === "mouse") {
    glide = (direction * (event.clientY - lastSample.y) * worldPerPx()) / Math.max(now - lastSample.t, 1) * 16;
  } else {
    samples.push({ y: event.clientY, t: now });
    while (samples.length > 2 && samples[0]!.t < now - 80) samples.shift();
    const first = samples[0]!;
    const latest = samples[samples.length - 1]!;
    glide = samples.length < 2 ? 0 : (direction * (latest.y - first.y) * worldPerPx()) / Math.max(latest.t - first.t, 1) * 16;
  }
  lastSample = { y: event.clientY, t: now };
  want();
};
const onPointerUp = async (event: PointerEvent) => {
  if (!dragging) return;
  dragging = false;
  if (stage.value?.hasPointerCapture(event.pointerId)) stage.value.releasePointerCapture(event.pointerId);
  want();
  if (Math.abs(event.clientY - startY) >= 5) return;
  // A click.
  glide = 0;
  const index = hitTest(event.clientX, event.clientY);
  if (index < 0) return;
  const item = mod(index, count.value);
  if (reveal && reveal.index === item && reveal.state !== "collapsing") {
    void navigateTo(props.projects[item]!.to);
  } else if (reveal) {
    await collapse();
    go(index);
  } else if (item === mod(centre.value, count.value)) {
    jumpTo(index);
    startReveal(item, 0.6);
  } else go(index);
};
const onPointerCancel = () => {
  dragging = false;
  glide = 0;
};

const onKeydown = async (event: KeyboardEvent) => {
  if (ui.phase !== "slider" || event.metaKey || event.ctrlKey || event.altKey) return;
  const tag = (event.target as HTMLElement | null)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (event.key === "Escape") {
    void collapse();
    return;
  }
  const moves: Record<string, number> = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };
  const step = moves[event.key];
  if (step !== undefined) {
    event.preventDefault();
    const next = centre.value + step;
    if (reveal) {
      await collapse();
      go(next);
    } else jumpTo(next);
  } else if (event.key === "Enter" && event.target === stage.value && current.value) {
    event.preventDefault();
    if (reveal?.state === "shown") void navigateTo(current.value.to);
    else void select(centre.value);
  }
};

// --- The category label: out, then in with the new name ----------------------

let categoryTimer: ReturnType<typeof setTimeout> | undefined;
watch(() => current.value?.category ?? "", (name) => {
  if (name === ui.category && ui.categoryState === "in") return;
  ui.categoryState = "out";
  clearTimeout(categoryTimer);
  categoryTimer = setTimeout(async () => {
    ui.category = name;
    ui.categoryState = "reset";
    await nextTick();
    // Laid out below its mask first, so it rises in.
    void stage.value?.offsetHeight;
    ui.categoryState = "in";
  }, 400);
}, { immediate: true });

watch(() => props.category, () => want(30));
// The page's controls step aside while a slide is revealed.
watch(() => ui.revealed >= 0, (shown) => emit("reveal", shown));

// --- The opening -------------------------------------------------------------

const startMosaic = () => {
  ui.phase = "mosaic";
  const repeats = Math.max(1, Math.ceil(30 / Math.max(count.value, 1)));
  const items = count.value * repeats;
  intro = createIntro(items, centre.value, (stage.value?.clientWidth || 16) / (stage.value?.clientHeight || 9), slide);
  introStart = performance.now();
  want();
};

let textTimer: ReturnType<typeof setTimeout> | undefined;
// The opening's text holds for 2.5 s from here.
const mountedAt = import.meta.client ? performance.now() : 0;
let resizeObserver: ResizeObserver | undefined;

// The card's size from the stylesheet (a hidden sizer), in world units; the
// column keeps its place in items when the step changes.
const sizer = ref<HTMLElement | null>(null);
const measureSlide = () => {
  const height = stage.value?.clientHeight || window.innerHeight;
  const px = sizer.value?.offsetWidth || 500;
  const toWorld = VIEW_HEIGHT / height;
  const width = px * toWorld;
  const next = { width, height: width * 9 / 16, pitch: width * 9 / 16 + 0.04 * VIEW_HEIGHT };
  const ratio = next.pitch / slide.pitch;
  position *= ratio;
  target *= ratio;
  if (jump) jump = { ...jump, from: jump.from * ratio, to: jump.to * ratio };
  slide = next;
  radius = parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.25 * toWorld;
};

const measureCounter = () => {
  const rect = counter.value?.getBoundingClientRect();
  if (rect) stage.value?.style.setProperty("--counter-end", `${rect.right}px`);
};

onMounted(async () => {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  stage.value?.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeydown);
  resizeObserver = new ResizeObserver(() => {
    scene?.resize();
    measureSlide();
    measureCounter();
    want();
  });
  if (stage.value) resizeObserver.observe(stage.value);
  measureSlide();
  measureCounter();

  if (!still && canvas.value) {
    scene = createScene(canvas.value, () => {
      ui.gl = false;
      scene = null;
    });
  }
  // Every project's picture, before anything moves.
  const urls = props.projects.map((project) => slideSrc(project.image));
  if (scene) {
    const loaded = await Promise.all(urls.map((url) => scene!.load(url)));
    urls.forEach((url, index) => pictures.set(url, loaded[index] ?? null));
    ui.gl = true;
  }
  planes = Array.from({ length: slotCount.value }, () => createPlane());

  // Reduced motion, no WebGL, or back from the grid: no opening.
  if (still || !scene || !props.opening) {
    ui.phase = "slider";
    ui.shown = true;
    ui.textGone = true;
    ui.live = true;
    emit("live");
    want();
    return;
  }
  // The text holds for 2.5 s from the page's start, then the mosaic comes.
  const elapsed = performance.now() - mountedAt;
  textTimer = setTimeout(() => {
    ui.shown = true;
    startMosaic();
    textTimer = setTimeout(() => { ui.textGone = true; }, 1000);
  }, Math.max(0, 2500 - elapsed));
});

onBeforeUnmount(() => {
  stage.value?.removeEventListener("wheel", onWheel);
  window.removeEventListener("keydown", onKeydown);
  resizeObserver?.disconnect();
  if (frame) cancelAnimationFrame(frame);
  clearTimeout(textTimer);
  clearTimeout(categoryTimer);
  scene?.destroy();
});

// The slides the server draws: the centred one and four either side.
const fallbackSlots = computed(() => {
  if (!count.value) return [];
  const half = Math.floor(slotCount.value / 2);
  return Array.from({ length: slotCount.value }, (_, slot) => {
    const index = slot - half;
    return { key: index, index, project: props.projects[mod(index, count.value)]! };
  });
});

const minimapFrom = computed(() => Math.max(1, Math.floor(count.value / 2)));
</script>

<template>
  <section
    ref="stage"
    class="slider"
    :class="{
      'is-scripted': true,
      'has-gl': ui.gl,
      'is-shown': ui.shown,
      'is-live': ui.live,
      'is-revealed': ui.revealed >= 0,
    }"
    tabindex="0"
    role="region"
    aria-roledescription="carousel"
    :aria-label="$t('a11y.projects')"
    data-lenis-prevent
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <div class="slider__stage">
      <span ref="sizer" class="slider__sizer" aria-hidden="true" />
      <canvas ref="canvas" class="slider__canvas" aria-hidden="true" />

      <!-- The server's column (and the column without WebGL). -->
      <div ref="fallbackColumn" class="slider__fallback" aria-hidden="true">
        <span v-for="slot in fallbackSlots" :key="slot.key" class="slider__card" :style="{ '--index': slot.index }">
          <img :src="slideSrc(slot.project.image)" alt="" :loading="Math.abs(slot.index) <= 1 ? 'eager' : 'lazy'" decoding="async" draggable="false">
        </span>
      </div>
    </div>

    <!-- The crosshair through the centre. -->
    <span class="slider__line slider__line--left" aria-hidden="true" />
    <span class="slider__line slider__line--right" aria-hidden="true" />

    <!-- The diamond at the centre: at rest an outline, over the centred slide
         it squares and fills ("Discover"), on a revealed one it turns back
         ("Explore"). -->
    <span
      class="slider__diamond"
      :class="{ 'is-hover': hint === 1, 'is-expanded': hint === 2 }"
      aria-hidden="true"
    >
      <svg class="slider__diamond-shape" viewBox="0 0 14 14"><rect x="0.5" y="0.5" width="13" height="13" /></svg>
      <span class="slider__diamond-inner" />
      <span class="slider__hint">
        <span class="slider__hint-line" :style="{ '--line': 1 - hint }">{{ $t("projectsPage.discover") }}</span>
        <span class="slider__hint-line" :style="{ '--line': 2 - hint }">{{ $t("projectsPage.explore") }}</span>
      </span>
    </span>

    <!-- "01 / 05": only the digits that change roll. -->
    <div class="slider__counter-wrap" aria-hidden="true">
      <p ref="counter" class="slider__counter">
        <span v-for="(digit, index) in digits" :key="index" class="slider__digit">
          <Transition name="digit"><span :key="digit">{{ digit }}</span></Transition>
        </span>
        <span class="slider__counter-sep"> / </span>
        <span v-for="(digit, index) in total.split('')" :key="`t${index}`" class="slider__digit"><span>{{ digit }}</span></span>
      </p>
    </div>
    <div class="slider__category-wrap" aria-hidden="true">
      <span class="slider__category" :class="`is-${ui.categoryState}`">{{ ui.category }}</span>
    </div>

    <!-- Around a revealed slide: its title above, its line below. -->
    <h2
      class="slider__title"
      :class="{ 'is-on': ui.revealed >= 0 }"
      :style="{ left: `${ui.rect.left}px`, bottom: `calc(100% - ${ui.rect.top}px + 0.5rem)` }"
      aria-hidden="true"
    >
      <span>{{ parts(revealedProject).title }}</span>
    </h2>
    <p
      class="slider__subtitle"
      :class="{ 'is-on': ui.revealed >= 0 }"
      :style="{ right: `calc(100% - ${ui.rect.right}px)`, top: `calc(${ui.rect.bottom}px + 0.5rem)` }"
      aria-hidden="true"
    >
      <span>{{ parts(revealedProject).line }}</span>
    </p>

    <!-- All the projects, while one is revealed. -->
    <div class="slider__minimap" :class="{ 'is-on': ui.minimap }">
      <button
        v-for="(project, index) in projects"
        :key="project.id"
        type="button"
        class="slider__thumb"
        :class="{ 'is-active': index === ui.revealed }"
        :style="{ '--stagger': (0.25 * Math.abs(index - (count - 1) / 2)) / minimapFrom }"
        :aria-label="project.title"
        @click="select(index)"
      >
        <img :src="thumbSrc(project.image)" alt="" loading="lazy" decoding="async">
      </button>
    </div>

    <!-- The opening's name and line. -->
    <div v-if="!ui.textGone" class="slider__intro" :class="{ 'is-leaving': ui.shown }" aria-hidden="true">
      <p class="slider__intro-name"><span>OneBranding</span></p>
      <p class="slider__intro-role"><span>{{ $t("seo.heroEyebrow") }}</span></p>
    </div>

    <p class="sr-only" aria-live="polite">
      {{ current ? $t("projectsPage.position", { title: current.title, current: currentNumber, total: count }) : "" }}
    </p>
    <nav class="sr-only" :aria-label="t('projectsPage.list')">
      <ul>
        <li v-for="project in projects" :key="project.id"><NuxtLink :to="project.to">{{ project.title }}</NuxtLink></li>
      </ul>
    </nav>
  </section>
</template>

<style scoped>
/* The slides are the projects wall's cards (16:9, 500px wide, 390px up to
   1024px, 285px up to 640px, in rem so they grow with the site past 1920px),
   no taller than the original's 35vh, 4vh apart; the margins
   clamp(12px, 3vw, 48px); its serif (PP Editorial New) is a licensed face,
   so Georgia, its own fallback, stands in. */
.slider {
  --card-w: min(31.25rem, 62vh);
  --card-h: calc(var(--card-w) * 9 / 16);
  --edge: clamp(0.75rem, 3vw, 3rem);
  --serif: Georgia, "Times New Roman", serif;
  --sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --ink: #111;
  --counter-end: 0px;
  position: fixed;
  inset: 0;
  z-index: 800;
  overflow: hidden;
  background: #f7f5f2;
  color: var(--ink);
  outline: none;
  touch-action: none;
  user-select: none;
}

/* The pictures fade in as the opening's text leaves (0.6 s), or after 4 s
   if the page's script never runs. */
.slider__stage {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: slider-stage-fallback 0.6s ease 4s forwards;
}

.slider.is-scripted .slider__stage {
  animation: none;
  transition: opacity 0.6s ease;
}

.slider.is-shown .slider__stage {
  opacity: 1;
}

@keyframes slider-stage-fallback {
  to { opacity: 1; }
}

@media (max-width: 1024px) {
  .slider {
    --card-w: min(24.375rem, 62vh);
  }
}

@media (max-width: 640px) {
  .slider {
    --card-w: min(17.8125rem, 62vh);
  }
}

/* Measured by the script for the slides' size. */
.slider__sizer {
  position: absolute;
  width: var(--card-w);
  height: 0;
  visibility: hidden;
  pointer-events: none;
}

.slider__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* The server's column: the cards on the centre line. */
.slider__fallback {
  --pos: 0;
  position: absolute;
  inset: 0;
}

.slider.has-gl .slider__fallback {
  display: none;
}

.slider__card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--card-w);
  height: var(--card-h);
  overflow: hidden;
  border-radius: 1.25rem;
  background: #e8e5e0;
  transform: translate(-50%, calc(-50% + (var(--index) - var(--pos)) * (var(--card-h) + 4vh)));
}

.slider__card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

/* The crosshair: from the counter to the column and from the column to
   "About", drawn out from their outer ends as the overlay comes in. */
.slider__line {
  position: absolute;
  top: 50%;
  height: 1px;
  background: rgb(17 17 17 / 0.18);
  pointer-events: none;
  scale: 0 1;
  transition: scale 0.7s cubic-bezier(0.33, 1, 0.68, 1) 0.18s;
}

.slider.is-live .slider__line {
  scale: 1 1;
}

/* They draw back while a slide is revealed. */
.slider.is-live.is-revealed .slider__line {
  scale: 0 1;
  transition: scale 0.45s cubic-bezier(0.32, 0, 0.67, 0);
}

.slider__line--left {
  left: calc(var(--counter-end) + clamp(1.25rem, 2.5vw, 2.5rem));
  right: calc(50% + var(--card-w) / 2 + clamp(3rem, 6vw, 6rem));
  transform-origin: left center;
}

.slider__line--right {
  left: calc(50% + var(--card-w) / 2 + clamp(3rem, 6vw, 6rem));
  right: calc(100% - var(--about-start, 100vw) + clamp(1.25rem, 2.5vw, 2.5rem));
  transform-origin: right center;
}

/* The diamond (white, inverted over whatever is under it). */
.slider__diamond {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: #fff;
  mix-blend-mode: difference;
  pointer-events: none;
  translate: -50% -50%;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.slider.is-live .slider__diamond {
  opacity: 1;
}

.slider__diamond-shape {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.5625rem;
  height: 0.5625rem;
  overflow: visible;
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  transform: translate(-50%, -50%) rotate(45deg);
  transition: width 0.55s cubic-bezier(0.22, 0.61, 0.36, 1), height 0.55s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.slider__diamond-shape rect {
  stroke-dasharray: 52;
  stroke-dashoffset: 52;
}

.slider.is-live .slider__diamond-shape rect {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 1.1s cubic-bezier(0.45, 0, 0.55, 1) 0.15s;
}

.slider__diamond-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.5rem;
  height: 0.5rem;
  background: currentColor;
  transform: translate(-50%, -50%) rotate(45deg) scale(0);
  transition: transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.slider__diamond.is-hover .slider__diamond-shape {
  width: 0.875rem;
  height: 0.875rem;
  transform: translate(-50%, -50%) rotate(0deg);
}

.slider__diamond.is-hover .slider__diamond-inner {
  transform: translate(-50%, -50%) rotate(90deg) scale(1);
}

.slider__diamond.is-expanded .slider__diamond-shape {
  width: 0.875rem;
  height: 0.875rem;
  transform: translate(-50%, -50%) rotate(-45deg);
}

.slider__diamond.is-expanded .slider__diamond-inner {
  transform: translate(-50%, -50%) rotate(135deg) scale(1);
}

/* "Discover" / "Explore": one line at a time, sliding up through a mask. */
.slider__hint {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 50%;
  display: inline-grid;
  grid-template-rows: 1.3em;
  font-family: var(--sans);
  font-size: clamp(0.625rem, 0.7vw, 0.75rem);
  line-height: 1.3;
  clip-path: inset(0);
  translate: -50% 0;
}

.slider__hint-line {
  grid-area: 1 / 1;
  letter-spacing: 0.22em;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
  translate: 0 calc(var(--line) * 100%);
  transition: translate 0.5s cubic-bezier(0.33, 1, 0.68, 1);
}

/* The counter. */
.slider__counter-wrap {
  position: absolute;
  top: 50%;
  left: var(--edge);
  display: flex;
  align-items: center;
  clip-path: inset(0 -100vw 0 0);
  translate: 0 -50%;
}

.slider__counter {
  display: inline-flex;
  align-items: center;
  margin: 0;
  font-family: var(--serif);
  font-size: clamp(1.25rem, 2.5vw, 2.5rem);
  font-style: italic;
  font-weight: 500;
  font-variant-numeric: lining-nums tabular-nums;
  line-height: 1;
  letter-spacing: -0.02em;
  translate: 0 50%;
  opacity: 0;
  transition: translate 0.45s cubic-bezier(0.5, 1, 0.89, 1) 0.06s, opacity 0.45s ease 0.06s;
}

.slider.is-live .slider__counter {
  translate: 0 0;
  opacity: 1;
}

.slider__digit {
  display: grid;
  grid-template-columns: 1ch;
  grid-template-rows: 1em;
  clip-path: inset(-0.06em -0.4em -0.06em 0);
}

.slider__digit > span {
  grid-area: 1 / 1;
  display: block;
  padding-top: 0.12em;
  line-height: 1;
}

.slider__counter-sep {
  display: block;
  height: 1em;
  padding-top: 0.12em;
  line-height: 1;
  white-space: pre;
}

.digit-enter-active,
.digit-leave-active {
  transition: translate 0.55s cubic-bezier(0.33, 1, 0.68, 1);
}

.digit-enter-from {
  translate: 0 100%;
}

.digit-leave-to {
  translate: 0 -100%;
}

/* The centred project's category: out (up) at once, the new one in from
   below 0.4 s after the counter settles. */
.slider__category-wrap {
  position: absolute;
  bottom: var(--edge);
  left: var(--edge);
  overflow: hidden;
}

.slider__category {
  display: block;
  font-family: var(--sans);
  font-size: clamp(0.5rem, 0.75vw, 0.875rem);
  line-height: 1.2;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  translate: 0 100%;
}

.slider.is-live .slider__category.is-in {
  translate: 0 0;
  transition: translate 0.5s cubic-bezier(0.5, 1, 0.89, 1);
}

.slider__category.is-out {
  translate: 0 -100%;
  transition: translate 0.3s cubic-bezier(0.32, 0, 0.67, 0);
}

.slider__category.is-reset {
  translate: 0 100%;
  transition: none;
}

/* The revealed slide's title (above it, at its left) and line (below it,
   at its right), each rising through a mask. */
.slider__title,
.slider__subtitle {
  position: absolute;
  z-index: 3;
  margin: 0;
  overflow: hidden;
  pointer-events: none;
}

.slider__title {
  font-family: var(--serif);
  font-size: clamp(2rem, 5vw, 5rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.slider__subtitle {
  max-width: 20rem;
  font-family: var(--sans);
  font-size: clamp(0.75rem, 1vw, 1rem);
  line-height: 1.4;
  text-align: right;
}

.slider__title > span,
.slider__subtitle > span {
  display: block;
  translate: 0 100%;
  transition: translate 0.3s cubic-bezier(0.32, 0, 0.67, 0);
}

.slider__title.is-on > span {
  translate: 0 0;
  transition: translate 0.6s cubic-bezier(0.5, 1, 0.89, 1) 0.3s;
}

.slider__subtitle.is-on > span {
  translate: 0 0;
  transition: translate 0.6s cubic-bezier(0.5, 1, 0.89, 1) 0.4s;
}

/* The minimap: a column of thumbnails at the right, the middle ones first. */
.slider__minimap {
  position: absolute;
  top: var(--edge);
  right: var(--edge);
  bottom: var(--edge);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
  pointer-events: none;
}

.slider__thumb {
  flex: 1;
  min-height: 0;
  /* With few projects a thumbnail stays a slim strip, as the original's. */
  max-height: calc(clamp(1.5rem, 2.5vw, 3rem) * 1.2);
  padding: 0;
  border: 0;
  background: none;
  opacity: 0.3;
  cursor: pointer;
  translate: 100% 0;
  transition: translate calc(0.85s - var(--stagger) * 1s) cubic-bezier(0.33, 1, 0.68, 1) calc(var(--stagger) * 1s), opacity 0.3s;
}

.slider__minimap.is-on {
  pointer-events: auto;
}

.slider__minimap.is-on .slider__thumb {
  translate: 0 0;
  transition-delay: calc(0.45s + var(--stagger) * 1s), 0s;
}

.slider__thumb.is-active {
  opacity: 1;
}

.slider__thumb:hover {
  opacity: 0.7;
}

.slider__thumb img {
  display: block;
  width: clamp(1.5rem, 2.5vw, 3rem);
  height: 100%;
  object-fit: cover;
}

/* The opening's name and line: left, half way down, each rising through a
   mask, and leaving upwards. */
.slider__intro {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 0 5vw;
  pointer-events: none;
}

.slider__intro p {
  margin: 0;
  overflow: hidden;
}

.slider__intro span {
  display: block;
  translate: 0 100%;
  animation: slider-intro-in 1s cubic-bezier(0.5, 1, 0.89, 1) forwards, slider-intro-out 0.5s cubic-bezier(0.32, 0, 0.67, 0) 3.5s forwards;
}

.slider.is-scripted .slider__intro span {
  animation: slider-intro-in 1s cubic-bezier(0.5, 1, 0.89, 1) forwards;
}

.slider__intro-name {
  font-family: var(--serif);
  font-size: clamp(2rem, 4vw, 4rem);
  font-weight: 400;
  line-height: 1.1;
}

.slider__intro-role {
  margin-top: 0.625rem !important;
  font-family: var(--sans);
  font-size: clamp(0.875rem, 1.25vw, 1.125rem);
  font-weight: 300;
  line-height: 1.3;
  opacity: 0.5;
}

.slider__intro-role span {
  animation-delay: 0.1s;
}

.slider.is-scripted .slider__intro.is-leaving span {
  translate: 0 0;
  animation: slider-intro-out 0.5s cubic-bezier(0.32, 0, 0.67, 0) forwards;
}

@keyframes slider-intro-in {
  to { translate: 0 0; }
}

@keyframes slider-intro-out {
  from { translate: 0 0; }
  to { translate: 0 -100%; }
}

/* Phones (the original's layout): the counter at the bottom centre with the
   category over it; no crosshair. */
@media (max-width: 768px) {
  .slider__line {
    display: none;
  }

  .slider__counter-wrap {
    top: auto;
    bottom: calc(var(--edge) + env(safe-area-inset-bottom, 0px));
    left: 50%;
    clip-path: inset(0 -100vw);
    translate: -50% 0;
  }

  .slider__counter {
    font-size: max(1.125rem, 2vw);
  }

  .slider__category-wrap {
    bottom: calc(var(--edge) + env(safe-area-inset-bottom, 0px) + 2.125rem);
    left: 50%;
    max-width: 60vw;
    text-align: center;
    translate: -50% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .slider__intro {
    display: none;
  }

  .slider__stage {
    opacity: 1;
    animation: none;
  }
}
</style>
