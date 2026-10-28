<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { Group, MeshBasicMaterial, MeshStandardMaterial, ShaderMaterial, Vector3 } from "three";
import type { ProjectWallItem } from "~/composables/useProjectsWallData";

// PROTOTYPE "ONE Showroom": the case studies hung in a dark gallery hall that
// the visitor walks through one frame ("station") at a time: arrow buttons,
// arrow keys, one wheel gesture or one swipe per step. The camera flies
// between the stations on a slight curve and looks down the hall halfway, as
// a visitor turning from one wall to the other would. The floor is a
// three.js Reflector under a dark, mostly opaque layer; light pools, the
// green rim and the ONE sign are cheap additive planes instead of real lights
// and bloom. Without WebGL 2 the same projects are a horizontal snap-scroll
// list. Escape emits "close" (the page switches back to the project wall).
const emit = defineEmits<{ close: [] }>();

type Copy = {
  label: string;
  loading: string;
  prev: string;
  next: string;
  open: string;
  nav: string;
  hintPointer: string;
  hintTouch: string;
  station: (n: number, total: number) => string;
};

const COPY: Record<string, Copy> = {
  en: {
    label: "3D showroom of OneBranding projects",
    loading: "Hanging the projects",
    prev: "Previous project",
    next: "Next project",
    open: "Open project",
    nav: "Showroom navigation",
    hintPointer: "Use ← → or scroll to walk",
    hintTouch: "Swipe to walk the hall",
    station: (n, total) => `Project ${n} of ${total}`,
  },
  ru: {
    label: "3D-шоурум проектов OneBranding",
    loading: "Развешиваем проекты",
    prev: "Предыдущий проект",
    next: "Следующий проект",
    open: "Открыть проект",
    nav: "Навигация по шоуруму",
    hintPointer: "Листайте стрелками ← → или колесом мыши",
    hintTouch: "Свайпните, чтобы пройти по залу",
    station: (n, total) => `Проект ${n} из ${total}`,
  },
  uz: {
    label: "OneBranding loyihalarining 3D shourumi",
    loading: "Loyihalar ilinmoqda",
    prev: "Oldingi loyiha",
    next: "Keyingi loyiha",
    open: "Loyihani ochish",
    nav: "Shourum boʻylab harakat",
    hintPointer: "← → tugmalari yoki gʻildirak bilan yuring",
    hintTouch: "Zal boʻylab yurish uchun suring",
    station: (n, total) => `${n}-loyiha, jami ${total} ta`,
  },
};
const { locale } = useI18n();
const copy = computed(() => COPY[locale.value] ?? COPY.en!);

// More frames would make the hall long enough to lose the ONE sign in the fog.
const MAX_FRAMES = 20;
// The page passes the projects it fetched on the server: fetched from here
// (after hydration) the request comes from the browser, and the CMS refuses
// origins other than the live site. Without the prop it fetches on its own.
const props = defineProps<{ projects?: ProjectWallItem[] }>();
const fetched = props.projects ? null : await useProjectsWallData();
const items = computed(() => (props.projects ?? fetched?.projects.value ?? []).slice(0, MAX_FRAMES));

// Same-origin copies through Nuxt Image (IPX): the CMS originals live on
// another host, and a cross-origin image without CORS headers cannot become a
// WebGL texture. 1024px is enough for a frame that never fills the screen.
const image = useImage();
const textureSrc = (url: string) => image(url, { width: 1024, format: "webp", quality: 80 });
const listSrc = (url: string) => image(url, { width: 640, format: "webp", quality: 80 });
const router = useRouter();

const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const ui = ref<HTMLElement | null>(null);

// null until the client has probed WebGL 2; false shows the plain list.
const webgl = ref<boolean | null>(null);
const loading = ref(true);
const progress = ref(0);
// The overlay appears once the intro has brought the camera to the first frame.
const ready = ref(false);
const current = ref(0);
const walked = ref(false);
const touchInput = ref(false);
const pointerOnFrame = ref(false);

const total = computed(() => items.value.length);
const currentItem = computed(() => items.value[current.value]);
const pad = (n: number) => String(n).padStart(2, "0");
const percent = computed(() => Math.round(progress.value * 100));
// CMS titles read "Name: what we did"; the name leads, the rest is quieter.
const titleParts = computed(() => {
  const title = currentItem.value?.title ?? "";
  const cut = title.indexOf(": ");
  return cut > 0 ? { name: title.slice(0, cut), rest: title.slice(cut + 2) } : { name: title, rest: "" };
});

// Set once the scene exists; until then navigation does nothing.
let flyTo: ((index: number) => void) | undefined;
let pick: ((x: number, y: number, activate: boolean) => void) | undefined;

const go = (index: number) => {
  if (!flyTo || !total.value) return;
  const next = Math.min(total.value - 1, Math.max(0, index));
  if (next === current.value) return;
  current.value = next;
  walked.value = true;
  flyTo(next);
};
const step = (direction: number) => go(current.value + direction);

const onKey = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if ((event.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable]")) return;
  if (event.key === "Escape") {
    emit("close");
    return;
  }
  if (!webgl.value) return;
  const moves: Record<string, () => void> = {
    ArrowRight: () => step(1),
    ArrowDown: () => step(1),
    PageDown: () => step(1),
    ArrowLeft: () => step(-1),
    ArrowUp: () => step(-1),
    PageUp: () => step(-1),
    Home: () => go(0),
    End: () => go(total.value - 1),
  };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  move();
};

