<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { Texture, Vector2 } from "three";
import OptImage from "~/components/ui/OptImage.vue";
import { optSources } from "~/utils/optImage";

// PROTOTYPE "Before / After lens" (/services/branding): the stage shows the
// brand before the rebranding; a round glass lens (a nod to the "O" of ONE)
// follows the pointer and shows the new identity inside it, magnified and bent
// like through real glass. One fullscreen quad and one fragment shader that
// samples both pictures; no 3D geometry. Without WebGL the same lens is drawn
// with CSS (the "after" picture clipped by a circle). The loop runs only while
// the stage is on screen and something moves (drift, easing, a tween).

type Pair = { before: string; after: string };
// Stand-ins from our own projects (the same pairs as home/BrandCompare.vue)
// until the real before/after shots of the rebrandings exist.
const PAIRS: Pair[] = [
  { before: "/home/threeLayerLocal/16.webp", after: "/home/threeLayerLocal/17.webp" },
  { before: "/home/threeLayerLocal/21.webp", after: "/home/threeLayerLocal/23.webp" },
  { before: "/home/threeLayerLocal/31.webp", after: "/home/threeLayerLocal/33.webp" },
  { before: "/home/threeLayerLocal/36.webp", after: "/home/threeLayerLocal/37.webp" },
];

type Copy = {
  title: string; text: string; before: string; after: string; stage: string; help: string;
  prev: string; next: string; pair: string; smaller: string; bigger: string; reveal: string; unreveal: string;
};
const COPY: Record<string, Copy> = {
  en: {
    title: "See the rebrand through the lens",
    text: "Move the lens: outside is the brand before, inside is what we made of it.",
    before: "Before",
    after: "After",
    stage: "Before and after lens",
    help: "Move the pointer over the picture or drag the lens. Arrow keys move it, Enter shows the whole new version, plus and minus change its size.",
    prev: "Previous example",
    next: "Next example",
    pair: "Example {n} of {total}",
    smaller: "Smaller lens",
    bigger: "Bigger lens",
    reveal: "Show all",
    unreveal: "Back to lens",
  },
  ru: {
    title: "Посмотрите на ребрендинг через линзу",
    text: "Двигайте линзу: снаружи — бренд до, внутри — то, что мы из него сделали.",
    before: "До",
    after: "После",
    stage: "Линза «до и после»",
    help: "Ведите курсором по картинке или перетаскивайте линзу пальцем. Стрелки двигают её, Enter показывает новую версию целиком, плюс и минус меняют размер.",
    prev: "Предыдущий пример",
    next: "Следующий пример",
    pair: "Пример {n} из {total}",
    smaller: "Уменьшить линзу",
    bigger: "Увеличить линзу",
    reveal: "Показать целиком",
    unreveal: "Вернуть линзу",
  },
  uz: {
    title: "Rebrendingni linza orqali koʻring",
    text: "Linzani suring: tashqarida — brendning avvalgi koʻrinishi, ichida — biz yaratgan yangi qiyofa.",
    before: "Oldin",
    after: "Keyin",
    stage: "Oldin va keyin linzasi",
    help: "Linzani surish uchun kursorni rasm ustida yurgizing yoki barmogʻingiz bilan torting. Strelkalar uni suradi, Enter yangi koʻrinishni toʻliq ochadi, plyus va minus oʻlchamini oʻzgartiradi.",
    prev: "Oldingi misol",
    next: "Keyingi misol",
    pair: "{n}-misol, jami {total} ta",
    smaller: "Linzani kichraytirish",
    bigger: "Linzani kattalashtirish",
    reveal: "Toʻliq koʻrsatish",
    unreveal: "Linzaga qaytish",
  },
};

const { locale } = useI18n();
const route = useRoute();
const copy = computed(() => COPY[locale.value] ?? COPY.en!);
const pairLabel = (i: number) => copy.value.pair.replace("{n}", String(i + 1)).replace("{total}", String(PAIRS.length));

// The lens radius is a share of the stage height; the stage is 16:9 at any width.
const RADIUS_MIN = 0.14;
const RADIUS_MAX = 0.46;
const RADIUS_STEP = 1.18;
// Glass: magnification at the centre, squeeze towards the rim, colour split at the rim.
const ZOOM = 1.14;
const BARREL = 0.28;
const ABERRATION = 0.012;
// The CSS lens can only magnify.
const CSS_ZOOM = 1.08;
// After the last input the lens waits this long before drifting again.
const IDLE_RESUME_MS = 5000;
// The CSS fallback's pictures: the frame's width (the page frame is 82.5rem less its gutters).
const SIZES = "(max-width: 899px) calc(100vw - 2.5rem), min(77.5rem, 94vw)";

const stage = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const beforeTag = ref<HTMLElement | null>(null);
const afterTag = ref<HTMLElement | null>(null);
// "pending" until onMounted has probed WebGL; "gl" also while the textures load.
const mode = ref<"pending" | "gl" | "css">("pending");
const glReady = ref(false);
// `index` is the pair picked (dots, live region); `shown` the one on the stage,
// which changes only while the lens is closed.
const index = ref(0);
const shown = ref(0);
const revealed = ref(false);
const canGrow = ref(true);
const canShrink = ref(true);
const pair = computed(() => PAIRS[shown.value]!);
const counter = computed(() => pairLabel(index.value));
// A tiny blurred copy of the "before" picture fills the stage until the first frame.
const placeholderStyle = computed(() => {
  const lqip = optSources(pair.value.before)?.lqip;
  return lqip ? { backgroundImage: `url(${lqip})` } : undefined;
});

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeInCubic = (t: number) => t * t * t;
const easeOutBack = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const clampRadius = (v: number) => clamp(v, RADIUS_MIN, RADIUS_MAX);

// Lens state in stage fractions: x/y of the width/height, r of the height;
// t* are the targets the lens eases to. `reveal` grows it over the whole stage,
// `open` closes it to a point while the pair changes.
const lens = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, r: 0.3, tr: 0.3, reveal: 0, open: 1 };
const size = { w: 1, h: 1 };

let reducedMotion = false;
let disposed = false;
let visible = true;
let raf = 0;
let last = 0;
let idleTimer: number | undefined;
// The renderer in use: draws the current state, returns whether the tags still move.
let draw: ((dt: number) => boolean) | null = null;
let onResize: (() => void) | null = null;
// WebGL loads a pair's textures before the lens reopens (`prepare`) and binds them (`commit`).
let prepare: ((i: number) => Promise<void>) | null = null;
let commit: ((i: number) => void) | null = null;
let stopGl: (() => void) | null = null;
const cleanups: (() => void)[] = [];

// Timed tweens for `reveal` and `open`; a newer tween of the same key ends the
// older one (its promise resolves; the caller checks whether it is still current).
type TweenKey = "reveal" | "open";
type Tween = { from: number; to: number; start: number; duration: number; ease: (t: number) => number; done: () => void };
const tweens = new Map<TweenKey, Tween>();
const tween = (key: TweenKey, to: number, seconds: number, ease: (t: number) => number) =>
  new Promise<void>((resolve) => {
    tweens.get(key)?.done();
    tweens.delete(key);
    // Nothing would draw the tween off screen or with reduced motion: jump to the end.
    if (reducedMotion || !visible || document.hidden || !draw) {
      lens[key] = to;
      kick();
      resolve();
      return;
    }
    tweens.set(key, { from: lens[key], to, start: performance.now(), duration: seconds * 1000, ease, done: resolve });
    kick();
  });

// Input: drift stops while the visitor hovers, drags or tabs to the stage, and
// comes back a while after the last input.
let hovering = false;
let dragging = false;
let focused = false;
let lastInput = Number.NEGATIVE_INFINITY;
let lastScroll = Number.NEGATIVE_INFINITY;
let wheelArmed = false;
let lastWheelResize = Number.NEGATIVE_INFINITY;
let lastClient = { x: Number.NaN, y: Number.NaN };
let down: { id: number; cx: number; cy: number; t: number; lx: number; ly: number; moved: boolean } | null = null;
let driftActive = false;
let driftStart = 0;
let driftTime = 0;

const kick = () => {
  if (raf || !visible || document.hidden || !draw || disposed) return;
  raf = requestAnimationFrame(frame);
};

const markInput = () => {
  lastInput = performance.now();
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(kick, IDLE_RESUME_MS + 50);
  kick();
};

// Advances the state by dt seconds; true while anything is still moving.
const step = (dt: number, now: number) => {
  const drift = !reducedMotion && !hovering && !dragging && !focused && !revealed.value && now - lastInput > IDLE_RESUME_MS;
  if (drift && !driftActive) driftStart = now;
  driftActive = drift;
  let busy = drift;
  let follow: number;
  if (drift) {
    // A slow Lissajous path that starts at the centre. The lens eases onto it
    // gently, so resuming from wherever the visitor left it is not a jump.
    driftTime += dt;
    lens.tx = 0.5 + 0.27 * Math.sin(driftTime * 0.35) + 0.06 * Math.sin(driftTime * 0.83);
    lens.ty = 0.5 + 0.2 * Math.sin(driftTime * 0.52);
    const ramp = Math.min(1, (now - driftStart) / 2500);
    follow = 1 - Math.exp(-(0.3 + 2.2 * ramp * ramp) * dt);
  } else {
    follow = reducedMotion ? 1 : 1 - Math.exp(-16 * dt);
  }
  lens.x += (lens.tx - lens.x) * follow;
  lens.y += (lens.ty - lens.y) * follow;
  lens.r += (lens.tr - lens.r) * (reducedMotion ? 1 : 1 - Math.exp(-12 * dt));
  if (Math.abs(lens.tx - lens.x) + Math.abs(lens.ty - lens.y) > 2e-4 || Math.abs(lens.tr - lens.r) > 2e-4) busy = true;
  else if (!drift) {
    lens.x = lens.tx;
    lens.y = lens.ty;
    lens.r = lens.tr;
  }
  for (const [key, tw] of tweens) {
    const t = clamp01((now - tw.start) / tw.duration);
    lens[key] = tw.from + (tw.to - tw.from) * tw.ease(t);
    if (t >= 1) {
      tweens.delete(key);
      tw.done();
    } else busy = true;
  }
  return busy;
};