// One station per wheel gesture: the first ~30px of a gesture move, the rest
// of it (a trackpad's inertia included) is swallowed until the wheel has been
// quiet for a moment.
let wheelSum = 0;
let wheelLocked = false;
let wheelTimer: number | undefined;
const onWheel = (event: WheelEvent) => {
  event.preventDefault();
  const unit = event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? window.innerHeight : 1;
  const delta = (Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX) * unit;
  window.clearTimeout(wheelTimer);
  wheelTimer = window.setTimeout(() => {
    wheelLocked = false;
    wheelSum = 0;
  }, 200);
  if (wheelLocked) return;
  wheelSum += delta;
  if (Math.abs(wheelSum) < 30) return;
  wheelLocked = true;
  step(Math.sign(wheelSum));
  wheelSum = 0;
};

// Swipes (and mouse drags) walk; a tap or click on a frame goes to it, or
// opens it when it is the current one.
let press: { id: number; x: number; y: number } | null = null;
const onPointerDown = (event: PointerEvent) => {
  if (event.button > 0) return;
  if (event.pointerType === "touch") touchInput.value = true;
  press = { id: event.pointerId, x: event.clientX, y: event.clientY };
};
const onPointerUp = (event: PointerEvent) => {
  if (!press || press.id !== event.pointerId) return;
  const dx = event.clientX - press.x;
  const dy = event.clientY - press.y;
  press = null;
  const threshold = event.pointerType === "mouse" ? 70 : 40;
  if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.2) {
    step(dx < 0 ? 1 : -1);
    return;
  }
  if (Math.hypot(dx, dy) < 10) pick?.(event.clientX, event.clientY, true);
};
const onPointerCancel = () => {
  press = null;
};
const onPointerMove = (event: PointerEvent) => {
  if (event.pointerType === "mouse" && !press) pick?.(event.clientX, event.clientY, false);
};
const onPointerLeave = () => {
  pointerOnFrame.value = false;
};

// Hall layout (world units ~ metres). The first frame hangs on the left wall,
// the next on the right, and so on.
const HALL_HALF = 4.5;
const HALL_HEIGHT = 4.6;
const IMG_W = 2.8;
const IMG_H = 1.575;
const MAT = 0.07;
const BORDER = 0.075;
const OUTER_W = IMG_W + 2 * (MAT + BORDER);
const OUTER_H = IMG_H + 2 * (MAT + BORDER);
const FRAME_Y = 1.78;
const EYE = 1.62;
const FIRST_Z = -3.2;
const STEP_Z = 3.8;
const START_Z = 5;

const loadImage = (src: string, timeout = 15000) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    // A copy that is not same-origin after all then fails here (and gets the
    // drawn fallback) instead of tainting the texture upload.
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    const timer = window.setTimeout(() => resolve(null), timeout);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });

const makeCanvas = (width: number, height: number) => {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return { c, ctx: c.getContext("2d")! };
};

const DISPLAY_FONT = '"SF Pro Display", "SF Pro Text", "Segoe UI", Arial, sans-serif';
const TEXT_FONT = '"SF Pro Text", "Segoe UI", Arial, sans-serif';

const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) => {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(next).width <= maxWidth) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1]!;
  while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
};

// A museum label beside each frame: the number in green, the project's name
// and what was done.
const drawCaption = (index: number, title: string) => {
  const { c, ctx } = makeCanvas(512, 300);
  ctx.fillStyle = "#0f0f0f";
  ctx.fillRect(0, 0, 512, 300);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 510, 298);
  ctx.textBaseline = "top";
  ctx.fillStyle = "#20e848";
  ctx.font = `700 56px ${DISPLAY_FONT}`;
  ctx.fillText(pad(index + 1), 34, 30);
  const cut = title.indexOf(": ");
  const name = cut > 0 ? title.slice(0, cut) : title;
  const rest = cut > 0 ? title.slice(cut + 2) : "";
  ctx.fillStyle = "#f4f4f4";
  ctx.font = `600 34px ${DISPLAY_FONT}`;
  const nameLines = wrapLines(ctx, name, 444, rest ? 1 : 3);
  nameLines.forEach((text, i) => ctx.fillText(text, 34, 112 + i * 42));
  if (rest) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = `400 24px ${TEXT_FONT}`;
    wrapLines(ctx, rest, 444, 3).forEach((text, i) => ctx.fillText(text, 34, 160 + i * 32));
  }
  return c;
};

// Stands in for a project image that failed to load.
const drawPlaceholder = (title: string) => {
  const { c, ctx } = makeCanvas(1024, 576);
  const g = ctx.createLinearGradient(0, 0, 1024, 576);
  g.addColorStop(0, "#06210a");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 576);
  ctx.fillStyle = "#20e848";
  ctx.font = `700 120px ${DISPLAY_FONT}`;
  ctx.textBaseline = "top";
  ctx.fillText("ONE", 72, 64);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 52px ${DISPLAY_FONT}`;
  wrapLines(ctx, title, 880, 3).forEach((text, i) => ctx.fillText(text, 72, 300 + i * 64));
  return c;
};

// A ceiling spot washing the wall: brightest just above the frame, widening
// and fading towards the floor.
const drawWash = () => {
  const { c, ctx } = makeCanvas(256, 512);
  ctx.translate(128, 140);
  ctx.scale(1, 1.85);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 128);
  g.addColorStop(0, "rgba(255, 244, 228, 0.34)");
  g.addColorStop(0.4, "rgba(255, 240, 220, 0.16)");
  g.addColorStop(1, "rgba(255, 240, 220, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(-128, -140, 256, 512);
  return c;
};

const drawPool = () => {
  const { c, ctx } = makeCanvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255, 244, 228, 0.6)");
  g.addColorStop(0.5, "rgba(255, 240, 220, 0.18)");
  g.addColorStop(1, "rgba(255, 240, 220, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return c;
};

// The end wall's neon: brand-green letters with a drawn glow (no bloom pass).
const drawSign = () => {
  const { c, ctx } = makeCanvas(2048, 720);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 470px ${DISPLAY_FONT}`;
  ctx.fillStyle = "#20e848";
  ctx.shadowColor = "rgba(32, 232, 72, 1)";
  for (const blur of [140, 70, 28]) {
    ctx.shadowBlur = blur;
    ctx.fillText("ONE", 1024, 380);
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#8dffa0";
  ctx.fillText("ONE", 1024, 380);
  return c;
};