const frame = (now: number) => {
  raf = 0;
  if (!visible || document.hidden || !draw) {
    last = 0;
    return;
  }
  const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
  last = now;
  const busy = step(dt, now);
  const tagsBusy = draw(dt);
  if (busy || tagsBusy) kick();
  else last = 0;
};

// The lens in stage pixels. Revealing grows it to the farthest corner (plus
// the glow), so the new picture covers the stage wherever the lens is.
const lensGeometry = () => {
  const { w, h } = size;
  const cx = lens.x * w;
  const cy = lens.y * h;
  const base = lens.r * h;
  const cover = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 48;
  const radius = Math.max(0, (base + (cover - base) * lens.reveal) * lens.open);
  return { cx, cy, radius };
};

// "Before" sits outside the lens on the first diagonal with room for it (and
// trails the lens a little); "After" sits inside, above the bottom of the rim.
const tagSize = { bw: 0, bh: 0, aw: 0, ah: 0 };
const tagPos = { x: 0, y: 0, shown: false, corner: -1 };
const measureTags = () => {
  tagSize.bw = beforeTag.value?.offsetWidth ?? 0;
  tagSize.bh = beforeTag.value?.offsetHeight ?? 0;
  tagSize.aw = afterTag.value?.offsetWidth ?? 0;
  tagSize.ah = afterTag.value?.offsetHeight ?? 0;
};
const placeTags = ({ cx, cy, radius }: { cx: number; cy: number; radius: number }, dt: number) => {
  const b = beforeTag.value;
  const a = afterTag.value;
  if (!b || !a) return false;
  if (!tagSize.bw) measureTags();
  const { w, h } = size;
  const { bw, bh, aw, ah } = tagSize;
  const pad = w < 600 ? 8 : 14;
  const k = radius * 0.71 + 6;
  const spots: [number, number][] = [
    [cx - k - bw, cy - k - bh],
    [cx + k, cy - k - bh],
    [cx - k - bw, cy + k],
    [cx + k, cy + k],
  ];
  const corner = spots.findIndex(([x, y]) => x >= pad && y >= pad && x + bw <= w - pad && y + bh <= h - pad);
  const spot = spots[corner];
  // Gone as soon as the lens starts to grow over the stage.
  const showBefore = !!spot && lens.reveal < 0.02 && lens.open > 0.6;
  let busy = false;
  if (spot) {
    // It trails the lens within a corner but jumps to another corner, so it
    // never slides across the lens.
    if (!tagPos.shown || corner !== tagPos.corner || reducedMotion || dt >= 1) {
      tagPos.x = spot[0];
      tagPos.y = spot[1];
    } else {
      const f = 1 - Math.exp(-14 * dt);
      tagPos.x += (spot[0] - tagPos.x) * f;
      tagPos.y += (spot[1] - tagPos.y) * f;
      busy = Math.abs(spot[0] - tagPos.x) + Math.abs(spot[1] - tagPos.y) > 0.5;
    }
    b.style.transform = `translate3d(${tagPos.x.toFixed(1)}px, ${tagPos.y.toFixed(1)}px, 0)`;
  }
  tagPos.shown = showBefore;
  tagPos.corner = corner;
  b.style.opacity = showBefore ? "1" : "0";

  const ax = clamp(cx - aw / 2, pad, w - pad - aw);
  const ay = clamp(cy + radius - ah - Math.max(10, radius * 0.12), pad, h - pad - ah);
  a.style.transform = `translate3d(${ax.toFixed(1)}px, ${ay.toFixed(1)}px, 0)`;
  a.style.opacity = radius > ah * 2.6 && lens.open > 0.6 ? "1" : "0";
  return busy;
};

const setRadius = (value: number) => {
  lens.tr = clampRadius(value);
  canGrow.value = lens.tr < RADIUS_MAX - 1e-3;
  canShrink.value = lens.tr > RADIUS_MIN + 1e-3;
};

const resize = (factor: number) => {
  setRadius(lens.tr * factor);
  markInput();
};

const toggleReveal = () => {
  revealed.value = !revealed.value;
  markInput();
  void tween("reveal", revealed.value ? 1 : 0, 0.9, easeInOutCubic);
};

// The lens closes (and the stage dims), the pair changes, the lens pops open.
let switchId = 0;
const showPair = async (i: number) => {
  if (i === index.value) return;
  index.value = i;
  const id = ++switchId;
  const loading = prepare?.(i);
  await tween("open", 0, 0.32, easeInCubic);
  await loading;
  if (id !== switchId || disposed) return;
  shown.value = i;
  commit?.(i);
  // CSS lens: the new <img> elements are in place before it opens.
  await nextTick();
  if (id !== switchId || disposed) return;
  void tween("open", 1, 0.6, easeOutBack);
};
const go = (stepBy: number) => void showPair((index.value + stepBy + PAIRS.length) % PAIRS.length);

const stopDrift = () => {
  if (!driftActive) return;
  lens.tx = lens.x;
  lens.ty = lens.y;
  driftActive = false;
};

const onPointerMove = (event: PointerEvent) => {
  const host = stage.value;
  if (!host) return;
  if (down && down.id === event.pointerId && !down.moved && Math.hypot(event.clientX - down.cx, event.clientY - down.cy) > 6) down.moved = true;
  const rect = host.getBoundingClientRect();
  if (event.pointerType === "mouse") {
    // Chrome sends a still pointermove when the page scrolls under the cursor:
    // only a real move steers the lens (and arms the wheel).
    if (event.clientX === lastClient.x && event.clientY === lastClient.y) return;
    lastClient = { x: event.clientX, y: event.clientY };
    hovering = true;
    if (performance.now() - lastScroll > 250) wheelArmed = true;
    lens.tx = clamp01((event.clientX - rect.left) / rect.width);
    lens.ty = clamp01((event.clientY - rect.top) / rect.height);
    markInput();
  } else if (dragging && down && down.id === event.pointerId) {
    // Touch drags the lens by the finger's travel instead of putting it under
    // the finger, where it could not be seen.
    lens.tx = clamp01(down.lx + (event.clientX - down.cx) / rect.width);
    lens.ty = clamp01(down.ly + (event.clientY - down.cy) / rect.height);
    markInput();
  }
};

const onPointerDown = (event: PointerEvent) => {
  if (event.button > 0 || !stage.value) return;
  stopDrift();
  down = { id: event.pointerId, cx: event.clientX, cy: event.clientY, t: performance.now(), lx: lens.tx, ly: lens.ty, moved: false };
  if (event.pointerType !== "mouse") {
    dragging = true;
    stage.value.setPointerCapture(event.pointerId);
  }
  markInput();
};

const onPointerUp = (event: PointerEvent) => {
  if (!down || down.id !== event.pointerId || !stage.value) return;
  const tap = !down.moved && performance.now() - down.t < 500;
  down = null;
  dragging = false;
  if (tap) {
    // A click toggles the full view (the mouse's lens is under the cursor);
    // a tap does so on the lens and moves the lens anywhere else.
    const rect = stage.value.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const { cx, cy, radius } = lensGeometry();
    if (event.pointerType === "mouse" || revealed.value || Math.hypot(px - cx, py - cy) <= radius) toggleReveal();
    else {
      lens.tx = clamp01(px / rect.width);
      lens.ty = clamp01(py / rect.height);
    }
  }
  markInput();
};

const onPointerCancel = () => {
  down = null;
  dragging = false;
  markInput();
};

const onPointerLeave = (event: PointerEvent) => {
  if (event.pointerType !== "mouse") return;
  hovering = false;
  wheelArmed = false;
  markInput();
};

// The wheel resizes the lens only once the visitor has moved the mouse over
// the stage (so scrolling past it never gets stuck), and lets the page scroll
// on at either size limit. A trackpad pinch (ctrlKey) always resizes.
const onWheel = (event: WheelEvent) => {
  if (lens.reveal > 0.01 || (!wheelArmed && !event.ctrlKey)) return;
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
  const next = clampRadius(lens.tr * Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0012)));
  const now = performance.now();
  // At a limit the page scrolls, but not on the tail of the gesture that
  // resized the lens (a trackpad keeps sending wheel events for a while).
  const atLimit = Math.abs(next - lens.tr) < 1e-4;
  if (atLimit && now - lastWheelResize > 350) return;
  event.preventDefault();
  // Lenis listens for the wheel on the window: keep it from scrolling the page as well.
  event.stopPropagation();
  if (atLimit) return;
  lastWheelResize = now;
  setRadius(next);
  markInput();
};

const onKeydown = (event: KeyboardEvent) => {
  const move = event.shiftKey ? 0.12 : 0.04;
  // The same distance in pixels both ways.
  const aspect = size.w / size.h || 16 / 9;
  stopDrift();
  switch (event.key) {
    case "ArrowLeft": lens.tx = clamp01(lens.tx - move); break;
    case "ArrowRight": lens.tx = clamp01(lens.tx + move); break;
    case "ArrowUp": lens.ty = clamp01(lens.ty - move * aspect); break;
    case "ArrowDown": lens.ty = clamp01(lens.ty + move * aspect); break;
    case "Enter":
    case " ": toggleReveal(); break;
    case "+":
    case "=": resize(RADIUS_STEP); break;
    case "-":
    case "_": resize(1 / RADIUS_STEP); break;
    default: return;
  }
  event.preventDefault();
  markInput();
};