const imageVertex = /* glsl */ `
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const imageFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec4 uCrop;
  uniform float uActive;
  uniform float uHover;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  void main() {
    vec3 color = texture2D(uMap, uCrop.xy + vUv * uCrop.zw).rgb;
    // Lit by a spot from above: brightest just under the top edge, softer in
    // the lower corners. Frames away from the visitor stay dimmer.
    vec2 q = (vUv - vec2(0.5, 1.12)) * vec2(0.9, 1.0);
    float spot = 1.0 - smoothstep(0.35, 1.45, length(q));
    float light = mix(0.45, 1.0, uActive) * mix(0.72, 1.1, spot) + uHover * 0.12;
    gl_FragColor = vec4(color * light, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec2 uSize;
  uniform vec2 uHalf;
  uniform float uActive;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  void main() {
    // Distance from the frame's outer edge, in world units.
    vec2 q = abs((vUv - 0.5) * uSize) - uHalf;
    float d = max(length(max(q, 0.0)) + min(max(q.x, q.y), 0.0), 0.0);
    // A tight rim plus a faint, wide halo on the wall around the frame.
    float glow = exp(-d * 34.0) * 0.8 + exp(-d * 5.0) * 0.12;
    gl_FragColor = vec4(uColor * glow * uActive, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

type Rig = {
  index: number;
  side: number;
  group: Group;
  center: Vector3;
  image: ShaderMaterial;
  glow: ShaderMaterial;
  frame: MeshStandardMaterial;
  wash: MeshBasicMaterial;
  active: number;
  hover: number;
};

let cleanup: (() => void) | undefined;
let disposed = false;

onMounted(async () => {
  window.addEventListener("keydown", onKey);
  const host = root.value;
  const el = canvas.value;
  const list = items.value.slice();
  if (!list.length || !host || !el) {
    loading.value = false;
    return;
  }

  const probe = document.createElement("canvas").getContext("webgl2");
  if (!probe) {
    webgl.value = false;
    loading.value = false;
    return;
  }
  // Browsers cap live contexts: let the probe's go right away.
  probe.getExtension("WEBGL_lose_context")?.loseContext();
  webgl.value = true;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const parallax = !reducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  touchInput.value = coarse;

  const [THREE, { Reflector }, { gsap }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/objects/Reflector.js"),
    import("gsap"),
  ]);
  if (disposed) return;

  let renderer: InstanceType<typeof THREE.WebGLRenderer>;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, powerPreference: "high-performance" });
  } catch {
    webgl.value = false;
    loading.value = false;
    return;
  }
  // Until the scene exists, unmounting only has the renderer to free.
  cleanup = () => {
    renderer.dispose();
    renderer.forceContextLoss();
  };
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 1);

  // Textures first (with progress); fonts for the drawn labels alongside.
  const fontsReady = Promise.all([
    document.fonts.load(`700 100px ${DISPLAY_FONT}`),
    document.fonts.load(`400 24px ${TEXT_FONT}`),
  ]).catch(() => undefined);
  let loaded = 0;
  const images = await Promise.all(
    list.map(async (item) => {
      const result = await loadImage(textureSrc(item.image));
      loaded += 1;
      progress.value = loaded / (list.length + 1);
      return result;
    }),
  );
  await fontsReady;
  if (disposed) return;
  progress.value = 1;
  host.dataset.textures = `${images.filter(Boolean).length}/${list.length}`;

  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(item: T) => {
    disposables.push(item);
    return item;
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.04);
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 140);
  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const green = new THREE.Color("#20e848");

  const count = list.length;
  const lastZ = FIRST_Z - (count - 1) * STEP_Z;
  const END_Z = lastZ - 7.5;
  const hallLength = START_Z - END_Z;
  const hallCenterZ = (START_Z + END_Z) / 2;

  // Hall: walls, ceiling, end wall.
  const wallMat = keep(new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.92 }));
  const wallGeo = keep(new THREE.PlaneGeometry(hallLength, HALL_HEIGHT));
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(side * HALL_HALF, HALL_HEIGHT / 2, hallCenterZ);
    wall.rotation.y = -side * Math.PI / 2;
    scene.add(wall);
  }
  const ceiling = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(HALL_HALF * 2, hallLength)),
    keep(new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 1 })),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, HALL_HEIGHT, hallCenterZ);
  scene.add(ceiling);
  const endWall = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(HALL_HALF * 2, HALL_HEIGHT)),
    keep(new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.9 })),
  );
  endWall.position.set(0, HALL_HEIGHT / 2, END_Z);
  scene.add(endWall);

  // Two thin light strips run along the ceiling; the floor mirrors them as
  // lines that lead the eye to the sign.
  const stripGeo = keep(new THREE.PlaneGeometry(0.045, hallLength - 2));
  const stripMat = keep(new THREE.MeshBasicMaterial({ color: 0x5c5c5c }));
  for (const x of [-1, 1]) {
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.rotation.x = Math.PI / 2;
    strip.position.set(x, HALL_HEIGHT - 0.005, hallCenterZ);
    scene.add(strip);
  }

  // Floor: a real mirror under a dark, mostly opaque layer, so the frames and
  // the sign show as a faint polished-concrete reflection.
  const reflectScale = coarse ? 0.35 : 0.5;
  const floorGeo = keep(new THREE.PlaneGeometry(HALL_HALF * 2, hallLength));
  const reflector = new Reflector(floorGeo, {
    clipBias: 0.003,
    textureWidth: 512,
    textureHeight: 512,
    color: 0x7f7f7f,
    multisample: coarse ? 0 : 4,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.set(0, 0, hallCenterZ);
  scene.add(reflector);
  const floor = new THREE.Mesh(
    floorGeo,
    keep(new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.6, transparent: true, opacity: 0.8 })),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.002, hallCenterZ);
  scene.add(floor);

  // The sign on the end wall, with a green light that spills onto the floor.
  const signTexture = keep(new THREE.CanvasTexture(drawSign()));
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const signWidth = HALL_HALF * 1.5;
  const sign = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(signWidth, (signWidth * 720) / 2048)),
    keep(new THREE.MeshBasicMaterial({
      map: signTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })),
  );
  sign.position.set(0, 2.55, END_Z + 0.02);
  scene.add(sign);
  const signLight = new THREE.PointLight(0x20e848, 7, 12, 1.4);
  signLight.position.set(0, 2.4, END_Z + 1.6);
  scene.add(signLight);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.9));
  // One real key light follows the visitor to the current frame (real lights
  // per frame would multiply the cost of every wall pixel).
  const spot = new THREE.SpotLight(0xfff1de, 55, 11, 0.62, 0.75, 1.3);
  scene.add(spot, spot.target);

  // Shared geometry of all frames.
  const shape = new THREE.Shape();
  shape.moveTo(-OUTER_W / 2, -OUTER_H / 2);
  shape.lineTo(OUTER_W / 2, -OUTER_H / 2);
  shape.lineTo(OUTER_W / 2, OUTER_H / 2);
  shape.lineTo(-OUTER_W / 2, OUTER_H / 2);
  shape.closePath();
  const hole = new THREE.Path();
  const innerW = IMG_W + 2 * MAT;
  const innerH = IMG_H + 2 * MAT;
  hole.moveTo(-innerW / 2, -innerH / 2);
  hole.lineTo(-innerW / 2, innerH / 2);
  hole.lineTo(innerW / 2, innerH / 2);
  hole.lineTo(innerW / 2, -innerH / 2);
  hole.closePath();
  shape.holes.push(hole);
  const frameGeo = keep(new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 1,
  }));
  const matGeo = keep(new THREE.PlaneGeometry(innerW, innerH));
  const matMat = keep(new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.95 }));
  const imageGeo = keep(new THREE.PlaneGeometry(IMG_W, IMG_H));
  const GLOW = 1.1;
  const glowGeo = keep(new THREE.PlaneGeometry(OUTER_W + GLOW * 2, OUTER_H + GLOW * 2));
  const washTexture = keep(new THREE.CanvasTexture(drawWash()));
  washTexture.colorSpace = THREE.SRGBColorSpace;
  const washGeo = keep(new THREE.PlaneGeometry(4.6, HALL_HEIGHT));
  const poolTexture = keep(new THREE.CanvasTexture(drawPool()));
  poolTexture.colorSpace = THREE.SRGBColorSpace;
  const poolGeo = keep(new THREE.PlaneGeometry(1.9, 3.6));
  const poolMat = keep(new THREE.MeshBasicMaterial({
    map: poolTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.35,
  }));
  const captionGeo = keep(new THREE.PlaneGeometry(1.0, 0.586));
  const fixtureGeo = keep(new THREE.CircleGeometry(0.1, 20));
  const fixtureMat = keep(new THREE.MeshBasicMaterial({ color: 0xdadada }));

  const pickables: InstanceType<typeof THREE.Object3D>[] = [];
  const rigs: Rig[] = list.map((item, index) => {
    // Left wall (facing +x) for even stations, right wall (facing -x) for odd.
    const side = index % 2 === 0 ? -1 : 1;
    const z = FIRST_Z - index * STEP_Z;
    const group = new THREE.Group();
    group.position.set(side * (HALL_HALF - 0.02), FRAME_Y, z);
    group.rotation.y = -side * Math.PI / 2;
    scene.add(group);

    const source = images[index];
    let texture: InstanceType<typeof THREE.Texture>;
    const crop = new THREE.Vector4(0, 0, 1, 1);
    if (source) {
      texture = new THREE.Texture(source);
      // Cover the 16:9 opening, keeping the top of the image (as the wall does).
      const aspect = source.naturalWidth / source.naturalHeight;
      const target = IMG_W / IMG_H;
      if (aspect > target) crop.set((1 - target / aspect) / 2, 0, target / aspect, 1);
      else crop.set(0, 1 - aspect / target, 1, aspect / target);
    } else {
      texture = new THREE.CanvasTexture(drawPlaceholder(item.title));
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = maxAnisotropy;
    texture.needsUpdate = true;
    keep(texture);

    const imageMat = keep(new THREE.ShaderMaterial({
      vertexShader: imageVertex,
      fragmentShader: imageFragment,
      fog: true,
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        uMap: { value: texture },
        uCrop: { value: crop },
        uActive: { value: 0 },
        uHover: { value: 0 },
      },
    }));
    const picture = new THREE.Mesh(imageGeo, imageMat);
    picture.position.z = 0.02;
    picture.userData.index = index;
    pickables.push(picture);

    const frameMat = keep(new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.38,
      metalness: 0.35,
      emissive: green,
      emissiveIntensity: 0,
    }));
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.userData.index = index;
    pickables.push(frame);
    const mat = new THREE.Mesh(matGeo, matMat);
    mat.position.z = 0.008;

    const glowMat = keep(new THREE.ShaderMaterial({
      vertexShader: imageVertex,
      fragmentShader: glowFragment,
      fog: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        uColor: { value: green },
        uSize: { value: new THREE.Vector2(OUTER_W + GLOW * 2, OUTER_H + GLOW * 2) },
        uHalf: { value: new THREE.Vector2(OUTER_W / 2, OUTER_H / 2) },
        uActive: { value: 0 },
      },
    }));
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -0.012;

    const washMat = keep(new THREE.MeshBasicMaterial({
      map: washTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.5,
    }));
    const wash = new THREE.Mesh(washGeo, washMat);
    wash.position.set(0, HALL_HEIGHT / 2 - FRAME_Y, -0.016);

    const captionTexture = keep(new THREE.CanvasTexture(drawCaption(index, item.title)));
    captionTexture.colorSpace = THREE.SRGBColorSpace;
    captionTexture.anisotropy = maxAnisotropy;
    const caption = new THREE.Mesh(captionGeo, keep(new THREE.MeshBasicMaterial({ map: captionTexture })));
    // The label hangs on the down-hall side of the frame (local +x on the left
    // wall, -x on the right one), between the frame and the open view.
    caption.position.set(-side * (OUTER_W / 2 + 0.85), -OUTER_H / 2 + 0.293, -0.01);

    group.add(wash, glow, frame, mat, picture, caption);

    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(side * (HALL_HALF - 0.95), 0.004, z);
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.rotation.x = Math.PI / 2;
    fixture.position.set(side * (HALL_HALF - 1.5), HALL_HEIGHT - 0.006, z + 0.3);
    scene.add(pool, fixture);

    return {
      index,
      side,
      group,
      center: new THREE.Vector3(side * (HALL_HALF - 0.02), FRAME_Y, z),
      image: imageMat,
      glow: glowMat,
      frame: frameMat,
      wash: washMat,
      active: 0,
      hover: 0,
    };
  });

  // Camera framing, recomputed on resize: how far from the wall, how oblique
  // and how far off-centre each frame is seen.
  let distance = 4;
  let theta = 0.5;
  let lookShift = 0;
  const station = (index: number) => {
    const rig = rigs[index]!;
    const pos = new THREE.Vector3(
      rig.center.x - rig.side * distance * Math.cos(theta),
      EYE,
      rig.center.z + distance * Math.sin(theta),
    );
    // Aiming a little down the hall puts the frame towards its wall and lets
    // the hall's depth show beside it.
    const target = new THREE.Vector3(rig.center.x, rig.center.y - 0.06, rig.center.z - lookShift);
    return { pos, target };
  };

  const fitCamera = new THREE.PerspectiveCamera();
  const corner = new THREE.Vector3();
  scene.updateMatrixWorld();

  const camPos = new THREE.Vector3(0, 2.05, START_Z - 1.2);
  const camTarget = new THREE.Vector3(0, 1.75, END_Z);
  let flight: ReturnType<typeof gsap.to> | null = null;
  let introDone = false;
  let dirty = true;

  const layout = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const portrait = aspect < 0.8;
    camera.fov = portrait ? 60 : aspect < 1.25 ? 52 : 44;
    camera.aspect = aspect;
    // The picture goes in the free band between the page's top pills and the
    // overlay at the bottom.
    const uiTop = ui.value?.getBoundingClientRect().top ?? height * 0.8;
    const freeTop = Math.min(88, height * 0.12);
    const freeBottom = Math.max(height * 0.55, Math.min(height, uiTop) - 12);
    const shift = Math.round(height / 2 - (freeTop + freeBottom) / 2);
    camera.setViewOffset(width, height, 0, shift, width, height);
    camera.updateProjectionMatrix();

    theta = portrait ? 0.18 : 0.5;
    lookShift = portrait ? 0 : 0.8;
    // The closest distance at which the frame, seen in perspective from its
    // station, fits its box on screen (found by bisection on the projected
    // corners: the near edge of an oblique frame is the one that grows).
    const box = {
      left: width * 0.05,
      right: width * 0.95,
      top: freeTop + 10,
      bottom: freeBottom - 10,
      width: width * (portrait ? 0.9 : 0.48),
      height: (freeBottom - freeTop) * 0.78,
    };
    const fits = (d: number) => {
      distance = d;
      const { pos, target } = station(0);
      fitCamera.copy(camera);
      fitCamera.position.copy(pos);
      fitCamera.lookAt(target);
      fitCamera.updateMatrixWorld();
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
        corner.set((sx * OUTER_W) / 2, (sy * OUTER_H) / 2, 0.06);
        rigs[0]!.group.localToWorld(corner).project(fitCamera);
        const x = ((corner.x + 1) / 2) * width;
        const y = ((1 - corner.y) / 2) * height;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      return minX >= box.left && maxX <= box.right && minY >= box.top && maxY <= box.bottom
        && maxX - minX <= box.width && maxY - minY <= box.height;
    };
    let near = 1.5;
    let far = (2 * HALL_HALF - 0.8) / Math.cos(theta);
    if (fits(far)) {
      for (let i = 0; i < 14; i++) {
        const mid = (near + far) / 2;
        if (fits(mid)) far = mid;
        else near = mid;
      }
    }
    distance = far;

    reflector.getRenderTarget().setSize(
      Math.round(width * dpr * reflectScale),
      Math.round(height * dpr * reflectScale),
    );
    if (introDone && !flight) {
      const goal = station(current.value);
      camPos.copy(goal.pos);
      camTarget.copy(goal.target);
    }
    dirty = true;
  };
  layout();

  const bezier = (a: Vector3, c: Vector3, b: Vector3, t: number, out: Vector3) => {
    const u = 1 - t;
    out.set(
      u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      u * u * a.y + 2 * u * t * c.y + t * t * b.y,
      u * u * a.z + 2 * u * t * c.z + t * t * b.z,
    );
  };

  const fly = (toPos: Vector3, toTarget: Vector3, duration: number, onDone?: () => void) => {
    flight?.kill();
    flight = null;
    if (reducedMotion) {
      camPos.copy(toPos);
      camTarget.copy(toTarget);
      dirty = true;
      onDone?.();
      return;
    }
    const fromPos = camPos.clone();
    const fromTarget = camTarget.clone();
    // The path bows towards the middle of the hall and rises a touch.
    const midPos = fromPos.clone().lerp(toPos, 0.5);
    midPos.x *= 0.2;
    midPos.y += 0.16;
    // Halfway the eyes leave the wall and look down the hall, where the sign is.
    const midTarget = new THREE.Vector3(0, 1.7, Math.min(fromPos.z, toPos.z) - 9);
    const state = { p: 0 };
    flight = gsap.to(state, {
      p: 1,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        bezier(fromPos, midPos, toPos, state.p, camPos);
        bezier(fromTarget, midTarget, toTarget, state.p, camTarget);
      },
      onComplete: () => {
        flight = null;
        onDone?.();
      },
    });
  };

  let stationIndex = 0;
  const finishIntro = () => {
    introDone = true;
    ready.value = true;
  };
  flyTo = (index: number) => {
    // A key pressed during the intro takes over from it.
    if (!introDone) finishIntro();
    const goal = station(index);
    fly(goal.pos, goal.target, Math.min(2.4, 1.3 + 0.12 * Math.abs(index - stationIndex)));
    stationIndex = index;
  };

  // Hover and click on the frames.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = -1;
  pick = (x, y, activate) => {
    if (!ready.value) return;
    const rect = el.getBoundingClientRect();
    ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    hovered = hit ? (hit.object.userData.index as number) : -1;
    pointerOnFrame.value = hovered >= 0;
    if (!activate || hovered < 0) return;
    if (hovered === current.value) router.push(list[hovered]!.to);
    else go(hovered);
  };

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
  };
  if (parallax) window.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("wheel", onWheel, { passive: false });

  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(host);
  // A lost context (GPU reset, too many contexts) falls back to the list.
  const onContextLost = () => {
    cancelAnimationFrame(frameId);
    webgl.value = false;
  };
  el.addEventListener("webglcontextlost", onContextLost);

  spot.position.set(rigs[0]!.center.x - rigs[0]!.side * 1.7, HALL_HEIGHT - 0.2, rigs[0]!.center.z + 0.5);
  spot.target.position.copy(rigs[0]!.center);

  // Upload everything before the first visible frame so the intro does not stutter.
  rigs.forEach((rig) => renderer.initTexture(rig.image.uniforms.uMap!.value));
  renderer.compile(scene, camera);

  const clock = new THREE.Clock();
  const look = new THREE.Vector3();
  const right = new THREE.Vector3();
  const spotGoal = new THREE.Vector3();
  let frameId = 0;
  const tick = () => {
    frameId = requestAnimationFrame(tick);
    if (document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 5);
    const pulse = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(time * 1.8);

    for (const rig of rigs) {
      const active = rig.index === current.value ? 1 : 0;
      const hover = rig.index === hovered && rig.index !== current.value ? 1 : 0;
      if (Math.abs(active - rig.active) > 0.002 || Math.abs(hover - rig.hover) > 0.002) dirty = true;
      rig.active += (active - rig.active) * ease;
      rig.hover += (hover - rig.hover) * ease;
      rig.image.uniforms.uActive!.value = rig.active;
      rig.image.uniforms.uHover!.value = rig.hover;
      rig.glow.uniforms.uActive!.value = rig.active * pulse;
      rig.frame.emissiveIntensity = rig.active * 0.03;
      rig.wash.opacity = 0.5 + rig.active * 0.3;
    }

    // The key light glides along to the current frame.
    const rig = rigs[current.value]!;
    spotGoal.set(rig.center.x - rig.side * 1.7, HALL_HEIGHT - 0.2, rig.center.z + 0.5);
    spot.position.lerp(spotGoal, ease);
    spot.target.position.lerp(rig.center, ease);

    camera.position.copy(camPos);
    if (!reducedMotion) camera.position.y += Math.sin(time * 0.7) * 0.012;
    look.copy(camTarget);
    if (parallax) {
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 4));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 4));
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      look.addScaledVector(right, pointer.x * 0.3);
      look.y -= pointer.y * 0.18;
    }
    camera.lookAt(look);

    // Reduced motion: nothing moves on its own, so draw only after a change.
    if (reducedMotion && !dirty) return;
    dirty = false;
    renderer.render(scene, camera);
  };

  const onVisibility = () => {
    // Coming back to the tab must not count the hidden time as one long frame.
    if (!document.hidden) clock.getDelta();
  };
  document.addEventListener("visibilitychange", onVisibility);

  loading.value = false;
  tick();
  if (reducedMotion) {
    const goal = station(0);
    camPos.copy(goal.pos);
    camTarget.copy(goal.target);
    finishIntro();
  } else {
    const goal = station(0);
    fly(goal.pos, goal.target, 3, finishIntro);
  }

  cleanup = () => {
    cancelAnimationFrame(frameId);
    flight?.kill();
    resizeObserver.disconnect();
    window.removeEventListener("pointermove", onMove);
    host.removeEventListener("wheel", onWheel);
    document.removeEventListener("visibilitychange", onVisibility);
    el.removeEventListener("webglcontextlost", onContextLost);
    for (const item of disposables) item.dispose();
    reflector.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
});

onBeforeUnmount(() => {
  disposed = true;
  flyTo = undefined;
  pick = undefined;
  window.removeEventListener("keydown", onKey);
  window.clearTimeout(wheelTimer);
  cleanup?.();
});
</script>

<template>
  <section
    ref="root"
    class="showroom"
    :aria-label="copy.label"
    :aria-busy="webgl !== false && loading ? 'true' : undefined"
  >
    <p v-if="!total" class="showroom__empty">{{ $t("projectsPage.unavailable") }}</p>

    <!-- Without WebGL 2: the same projects as a horizontal snap-scroll list. -->
    <div v-else-if="webgl === false" class="showroom-list">
      <ul class="showroom-list__track">
        <li v-for="(item, index) in items" :key="item.id" class="showroom-list__item">
          <NuxtLink :to="item.to" class="showroom-list__card">
            <span class="showroom-list__media">
              <img :src="listSrc(item.image)" alt="" loading="lazy" decoding="async" draggable="false">
            </span>
            <span class="showroom-list__index">{{ pad(index + 1) }}</span>
            <span class="showroom-list__title">{{ item.title }}</span>
            <span class="showroom-list__open">
              {{ copy.open }}
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h13m-6-6 6 6-6 6" /></svg>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <template v-else>
      <div
        class="showroom__stage"
        :class="{ 'is-pointing': pointerOnFrame }"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
      >
        <canvas ref="canvas" class="showroom__canvas" :class="{ 'is-visible': !loading }" aria-hidden="true" />
      </div>

      <div v-if="loading" class="showroom__loading" role="status">
        <span class="showroom__loading-label">{{ copy.loading }}</span>
        <span class="showroom__loading-track" aria-hidden="true">
          <span :style="{ transform: `scaleX(${progress})` }" />
        </span>
        <span class="showroom__loading-value">{{ percent }}%</span>
      </div>

      <div ref="ui" class="showroom__ui" :class="{ 'is-visible': ready }" :inert="!ready">
        <div class="showroom__info" aria-live="polite" aria-atomic="true">
          <span class="sr-only">{{ copy.station(current + 1, total) }}</span>
          <h2 :key="current" class="showroom__title">
            <span class="showroom__title-name">{{ titleParts.name }}</span>
            <span v-if="titleParts.rest" class="showroom__title-rest"><span class="sr-only">: </span>{{ titleParts.rest }}</span>
          </h2>
        </div>

        <div class="showroom__bar">
          <nav class="showroom__nav" :aria-label="copy.nav">
            <button
              type="button"
              class="showroom__arrow"
              :aria-label="copy.prev"
              :disabled="current === 0"
              @click="step(-1)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14 5-7 7 7 7M8 12h10" /></svg>
            </button>
            <span class="showroom__counter" aria-hidden="true"><b>{{ pad(current + 1) }}</b> / {{ pad(total) }}</span>
            <button
              type="button"
              class="showroom__arrow"
              :aria-label="copy.next"
              :disabled="current >= total - 1"
              @click="step(1)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m10 5 7 7-7 7M16 12H6" /></svg>
            </button>
          </nav>
          <NuxtLink v-if="currentItem" :to="currentItem.to" class="showroom__open">
            {{ copy.open }}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </NuxtLink>
        </div>

        <p class="showroom__hint" :class="{ 'is-hidden': walked }" aria-hidden="true">
          {{ touchInput ? copy.hintTouch : copy.hintPointer }}
        </p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.showroom {
  position: fixed;
  inset: 0;
  z-index: 800;
  overflow: hidden;
  background: #000;
  color: #fff;
  overscroll-behavior: none;
}

.showroom__stage {
  position: absolute;
  inset: 0;
  /* Swipes are ours: no browser panning or zooming on the hall. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.showroom__stage.is-pointing {
  cursor: pointer;
}

.showroom__canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.9s ease;
}

.showroom__canvas.is-visible {
  opacity: 1;
}

/* Loading: a thin green progress line in the middle of the dark hall. */
.showroom__loading {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.showroom__loading-label {
  color: rgb(255 255 255 / 0.72);
  font-family: var(--app-font-sans);
  font-size: var(--type-label-size);
  font-weight: 600;
  line-height: var(--type-label-lh);
  letter-spacing: var(--type-label-ls);
  text-transform: uppercase;
}

.showroom__loading-track {
  position: relative;
  overflow: hidden;
  width: 12rem;
  height: 2px;
  border-radius: 2px;
  background: rgb(255 255 255 / 0.12);
}

.showroom__loading-track span {
  position: absolute;
  inset: 0;
  background: #20e848;
  transform-origin: left center;
  transition: transform 0.3s ease;
}

.showroom__loading-value {
  color: #20e848;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  font-variant-numeric: tabular-nums;
}

/* Overlay of the current station, bottom centre. */
.showroom__ui {
  position: absolute;
  left: 50%;
  bottom: max(1.75rem, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: min(100% - 2rem, 46rem);
  opacity: 0;
  transform: translate(-50%, 0.75rem);
  transition: opacity 0.7s ease, transform 0.7s ease;
  pointer-events: none;
}

.showroom__ui.is-visible {
  opacity: 1;
  transform: translate(-50%, 0);
}

.showroom__ui.is-visible > * {
  pointer-events: auto;
}

.showroom__info {
  /* Two lines are always reserved, so the controls below never jump. */
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: calc(var(--type-h4-size) * 1.2 + var(--type-small-size) * 1.45 + 0.3rem);
  pointer-events: none !important;
}

.showroom__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  text-align: center;
  text-shadow: 0 0.15rem 1.25rem rgb(0 0 0 / 0.85);
  animation: showroom-title-in 0.6s ease both;
}

.showroom__title-name {
  font-family: var(--app-font-display);
  font-size: var(--type-h4-size);
  font-weight: 600;
  line-height: var(--type-h4-lh);
  letter-spacing: var(--type-h4-ls);
}

.showroom__title-rest {
  max-width: 34rem;
  overflow: hidden;
  color: rgb(255 255 255 / 0.66);
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 400;
  line-height: var(--type-small-lh);
  letter-spacing: var(--type-small-ls);
  white-space: nowrap;
  text-overflow: ellipsis;
}

@keyframes showroom-title-in {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
}

.showroom__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.showroom__nav {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.25rem;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 62.4375rem;
  background: rgb(0 0 0 / 0.72);
  backdrop-filter: blur(0.75rem);
  -webkit-backdrop-filter: blur(0.75rem);
}

.showroom__arrow {
  display: inline-grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.08);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}

.showroom__arrow svg,
.showroom__open svg,
.showroom-list__open svg {
  width: 1.15rem;
  height: 1.15rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.showroom__arrow:hover:not(:disabled),
.showroom__arrow:focus-visible {
  background: #03cb00;
  color: #000;
}

.showroom__arrow:disabled {
  opacity: 0.32;
  cursor: default;
}

.showroom__arrow:focus-visible,
.showroom__open:focus-visible,
.showroom-list__card:focus-visible {
  outline: 0.1875rem solid #03cb00;
  outline-offset: 0.1875rem;
}

.showroom__counter {
  min-width: 4.75rem;
  color: rgb(255 255 255 / 0.55);
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-align: center;
}

.showroom__counter b {
  color: #fff;
  font-weight: 600;
}

.showroom__open {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 3.2rem;
  padding: 0 1.35rem;
  border-radius: 62.4375rem;
  background: #03cb00;
  color: #000;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  font-weight: 600;
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
  text-decoration: none;
  white-space: nowrap;
  transition: transform 0.2s ease, background 0.2s ease;
}

.showroom__open:hover,
.showroom__open:focus-visible {
  background: #20e848;
  transform: translateY(-2px);
}

.showroom__hint {
  margin: 0;
  color: rgb(255 255 255 / 0.45);
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  transition: opacity 0.6s ease;
}

.showroom__hint.is-hidden {
  opacity: 0;
}

.showroom__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: 0;
  color: #8f8f8f;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  transform: translate(-50%, -50%);
}

/* No-WebGL fallback: a horizontal snap-scroll strip of the same projects. */
.showroom-list {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
}

.showroom-list__track {
  display: flex;
  gap: 1.25rem;
  width: 100%;
  margin: 0;
  padding: 6rem max(1.25rem, calc(50% - 14rem)) 6rem;
  overflow-x: auto;
  list-style: none;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}

.showroom-list__item {
  flex: 0 0 min(82vw, 28rem);
  scroll-snap-align: center;
}

.showroom-list__card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  color: #fff;
  text-decoration: none;
}

.showroom-list__media {
  display: block;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 1.25rem;
  background: #0a0a0a;
}

.showroom-list__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.showroom-list__index {
  color: #20e848;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.showroom-list__title {
  font-family: var(--app-font-display);
  font-size: var(--type-h5-size);
  font-weight: 600;
  line-height: var(--type-h5-lh);
}

.showroom-list__open {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #20e848;
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
}

/* Phones: the page's heading pill sits at the bottom; the controls go above it. */
@media (max-width: 767px) {
  .showroom__ui {
    bottom: calc(max(1.25rem, env(safe-area-inset-bottom)) + 3.6rem);
    gap: 0.75rem;
  }

  .showroom__title-name {
    font-size: var(--type-h5-size);
    line-height: var(--type-h5-lh);
  }

  .showroom__info {
    min-height: calc(var(--type-h5-size) * 1.25 + var(--type-small-size) * 1.45 + 0.3rem);
  }

  .showroom__title-rest {
    max-width: 100%;
    font-size: var(--type-caption-size);
  }

  /* Arrows, counter and the link stay on one row at 360-390px. */
  .showroom__arrow {
    width: 2.5rem;
    height: 2.5rem;
  }

  .showroom__counter {
    min-width: 3.6rem;
  }

  .showroom__open {
    min-height: 3.05rem;
    padding: 0 1rem;
    font-size: var(--type-small-size);
  }
}

@media (prefers-reduced-motion: reduce) {
  .showroom__canvas,
  .showroom__ui,
  .showroom__hint,
  .showroom__arrow,
  .showroom__open,
  .showroom__loading-track span {
    transition-duration: 0ms;
  }

  .showroom__title {
    animation: none;
  }
}
</style>