// Keyboard focus holds the lens still; focus from a click does not.
const onFocus = () => {
  focused = !!stage.value?.matches(":focus-visible");
  if (focused) stopDrift();
};
const onBlur = () => {
  focused = false;
  markInput();
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    // Decoded before the upload, so the first draw does not decode on the main thread.
    image.onload = () => void image.decode().then(() => resolve(image), () => resolve(image));
    image.onerror = () => resolve(null);
    image.src = src;
  });

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Works in drawing-buffer pixels (gl_FragCoord, origin bottom left). Colours
// stay in the pictures' own sRGB values from texture to screen, so the stage
// matches the <img> fallback exactly.
const fragmentShader = /* glsl */ `
  uniform sampler2D uBefore;
  uniform sampler2D uAfter;
  uniform vec2 uResolution;
  uniform vec2 uBeforeScale;
  uniform vec2 uAfterScale;
  uniform vec2 uCenter;
  uniform float uRadius;
  uniform float uDpr;
  uniform float uZoom;
  uniform float uBarrel;
  uniform float uAberration;
  uniform float uGlass;
  uniform float uShade;
  uniform vec3 uGreen;

  // object-fit: cover around the stage centre.
  vec2 coverUv(vec2 px, vec2 scale) {
    return (px / uResolution - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 px = gl_FragCoord.xy;
    vec2 d = px - uCenter;
    float dist = length(d);
    float radius = max(uRadius, 1e-3);
    float r = dist / radius;
    // The glass details fade in as the lens opens, so a closed lens leaves no dot.
    float presence = smoothstep(0.0, 24.0 * uDpr, uRadius) * uGlass;

    // Outside: the old brand under the glass's soft shadow (light from the
    // top left, so it falls down and to the right).
    vec3 color = texture2D(uBefore, coverUv(px, uBeforeScale)).rgb;
    float shadow = 1.0 - smoothstep(0.9, 1.4, length(d - vec2(0.05, -0.08) * radius) / radius);
    color *= 1.0 - shadow * 0.5 * presence;

    // Inside: the new brand through a glass dome. The sampling scale is below
    // 1 at the centre (magnified) and grows towards the rim (barrel
    // distortion), where red and blue part a little (chromatic aberration).
    float r2 = r * r;
    float scale = (1.0 + uBarrel * r2 * r2) / uZoom;
    float split = uAberration * smoothstep(0.4, 1.0, r);
    vec3 inside;
    inside.r = texture2D(uAfter, coverUv(uCenter + d * scale * (1.0 + split), uAfterScale)).r;
    inside.g = texture2D(uAfter, coverUv(uCenter + d * scale, uAfterScale)).g;
    inside.b = texture2D(uAfter, coverUv(uCenter + d * scale * (1.0 - split), uAfterScale)).b;

    // Glass shading: darker where the glass is thick, a soft window reflection
    // and a bright arc at the top left, a hint of brand green along the edge.
    vec2 p = d / radius;
    vec2 n = dist > 0.0 ? d / dist : vec2(0.0);
    float facing = 0.5 + 0.5 * dot(n, vec2(-0.7071, 0.7071));
    inside *= 1.0 - 0.2 * smoothstep(0.72, 1.0, r) * uGlass;
    float sheen = 1.0 - smoothstep(0.0, 0.55, length((p - vec2(-0.36, 0.42)) * vec2(1.0, 1.6)));
    inside += sheen * sheen * 0.14 * uGlass;
    float arc = smoothstep(0.76, 0.9, r) * (1.0 - smoothstep(0.9, 0.97, r)) * pow(facing, 4.0);
    inside += arc * 0.22 * uGlass;
    inside = mix(inside, uGreen, smoothstep(0.88, 1.0, r) * 0.16 * uGlass);

    float mask = clamp((radius - dist) / uDpr + 0.5, 0.0, 1.0) * step(0.5, uRadius);
    color = mix(color, inside, mask);

    // Rim: a thin bright line, strongest towards the light.
    float line = 1.0 - smoothstep(0.0, 1.25 * uDpr, abs(dist - (radius - uDpr)));
    color += line * (0.35 + 0.65 * facing) * 0.9 * presence;

    // Brand-green glow just outside the rim.
    float glow = exp(-max(dist - radius, 0.0) / (16.0 * uDpr)) * (1.0 - mask);
    color += uGreen * glow * 0.5 * presence;

    gl_FragColor = vec4(color * uShade, 1.0);
  }
`;

// The stage dims while the lens is closed, which hides the cut between pairs.
const shadeOf = (open: number) => 0.3 + 0.7 * clamp01(open);

const startCss = () => {
  mode.value = "css";
  prepare = null;
  commit = null;
  shown.value = index.value;
  draw = (dt) => {
    const host = stage.value;
    if (!host) return false;
    const g = lensGeometry();
    host.style.setProperty("--lens-x", `${g.cx.toFixed(1)}px`);
    host.style.setProperty("--lens-y", `${g.cy.toFixed(1)}px`);
    host.style.setProperty("--lens-r", `${g.radius.toFixed(1)}px`);
    host.style.setProperty("--lens-zoom", (1 + (CSS_ZOOM - 1) * (1 - lens.reveal)).toFixed(3));
    host.style.setProperty("--lens-glass", clamp01(1 - lens.reveal).toFixed(3));
    host.style.setProperty("--lens-shade", shadeOf(lens.open).toFixed(3));
    return placeTags(g, dt);
  };
  void nextTick(() => {
    measureTags();
    kick();
  });
};

const startGl = async (host: HTMLElement, el: HTMLCanvasElement) => {
  mode.value = "gl";
  const THREE = await import("three");
  if (disposed) return;

  const renderer = new THREE.WebGLRenderer({ canvas: el, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x0b0b0b, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const blank = new THREE.DataTexture(new Uint8Array([11, 11, 11, 255]), 1, 1);
  blank.needsUpdate = true;

  const uniforms = {
    uBefore: { value: blank as Texture },
    uAfter: { value: blank as Texture },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uBeforeScale: { value: new THREE.Vector2(1, 1) },
    uAfterScale: { value: new THREE.Vector2(1, 1) },
    uCenter: { value: new THREE.Vector2() },
    uRadius: { value: 0 },
    uDpr: { value: 1 },
    uZoom: { value: ZOOM },
    uBarrel: { value: BARREL },
    uAberration: { value: ABERRATION },
    uGlass: { value: 1 },
    uShade: { value: 1 },
    // Raw sRGB (a THREE.Color would be converted to linear).
    uGreen: { value: new THREE.Vector3(0x20 / 255, 0xe8 / 255, 0x48 / 255) },
  };
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  let bufferScale = 1;
  onResize = () => {
    renderer.setSize(size.w, size.h, false);
    renderer.getDrawingBufferSize(uniforms.uResolution.value);
    bufferScale = uniforms.uResolution.value.x / Math.max(1, size.w);
    uniforms.uDpr.value = bufferScale;
  };
  onResize();

  // Textures are sized to the stage: the smallest WebP copy at least as wide
  // as the drawing buffer (1600px at most).
  type Loaded = { texture: Texture; aspect: number };
  const textures = new Map<string, Promise<Loaded | null>>();
  const loadTexture = (src: string) => {
    let job = textures.get(src);
    if (!job) {
      const url = optSources(src, { fallbackWidth: Math.round(size.w * bufferScale) })?.fallback ?? src;
      job = loadImage(url).then((image) => {
        if (!image) return null;
        const texture = new THREE.Texture(image);
        texture.needsUpdate = true;
        return { texture, aspect: image.naturalWidth / image.naturalHeight };
      });
      textures.set(src, job);
    }
    return job;
  };
  const ready = new Map<number, [Loaded | null, Loaded | null]>();
  const jobs = new Map<number, Promise<void>>();
  const prepareGl = (i: number) => {
    let job = jobs.get(i);
    if (!job) {
      const p = PAIRS[i]!;
      job = Promise.all([loadTexture(p.before), loadTexture(p.after)]).then((pair) => void ready.set(i, pair));
      jobs.set(i, job);
    }
    return job;
  };
  let current: (Loaded | null)[] = [];
  let beforeAspect = 16 / 9;
  let afterAspect = 16 / 9;
  const commitGl = (i: number) => {
    const next = ready.get(i);
    if (!next) return;
    // Only the pair on screen stays on the GPU; three.js uploads a disposed
    // texture again if its pair comes back.
    for (const old of current) if (old && !next.includes(old)) old.texture.dispose();
    current = next;
    uniforms.uBefore.value = next[0]?.texture ?? blank;
    uniforms.uAfter.value = next[1]?.texture ?? blank;
    beforeAspect = next[0]?.aspect ?? 16 / 9;
    afterAspect = next[1]?.aspect ?? 16 / 9;
    // Warm the next pair so the switch does not wait on the network.
    void prepareGl((i + 1) % PAIRS.length);
  };

  const cover = (target: Vector2, imageAspect: number, stageAspect: number) =>
    stageAspect > imageAspect ? target.set(1, imageAspect / stageAspect) : target.set(stageAspect / imageAspect, 1);

  const drawGl = (dt: number) => {
    const g = lensGeometry();
    const glass = clamp01(1 - lens.reveal);
    uniforms.uCenter.value.set(g.cx * bufferScale, (size.h - g.cy) * bufferScale);
    uniforms.uRadius.value = g.radius * bufferScale;
    // Fully revealed, the new picture is shown flat: no magnification or rim.
    uniforms.uGlass.value = glass;
    uniforms.uZoom.value = 1 + (ZOOM - 1) * glass;
    uniforms.uBarrel.value = BARREL * glass;
    uniforms.uAberration.value = ABERRATION * glass;
    uniforms.uShade.value = shadeOf(lens.open);
    const aspect = size.w / Math.max(1, size.h);
    cover(uniforms.uBeforeScale.value, beforeAspect, aspect);
    cover(uniforms.uAfterScale.value, afterAspect, aspect);
    renderer.render(scene, camera);
    if (!glReady.value) glReady.value = true;
    return placeTags(g, dt);
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    stopGl?.();
    startCss();
  };
  el.addEventListener("webglcontextlost", onLost);

  stopGl = () => {
    stopGl = null;
    el.removeEventListener("webglcontextlost", onLost);
    draw = null;
    onResize = null;
    prepare = null;
    commit = null;
    glReady.value = false;
    for (const job of textures.values()) void job.then((loaded) => loaded?.texture.dispose());
    blank.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };

  // The visitor may have picked another pair while the first one loaded.
  let first = index.value;
  await prepareGl(first);
  while (first !== index.value && !disposed) {
    first = index.value;
    await prepareGl(first);
  }
  if (disposed || !stopGl) return;
  shown.value = first;
  commitGl(first);
  prepare = prepareGl;
  commit = commitGl;
  draw = drawGl;
  measureTags();
  kick();
};

onMounted(async () => {
  const host = stage.value;
  const el = canvas.value;
  if (!host || !el) return;
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  size.w = host.clientWidth || 1;
  size.h = host.clientHeight || 1;
  // Phones: a short stage, so the lens takes a larger share of it.
  lens.r = size.h < 320 ? 0.36 : 0.3;
  setRadius(lens.r);

  // Draw only while the stage is on screen and the tab is visible.
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    kick();
  }, { rootMargin: "100px 0px" });
  observer.observe(host);
  // A resize clears the canvas: redraw at once (no waiting for a frame).
  const resizeObserver = new ResizeObserver(() => {
    size.w = host.clientWidth || 1;
    size.h = host.clientHeight || 1;
    onResize?.();
    measureTags();
    draw?.(1);
  });
  resizeObserver.observe(host);
  const onVisibility = () => kick();
  document.addEventListener("visibilitychange", onVisibility);
  const onScroll = () => {
    lastScroll = performance.now();
    wheelArmed = false;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  cleanups.push(() => {
    observer.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("scroll", onScroll);
  });

  // ?lens=css shows the fallback on a WebGL machine (for testing).
  const probe = route.query.lens === "css" ? null : document.createElement("canvas").getContext("webgl2");
  probe?.getExtension("WEBGL_lose_context")?.loseContext();
  if (!probe) {
    startCss();
    return;
  }
  try {
    await startGl(host, el);
  } catch (error) {
    console.warn("[OneLens] WebGL lens failed, using the CSS lens.", error);
    stopGl?.();
    if (!disposed) startCss();
  }
});

onBeforeUnmount(() => {
  disposed = true;
  cancelAnimationFrame(raf);
  raf = 0;
  window.clearTimeout(idleTimer);
  for (const tw of tweens.values()) tw.done();
  tweens.clear();
  cleanups.forEach((fn) => fn());
  stopGl?.();
  draw = null;
});
</script>


<template>
  <section class="one-lens" aria-labelledby="one-lens-title">
    <div class="one-lens__head">
      <h2 id="one-lens-title" v-blur-reveal class="one-lens__title">{{ copy.title }}</h2>
      <p v-rise class="one-lens__text">{{ copy.text }}</p>
    </div>

    <div
      ref="stage"
      v-rise
      class="one-lens__stage"
      tabindex="0"
      role="group"
      :aria-label="`${copy.stage}. ${counter}`"
      aria-describedby="one-lens-help"
      @pointermove="onPointerMove"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @pointerleave="onPointerLeave"
      @wheel="onWheel"
      @keydown="onKeydown"
      @focus="onFocus"
      @blur="onBlur"
    >
      <div v-if="mode !== 'css'" class="one-lens__placeholder" :style="placeholderStyle" />
      <template v-else>
        <OptImage :key="`before-${shown}`" class="one-lens__img" :src="pair.before" :sizes="SIZES" alt="" width="1600" height="900" decoding="async" draggable="false" />
        <div class="one-lens__after">
          <OptImage :key="`after-${shown}`" class="one-lens__img one-lens__img--zoom" :src="pair.after" :sizes="SIZES" alt="" width="1600" height="900" decoding="async" draggable="false" />
        </div>
        <div class="one-lens__ring" />
      </template>
      <canvas ref="canvas" class="one-lens__canvas" :class="{ 'is-ready': glReady }" aria-hidden="true" />
      <span ref="beforeTag" class="one-lens__tag" aria-hidden="true">{{ copy.before }}</span>
      <span ref="afterTag" class="one-lens__tag one-lens__tag--after" aria-hidden="true">{{ copy.after }}</span>
    </div>
    <p id="one-lens-help" class="one-lens__sr">{{ copy.help }}</p>

    <div v-rise class="one-lens__controls">
      <div class="one-lens__pairs">
        <button type="button" class="one-lens__icon" :aria-label="copy.prev" @click="go(-1)">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div class="one-lens__dots">
          <button
            v-for="(item, i) in PAIRS"
            :key="item.after"
            type="button"
            class="one-lens__dot"
            :class="{ 'is-active': i === index }"
            :aria-label="pairLabel(i)"
            :aria-current="i === index ? 'true' : undefined"
            @click="showPair(i)"
          />
        </div>
        <button type="button" class="one-lens__icon" :aria-label="copy.next" @click="go(1)">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div class="one-lens__tools">
        <button type="button" class="one-lens__icon" :aria-label="copy.smaller" :disabled="!canShrink || revealed" @click="resize(1 / RADIUS_STEP)">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 12h12" /></svg>
        </button>
        <button type="button" class="one-lens__icon" :aria-label="copy.bigger" :disabled="!canGrow || revealed" @click="resize(RADIUS_STEP)">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 6v12M6 12h12" /></svg>
        </button>
        <button type="button" class="one-lens__toggle" @click="toggleReveal">
          <svg v-if="revealed" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="6.5" /></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          <span>{{ revealed ? copy.unreveal : copy.reveal }}</span>
        </button>
      </div>
    </div>
    <p class="one-lens__sr" aria-live="polite">{{ counter }}</p>
  </section>
</template>

<style scoped>
/* Sits between the service hero and its intro, on the page's black canvas,
   with the spacing and type steps of the page's sections (service-page.css). */
.one-lens {
  margin-top: 7.5rem;
}

.one-lens__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: end;
  gap: 1rem 4rem;
  margin-bottom: 2.5rem;
}

.one-lens__title {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: var(--type-h3-size);
  line-height: var(--type-h3-lh);
  letter-spacing: var(--type-h3-ls);
  font-weight: 600;
}

.one-lens__text {
  max-width: var(--type-measure);
  margin: 0;
  color: #c9cbce;
  font-family: var(--app-font-sans);
  font-size: var(--type-lead-size);
  line-height: var(--type-lead-lh);
  letter-spacing: var(--type-lead-ls);
}

/* The pointer only steers the lens here, so touch-action is off on the stage
   alone: the page around it scrolls as usual. */
.one-lens__stage {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  isolation: isolate;
  border-radius: 1.875rem;
  background: #0b0b0b;
  cursor: crosshair;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.one-lens__stage:focus-visible {
  outline: 0.125rem solid #20e848;
  outline-offset: 0.25rem;
}

.one-lens__placeholder {
  position: absolute;
  inset: 0;
  background: #0b0b0b center / cover no-repeat;
  filter: blur(0.75rem);
  transform: scale(1.06);
}

.one-lens__canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
}

.one-lens__canvas.is-ready {
  opacity: 1;
}

/* The CSS lens (no WebGL): the "after" picture clipped by a circle and
   slightly magnified around its centre; the variables come from the loop. */
.one-lens__img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  filter: brightness(var(--lens-shade, 1));
}

.one-lens__after {
  position: absolute;
  inset: 0;
  clip-path: circle(var(--lens-r, 0px) at var(--lens-x, 50%) var(--lens-y, 50%));
}

.one-lens__img--zoom {
  transform: scale(var(--lens-zoom, 1));
  transform-origin: var(--lens-x, 50%) var(--lens-y, 50%);
}

.one-lens__ring {
  position: absolute;
  top: calc(var(--lens-y, 50%) - var(--lens-r, 0px));
  left: calc(var(--lens-x, 50%) - var(--lens-r, 0px));
  width: calc(var(--lens-r, 0px) * 2);
  height: calc(var(--lens-r, 0px) * 2);
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.8),
    inset 0 0 1.5rem rgb(32 232 72 / 0.22),
    0 0 0 1px rgb(32 232 72 / 0.5),
    0 0 2rem 0.25rem rgb(32 232 72 / 0.35),
    0.6rem 1.1rem 2.5rem rgb(0 0 0 / 0.45);
  opacity: var(--lens-glass, 1);
  pointer-events: none;
}

/* "Before" / "After": placed by the loop (transform), faded by opacity. */
.one-lens__tag {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  padding: 0.42rem 0.8rem;
  border: 1px solid rgb(255 255 255 / 0.22);
  border-radius: 999px;
  background: rgb(0 0 0 / 0.62);
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
  will-change: transform;
}

.one-lens__tag--after {
  border-color: transparent;
  background: #20e848;
  color: #021a06;
}

.one-lens__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  margin-top: 1.5rem;
}

.one-lens__pairs,
.one-lens__tools {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.one-lens__icon {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 50%;
  background: rgb(255 255 255 / 0.04);
  color: #fff;
  cursor: pointer;
  transition: border-color 0.25s ease, color 0.25s ease, opacity 0.25s ease;
}

.one-lens__icon:hover:not(:disabled),
.one-lens__icon:focus-visible {
  border-color: #03cb00;
  color: #20e848;
}

.one-lens__icon:disabled {
  opacity: 0.35;
  cursor: default;
}

.one-lens__icon svg,
.one-lens__toggle svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.one-lens__dots {
  display: flex;
  align-items: center;
}

/* A 24px hit area around a small dot; the current pair's dot is a green pill. */
.one-lens__dot {
  position: relative;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: none;
  cursor: pointer;
}

.one-lens__dot::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, background-color 0.3s ease;
}

.one-lens__dot:hover::before {
  background: rgb(255 255 255 / 0.6);
}

.one-lens__dot.is-active::before {
  width: 1.25rem;
  background: #20e848;
}

.one-lens__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  height: 2.75rem;
  padding: 0 1.15rem;
  border: 1px solid rgb(32 232 72 / 0.55);
  border-radius: 999px;
  background: rgb(3 203 0 / 0.08);
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  font-weight: 600;
  letter-spacing: var(--type-body-ls);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

.one-lens__toggle svg {
  color: #20e848;
}

.one-lens__toggle:hover,
.one-lens__toggle:focus-visible {
  border-color: #20e848;
  background: rgb(3 203 0 / 0.2);
}

.one-lens__icon:focus-visible,
.one-lens__dot:focus-visible,
.one-lens__toggle:focus-visible {
  outline: 0.125rem solid #20e848;
  outline-offset: 0.125rem;
}

.one-lens__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 899px) {
  .one-lens {
    margin-top: 5rem;
  }

  .one-lens__head {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .one-lens__stage {
    border-radius: 1.1rem;
  }

  .one-lens__tag {
    padding: 0.32rem 0.6rem;
    font-size: 0.6875rem;
  }

  .one-lens__controls {
    justify-content: center;
    margin-top: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .one-lens__canvas,
  .one-lens__tag,
  .one-lens__dot::before,
  .one-lens__icon,
  .one-lens__toggle {
    transition: none;
  }
}
</style>
