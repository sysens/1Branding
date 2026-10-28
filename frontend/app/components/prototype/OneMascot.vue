<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import type * as Three from "three";
import { servicePath, type ServiceKey } from "~/utils/servicePages";
import { toSiteLocale } from "~/utils/locales";

// PROTOTYPE "ONE as a guide" (/contact): the brand mark becomes a small 3D
// character that asks what the visitor needs and walks them to the right
// service page. The "1" is a bevelled extrusion of a hand-built outline with
// two pill eyes that follow the cursor, blink and react to the choices; a
// click squashes it like an inflatable. Four swatches put the same mark into
// four materials (one mark carries different materials on different service
// pages). The dialog is plain DOM: real links, keyboard reachable, readable
// without WebGL. Without WebGL2 a flat SVG "1" with the same eyes stands in;
// with reduced motion the 3D mark holds still and only turns to the focused
// choice.

type ChoiceKey = Extract<ServiceKey, "strategy" | "logo" | "packaging" | "web" | "crm"> | "telegram";
type MaterialKey = "black" | "chrome" | "glass" | "green";
type SiteChoice = Exclude<ChoiceKey, "telegram">;

const SERVICE_CHOICES: SiteChoice[] = ["strategy", "logo", "packaging", "web", "crm"];
const CHOICE_KEYS: ChoiceKey[] = [...SERVICE_CHOICES, "telegram"];
const MATERIALS: MaterialKey[] = ["black", "chrome", "glass", "green"];
const TELEGRAM = "https://t.me/Onebranding_contact";

interface Copy {
  hello: string;
  question: string;
  intro: string;
  nav: string;
  newTab: string;
  materials: string;
  choices: Record<ChoiceKey, string>;
  hints: Record<ChoiceKey, string>;
  materialNames: Record<MaterialKey, string>;
}

const COPY: Record<"en" | "ru" | "uz", Copy> = {
  en: {
    hello: "Hi, I’m ONE",
    question: "What do you need?",
    intro: "Pick a direction — I’ll take you to the right team.",
    nav: "Services",
    newTab: "(opens in a new tab)",
    materials: "One mark, many materials",
    choices: { strategy: "Naming", logo: "Logo", packaging: "Packaging", web: "Website", crm: "CRM", telegram: "Write in Telegram" },
    hints: {
      strategy: "A name and a strategy the market remembers.",
      logo: "A mark that works from app icon to billboard.",
      packaging: "Packaging that sells itself on the shelf.",
      web: "A website that turns visitors into clients.",
      crm: "A CRM where no request gets lost.",
      telegram: "Or just write to us — we reply fast.",
    },
    materialNames: { black: "Glossy black", chrome: "Chrome", glass: "Frosted glass", green: "Brand green" },
  },
  ru: {
    hello: "Привет, я ONE",
    question: "Что вам нужно?",
    intro: "Выберите направление — я проведу вас к нужной команде.",
    nav: "Услуги",
    newTab: "(откроется в новой вкладке)",
    materials: "Один знак — разные материалы",
    choices: { strategy: "Нейминг", logo: "Логотип", packaging: "Упаковка", web: "Сайт", crm: "CRM", telegram: "Написать в Telegram" },
    hints: {
      strategy: "Название и стратегия, которые запомнит рынок.",
      logo: "Знак, который работает от иконки до билборда.",
      packaging: "Упаковка, которая продаёт себя с полки.",
      web: "Сайт, который превращает посетителей в клиентов.",
      crm: "CRM, в которой не теряется ни одна заявка.",
      telegram: "Или просто напишите нам — отвечаем быстро.",
    },
    materialNames: { black: "Чёрный глянец", chrome: "Хром", glass: "Матовое стекло", green: "Фирменный зелёный" },
  },
  uz: {
    hello: "Salom, men ONE",
    question: "Sizga nima kerak?",
    intro: "Yoʻnalishni tanlang — sizni kerakli jamoaga olib boraman.",
    nav: "Xizmatlar",
    newTab: "(yangi oynada ochiladi)",
    materials: "Bitta belgi — turli materiallar",
    choices: { strategy: "Neyming", logo: "Logotip", packaging: "Qadoq", web: "Sayt", crm: "CRM", telegram: "Telegramda yozish" },
    hints: {
      strategy: "Bozor eslab qoladigan nom va strategiya.",
      logo: "Ilova belgisidan bilbordgacha ishlaydigan belgi.",
      packaging: "Javonda oʻzini oʻzi sotadigan qadoq.",
      web: "Tashrif buyuruvchini mijozga aylantiradigan sayt.",
      crm: "Birorta ham ariza yoʻqolmaydigan CRM.",
      telegram: "Yoki shunchaki bizga yozing — tez javob beramiz.",
    },
    materialNames: { black: "Qora yaltiroq", chrome: "Xrom", glass: "Xira shisha", green: "Brend yashil rangi" },
  },
};

const { locale } = useI18n();
const siteLocale = computed(() => toSiteLocale(locale.value));
const copy = computed(() => COPY[siteLocale.value]);
const choices = computed(() =>
  SERVICE_CHOICES.map((key) => ({ key, label: copy.value.choices[key], to: servicePath(key, siteLocale.value) })),
);
// SVG ids end up in url(#...), so keep them to plain characters.
const uid = `one-mascot-${useId().replace(/[^\w-]/g, "")}`;

// ---------------------------------------------------------------------------
// The mark: one outline for both the 3D extrusion and the SVG fallback.
// ---------------------------------------------------------------------------
const SHAPE_W = 0.95;
const SHAPE_H = 2.7;
// Corners of the "1" (x, y, how far the rounding reaches along each edge),
// counter-clockwise from the bottom-left of the stem; the flag points left.
const OUTLINE: [number, number, number][] = [
  [0, 0, 0.3],
  [SHAPE_W, 0, 0.3],
  [SHAPE_W, SHAPE_H, 0.3],
  [0.1, SHAPE_H, 0.26],
  [-0.8, SHAPE_H - 0.62, 0.22],
  [-0.8, SHAPE_H - 1.1, 0.2],
  // The notch under the flag is concave: a long rounding keeps its curve wider
  // than the bevel, so the bevelled outline does not fold over itself there.
  [0, SHAPE_H - 0.62, 0.6],
];
// Eyes on the face of the stem (shape coordinates).
const EYE_Y = SHAPE_H - 0.7;
const EYE_GAP = 0.2;

type Point = [number, number];
const CORNERS = OUTLINE.map(([x, y, reach], i) => {
  const toward = (q: [number, number, number]): Point => {
    const dx = q[0] - x;
    const dy = q[1] - y;
    const len = Math.hypot(dx, dy);
    return [x + (dx / len) * reach, y + (dy / len) * reach];
  };
  return {
    from: toward(OUTLINE[(i + OUTLINE.length - 1) % OUTLINE.length]!),
    at: [x, y] as Point,
    to: toward(OUTLINE[(i + 1) % OUTLINE.length]!),
  };
});

// SVG y grows downwards.
const svgPoint = ([x, y]: Point) => `${x.toFixed(3)} ${(SHAPE_H - y).toFixed(3)}`;
const ONE_PATH =
  CORNERS.map((c, i) => `${i ? "L" : "M"}${svgPoint(c.from)} Q${svgPoint(c.at)} ${svgPoint(c.to)}`).join(" ") + " Z";

// Eyes per material: the resting colour and the colour while a choice is hovered.
const EYE_COLORS: Record<MaterialKey, { base: string; active: string }> = {
  black: { base: "#ffffff", active: "#20e848" },
  // Dark pills read better than white ones on a bright mirror.
  chrome: { base: "#0c0c0c", active: "#03cb00" },
  glass: { base: "#ffffff", active: "#20e848" },
  green: { base: "#04170a", active: "#ffffff" },
};

// How each choice changes the eyes: width, height and a head tilt.
const MOODS: Record<ChoiceKey, { sx: number; sy: number; tilt: number }> = {
  strategy: { sx: 1.05, sy: 0.55, tilt: 0.1 }, // narrowed: thinking about a name
  logo: { sx: 1.3, sy: 1.25, tilt: -0.04 }, // wide-eyed
  packaging: { sx: 1.15, sy: 0.85, tilt: -0.09 },
  web: { sx: 1.15, sy: 1.15, tilt: 0.05 },
  crm: { sx: 0.95, sy: 1.12, tilt: -0.05 },
  telegram: { sx: 1.25, sy: 0.4, tilt: 0.08 }, // a smiling squint
};
const NEUTRAL = { sx: 1, sy: 1, tilt: 0 };

// ---------------------------------------------------------------------------
// State shared by the DOM and the scene.
// ---------------------------------------------------------------------------
const root = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const mode = ref<"pending" | "webgl" | "fallback">("pending");
const ready = ref(false);
const material = ref<MaterialKey>("black");
const hoverKey = ref<ChoiceKey | null>(null);
const focusKey = ref<ChoiceKey | null>(null);
const activeKey = computed(() => hoverKey.value ?? focusKey.value);
let hoverEl: HTMLElement | null = null;
let focusEl: HTMLElement | null = null;
const activeEl = () => (hoverKey.value ? hoverEl : focusKey.value ? focusEl : null);

const hint = computed(() => (activeKey.value ? copy.value.hints[activeKey.value] : copy.value.intro));

// Fallback eyes: offset and mood as CSS variables on the SVG.
const fallbackLook = ref({ x: 0, y: 0 });
const fallbackStyle = computed(() => {
  const mood = activeKey.value ? MOODS[activeKey.value] : NEUTRAL;
  return {
    "--look-x": `${(fallbackLook.value.x * 0.08).toFixed(3)}px`,
    "--look-y": `${(fallbackLook.value.y * 0.07).toFixed(3)}px`,
    "--eye-sx": mood.sx,
    "--eye-sy": mood.sy,
    "--eye-color": activeKey.value ? EYE_COLORS[material.value].active : EYE_COLORS[material.value].base,
  };
});

let reducedMotion = false;
const pointer = { x: 0, y: 0, known: false };
const clamp = (v: number, min = -1, max = 1) => Math.min(max, Math.max(min, v));

// Where a screen point lies relative to the character, roughly in -1..1.
const lookFrom = (x: number, y: number, rect: DOMRect) => ({
  x: clamp((x - (rect.left + rect.width * 0.55)) / (rect.width * 0.7)),
  y: clamp((y - (rect.top + rect.height * 0.4)) / (rect.height * 0.7)),
});
const elementCenter = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

// ---------------------------------------------------------------------------
// Speech bubble: the question types itself once the block is on screen.
// ---------------------------------------------------------------------------
const typed = ref("");
const typingDone = ref(false);
let typeTimer: number | undefined;
const startTyping = () => {
  const full = copy.value.question;
  window.clearTimeout(typeTimer);
  if (reducedMotion) {
    typed.value = full;
    typingDone.value = true;
    return;
  }
  let i = 0;
  typed.value = "";
  typingDone.value = false;
  const step = () => {
    i += 1;
    typed.value = full.slice(0, i);
    if (i < full.length) typeTimer = window.setTimeout(step, 42 + Math.random() * 46);
    else typingDone.value = true;
  };
  typeTimer = window.setTimeout(step, 320);
};
watch(copy, () => {
  window.clearTimeout(typeTimer);
  typed.value = copy.value.question;
  typingDone.value = true;
});

// ---------------------------------------------------------------------------
// Choices and swatches.
// ---------------------------------------------------------------------------
interface SceneApi {
  react: (key: ChoiceKey | null) => void;
  setMaterial: (key: MaterialKey) => void;
  greet: () => void;
}
let sceneApi: SceneApi | null = null;

const onChoiceEnter = (key: ChoiceKey, event: PointerEvent) => {
  hoverEl = event.currentTarget as HTMLElement;
  hoverKey.value = key;
};
const onChoiceLeave = (key: ChoiceKey) => {
  if (hoverKey.value === key) hoverKey.value = null;
};
const onChoiceFocus = (key: ChoiceKey, event: FocusEvent) => {
  focusEl = event.currentTarget as HTMLElement;
  focusKey.value = key;
};
const onChoiceBlur = (key: ChoiceKey) => {
  if (focusKey.value === key) focusKey.value = null;
};

const updateFallbackLook = () => {
  const host = stage.value;
  if (!host || mode.value !== "fallback") return;
  const rect = host.getBoundingClientRect();
  const el = activeEl();
  if (el) fallbackLook.value = lookFrom(elementCenter(el).x, elementCenter(el).y, rect);
  else if (pointer.known && !reducedMotion) fallbackLook.value = lookFrom(pointer.x, pointer.y, rect);
  else fallbackLook.value = { x: 0, y: 0 };
};

watch(activeKey, (key) => {
  sceneApi?.react(key);
  updateFallbackLook();
});

const selectMaterial = (key: MaterialKey) => {
  if (material.value === key) return;
  material.value = key;
  sceneApi?.setMaterial(key);
};

// ---------------------------------------------------------------------------
// The 3D character.
// ---------------------------------------------------------------------------
const DEPTH = 0.42;
const BEVEL_T = 0.34;
const BEVEL_S = 0.26;
const BASE_X = 0.32; // the flag sticks out left: nudge the body right to balance it
const BASE_Y = 0.16;

const vertexHead = /* glsl */ `#include <common>
uniform float uTime;
uniform float uPuff;
varying vec3 vObj;`;
const vertexBody = /* glsl */ `#include <begin_vertex>
vObj = position;
// Inflate along the normal; a ripple runs up the body while it wobbles.
float ripple = 0.65 + 0.35 * sin(position.y * 4.0 - uTime * 16.0);
transformed += objectNormal * uPuff * ripple;`;
const fragmentHead = /* glsl */ `#include <common>
uniform float uReveal;
uniform float uDir;
uniform vec3 uSeam;
varying vec3 vObj;`;
// Material swap: the incoming material (uDir = 1) shows below a wavy line that
// sweeps up the body, the outgoing one (uDir = -1) above it.
const fragmentCut = /* glsl */ `#include <clipping_planes_fragment>
float sweepH = vObj.y + sin(vObj.x * 7.0 + vObj.z * 5.0) * 0.06;
if (uDir * (sweepH - uReveal) > 0.0) discard;`;
const fragmentSeam = /* glsl */ `#include <emissivemap_fragment>
totalEmissiveRadiance += uSeam * (1.0 - smoothstep(0.0, 0.09, abs(sweepH - uReveal))) * 2.4 * max(uDir, 0.0);`;

const radialTexture = (THREE: typeof Three, stops: [number, string][]) => {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

let cleanup: (() => void) | undefined;
let disposed = false;

const initScene = async () => {
  const host = stage.value;
  const el = canvas.value;
  if (!host || !el) return;

  const THREE = await import("three");
  const [{ RoomEnvironment }, { mergeVertices }] = await Promise.all([
    import("three/examples/jsm/environments/RoomEnvironment.js"),
    import("three/examples/jsm/utils/BufferGeometryUtils.js"),
  ]);
  if (disposed) return;

  let renderer: Three.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    mode.value = "fallback";
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral keeps the brand green green (ACES pushes it towards yellow).
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);

  // Studio reflections, plus a brand-green strip light that chrome and gloss pick up.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#20e848").multiplyScalar(14) }),
  );
  strip.position.set(14.5, 6, 5);
  strip.scale.set(0.2, 9, 3.5);
  room.add(strip);
  const envTarget = pmrem.fromScene(room, 0.04);
  scene.environment = envTarget.texture;
  // Turn the room so its big front light is not right behind the camera:
  // otherwise the face of the glossy black mark mirrors it as a white sheet.
  scene.environmentRotation.set(0.15, 0.85, 0);
  room.dispose();
  pmrem.dispose();

  // A green rim from behind separates the black body from the black page.
  const rim = new THREE.DirectionalLight("#20e848", 2.4);
  rim.position.set(-3, 2.5, -3);
  const keyLight = new THREE.DirectionalLight("#ffffff", 0.7);
  keyLight.position.set(2.5, 3, 4);
  scene.add(rim, keyLight);

  // Opaque backdrop: a soft green pool behind the character that fades to the
  // page's black. Frosted glass needs something behind it to blur.
  const backdropTexture = radialTexture(THREE, [
    [0, "#0e521c"],
    [0.3, "#072a0d"],
    [0.6, "#010802"],
    [0.8, "#000000"],
    [1, "#000000"],
  ]);
  // Sized so the pool fades out inside the stage: no glowing rectangle.
  const backdropGeometry = new THREE.PlaneGeometry(7, 7);
  const backdropMaterial = new THREE.MeshBasicMaterial({ map: backdropTexture, toneMapped: false });
  const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
  backdrop.position.set(BASE_X, 0.1, -2.6);
  scene.add(backdrop);

  // Body geometry: a puffy extrusion with smooth normals (merged vertices).
  const shape = new THREE.Shape();
  CORNERS.forEach((c, i) => {
    if (i === 0) shape.moveTo(c.from[0], c.from[1]);
    else shape.lineTo(c.from[0], c.from[1]);
    shape.quadraticCurveTo(c.at[0], c.at[1], c.to[0], c.to[1]);
  });
  shape.closePath();
  const extruded = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL_T,
    bevelSize: BEVEL_S,
    bevelSegments: 10,
    curveSegments: 14,
  });
  extruded.translate(-SHAPE_W / 2, -SHAPE_H / 2, -DEPTH / 2);
  extruded.deleteAttribute("normal");
  extruded.deleteAttribute("uv");
  const bodyGeometry = mergeVertices(extruded, 1e-4);
  extruded.dispose();
  bodyGeometry.computeVertexNormals();
  bodyGeometry.computeBoundingBox();
  const bounds = bodyGeometry.boundingBox!;
  const frontZ = DEPTH / 2 + BEVEL_T;
  // The flat faces are a few long triangles: averaged normals on their edges
  // would draw streaks across them in chrome, so they point straight out.
  const positions = bodyGeometry.getAttribute("position");
  const normals = bodyGeometry.getAttribute("normal");
  for (let i = 0; i < positions.count; i++) {
    const z = positions.getZ(i);
    if (Math.abs(Math.abs(z) - frontZ) < 1e-4) normals.setXYZ(i, 0, 0, Math.sign(z));
  }
  normals.needsUpdate = true;

  const shared = {
    uTime: { value: 0 },
    uPuff: { value: 0 },
    uSeam: { value: new THREE.Color("#20e848") },
  };
  const sweepUniforms = new Map<Three.Material, { uReveal: { value: number }; uDir: { value: number } }>();
  const patch = (m: Three.MeshPhysicalMaterial) => {
    const own = { uReveal: { value: 0 }, uDir: { value: 0 } };
    sweepUniforms.set(m, own);
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, shared, own);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", vertexHead)
        .replace("#include <begin_vertex>", vertexBody);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", fragmentHead)
        .replace("#include <clipping_planes_fragment>", fragmentCut)
        .replace("#include <emissivemap_fragment>", fragmentSeam);
    };
    m.customProgramCacheKey = () => "one-mascot-body";
    return m;
  };

  const materials: Record<MaterialKey, Three.MeshPhysicalMaterial> = {
    black: patch(new THREE.MeshPhysicalMaterial({
      color: "#060606", roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.3,
    })),
    chrome: patch(new THREE.MeshPhysicalMaterial({
      color: "#f4f4f4", roughness: 0.07, metalness: 1, envMapIntensity: 1.25,
    })),
    glass: patch(new THREE.MeshPhysicalMaterial({
      // A little diffuse white under the transmission reads as frost, not tinted glass.
      color: "#eefff2", roughness: 0.42, metalness: 0, transmission: 0.9, thickness: 1.1, ior: 1.35,
      attenuationColor: new THREE.Color("#d4ffdc"), attenuationDistance: 3.5,
      clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1.15,
    })),
    green: patch(new THREE.MeshPhysicalMaterial({
      color: "#03cb00", emissive: "#20e848", emissiveIntensity: 0.3, roughness: 0.26, metalness: 0,
      clearcoat: 0.8, clearcoatRoughness: 0.08, envMapIntensity: 0.9,
    })),
  };

  // Rig: float, hop and look (pivot in the middle) > squash (pivot at the
  // feet) > body. Two body meshes so a material swap can sweep across.
  const rig = new THREE.Group();
  rig.position.set(BASE_X, BASE_Y, 0);
  const squashPivot = new THREE.Group();
  squashPivot.position.y = bounds.min.y;
  const body = new THREE.Group();
  body.position.y = -bounds.min.y;
  const bodyA = new THREE.Mesh(bodyGeometry, materials[material.value]);
  const bodyB = new THREE.Mesh(bodyGeometry, materials[material.value]);
  bodyB.visible = false;

  const eyeGeometry = new THREE.CapsuleGeometry(0.085, 0.16, 6, 16);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: EYE_COLORS[material.value].base, toneMapped: false });
  const eyes = new THREE.Group();
  const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial);
  const eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterial);
  eyeLeft.position.x = -EYE_GAP;
  eyeRight.position.x = EYE_GAP;
  eyes.add(eyeLeft, eyeRight);
  const eyeBaseY = EYE_Y - SHAPE_H / 2;
  eyes.position.set(0, eyeBaseY, frontZ + 0.02);
  eyes.scale.z = 0.45;

  body.add(bodyA, bodyB, eyes);
  squashPivot.add(body);
  rig.add(squashPivot);
  scene.add(rig);

  // A green pool of light on the "floor" that shrinks while the mark hops.
  const floorTexture = radialTexture(THREE, [
    [0, "rgba(32,232,72,0.55)"],
    [0.45, "rgba(32,232,72,0.14)"],
    [1, "rgba(32,232,72,0)"],
  ]);
  const floorGeometry = new THREE.PlaneGeometry(3.4, 0.85);
  const floorMaterial = new THREE.MeshBasicMaterial({
    map: floorTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(BASE_X, BASE_Y + bounds.min.y - 0.02, -0.4);
  scene.add(floor);

  // Compile all four materials up front so the first swap does not hitch.
  const precompile = new THREE.Group();
  precompile.visible = false;
  for (const key of MATERIALS) precompile.add(new THREE.Mesh(bodyGeometry, materials[key]));
  scene.add(precompile);

  const layout = () => {
    const width = host.clientWidth;
    const height = el.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Fit the character (with room for a hop) whatever the stage's aspect.
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, Math.max(2.3, 1.85 / camera.aspect) / tan);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };
  layout();

  // ---- motion state ----
  const look = { x: 0, y: 0 };
  const eyeScale = { x: 1, y: 1 };
  let tilt = 0;
  let puffHover = 0;
  let squash = 0;
  let squashVelocity = 0;
  let hopY = 0;
  let hopVelocity = 0;
  let nextBlink = 1.6;
  let blinkStart = -10;
  let secondBlink = -10;
  let squeezeUntil = -10;
  let sweep: { from: MaterialKey; to: MaterialKey; t: number } | null = null;
  const eyeTarget = new THREE.Color();
  let lastKey: ChoiceKey | null = null;

  const hop = (strength = 3.3) => {
    if (reducedMotion || hopY > 0.02) return;
    hopVelocity = strength;
    hopY = 0.001;
    squashVelocity -= 2.4; // stretch on take-off
  };

  const finishSweep = () => {
    if (!sweep) return;
    bodyA.material = materials[sweep.to];
    bodyB.visible = false;
    for (const own of sweepUniforms.values()) own.uDir.value = 0;
    sweep = null;
  };

  const lookTarget = (time: number, rect: DOMRect) => {
    const el2 = activeEl();
    if (el2) {
      const c = elementCenter(el2);
      return lookFrom(c.x, c.y, rect);
    }
    if (reducedMotion) return { x: 0, y: 0 };
    if (pointer.known) return lookFrom(pointer.x, pointer.y, rect);
    // Nobody around: look about a little.
    return { x: Math.sin(time * 0.4) * 0.3, y: Math.sin(time * 0.53) * 0.12 };
  };

  // Places everything from the current state; `dt` 0 snaps (reduced motion).
  const pose = (time: number, dt: number) => {
    const rect = el.getBoundingClientRect();
    const target = lookTarget(time, rect);
    const mood = activeKey.value ? MOODS[activeKey.value] : NEUTRAL;
    const ease = (rate: number) => (dt ? 1 - Math.exp(-dt * rate) : 1);
    look.x += (target.x - look.x) * ease(activeKey.value ? 9 : 5);
    look.y += (target.y - look.y) * ease(activeKey.value ? 9 : 5);
    tilt += (mood.tilt - tilt) * ease(8);
    eyeScale.x += (mood.sx - eyeScale.x) * ease(14);
    eyeScale.y += (mood.sy - eyeScale.y) * ease(14);
    puffHover += ((activeKey.value ? 0.025 : 0) - puffHover) * ease(8);

    const colors = EYE_COLORS[sweep ? sweep.to : material.value];
    eyeTarget.set(activeKey.value ? colors.active : colors.base);
    eyeMaterial.color.lerp(eyeTarget, ease(10));

    const float = reducedMotion ? 0 : Math.sin(time * 1.5) * 0.07;
    rig.position.y = BASE_Y + float + hopY;
    rig.rotation.y = look.x * 0.55;
    rig.rotation.x = look.y * 0.3;
    rig.rotation.z = tilt + (reducedMotion ? 0 : Math.sin(time * 1.05) * 0.03);

    // Blink (sometimes twice), or squeeze shut right after a poke.
    let blink = 1;
    if (!reducedMotion) {
      if (time > nextBlink) {
        blinkStart = time;
        secondBlink = Math.random() < 0.22 ? time + 0.26 : -10;
        nextBlink = time + 2.2 + Math.random() * 3.8;
      }
      for (const start of [blinkStart, secondBlink]) {
        const phase = (time - start) / 0.15;
        if (phase >= 0 && phase < 1) blink = Math.min(blink, 1 - Math.sin(phase * Math.PI) * 0.92);
      }
    }
    const squeezed = time < squeezeUntil;
    eyes.position.x = look.x * 0.08;
    eyes.position.y = eyeBaseY - look.y * 0.07;
    eyes.position.z = frontZ + 0.02 + shared.uPuff.value;
    for (const eye of [eyeLeft, eyeRight]) {
      eye.scale.x = squeezed ? 1.25 : eyeScale.x;
      eye.scale.y = squeezed ? 0.16 : eyeScale.y * blink;
    }

    squashPivot.scale.set(1 + squash * 0.55, 1 - squash, 1 + squash * 0.55);
    shared.uPuff.value = Math.min(0.1, Math.abs(squash) * 0.28) + puffHover;
    shared.uTime.value = time;

    floor.scale.x = 1 - Math.min(0.5, hopY * 0.9);
    floorMaterial.opacity = 1 - Math.min(0.6, hopY * 1.6);
  };

  const step = (dt: number) => {
    // Hop: a little ballistic jump; the landing squashes the body.
    if (hopY > 0) {
      hopVelocity -= 24 * dt;
      hopY += hopVelocity * dt;
      if (hopY <= 0) {
        squashVelocity += Math.max(0, -hopVelocity) * 0.85;
        hopY = 0;
        hopVelocity = 0;
      }
    }
    // Squash-and-stretch: an underdamped spring, so a poke wobbles like an inflatable.
    const accel = -260 * squash - 9 * squashVelocity;
    squashVelocity += accel * dt;
    squash += squashVelocity * dt;

    if (sweep) {
      sweep.t += dt / 0.75;
      const t = Math.min(1, sweep.t);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const reveal = bounds.min.y - 0.2 + (bounds.max.y - bounds.min.y + 0.4) * eased;
      sweepUniforms.get(materials[sweep.from])!.uReveal.value = reveal;
      sweepUniforms.get(materials[sweep.to])!.uReveal.value = reveal;
      if (sweep.t >= 1) finishSweep();
    }
  };

  // Poke: squash when the click lands on the body.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitsBody = (event: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(bodyA, false).length > 0;
  };
  let clock: Three.Clock | null = null;
  const onPoke = (event: PointerEvent) => {
    if (reducedMotion || !hitsBody(event)) return;
    squashVelocity += 5.2;
    squeezeUntil = (clock?.elapsedTime ?? 0) + 0.38;
  };
  const onHover = (event: PointerEvent) => {
    el.style.cursor = !reducedMotion && hitsBody(event) ? "pointer" : "";
  };
  el.addEventListener("pointerdown", onPoke);
  el.addEventListener("pointermove", onHover, { passive: true });

  let frame = 0;
  let visible = true;
  const renderStill = () => {
    if (disposed) return;
    pose(0, 0);
    renderer.render(scene, camera);
  };

  // Draw only while the block is on screen and the tab is visible.
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
  }, { rootMargin: "120px 0px" });
  observer.observe(host);
  const resizeObserver = new ResizeObserver(() => {
    layout();
    if (reducedMotion) renderStill();
  });
  resizeObserver.observe(host);

  cleanup = () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    resizeObserver.disconnect();
    el.removeEventListener("pointerdown", onPoke);
    el.removeEventListener("pointermove", onHover);
    bodyGeometry.dispose();
    eyeGeometry.dispose();
    eyeMaterial.dispose();
    for (const m of Object.values(materials)) m.dispose();
    backdropGeometry.dispose();
    backdropMaterial.dispose();
    backdropTexture.dispose();
    floorGeometry.dispose();
    floorMaterial.dispose();
    floorTexture.dispose();
    envTarget.dispose();
    renderer.dispose();
  };

  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    // Compiling on first use is fine too.
  }
  scene.remove(precompile);
  // Unmounted while compiling: cleanup has already run.
  if (disposed) return;

  sceneApi = {
    react: (key) => {
      if (reducedMotion) {
        renderStill();
        return;
      }
      if (key && key !== lastKey) hop(key === "telegram" ? 3.8 : 3.1);
      lastKey = key;
    },
    setMaterial: (key) => {
      if (reducedMotion) {
        bodyA.material = materials[key];
        renderStill();
        return;
      }
      finishSweep();
      const from = MATERIALS.find((m) => materials[m] === bodyA.material);
      if (!from || from === key) return;
      bodyB.material = materials[key];
      bodyB.visible = true;
      sweepUniforms.get(materials[from])!.uDir.value = -1;
      sweepUniforms.get(materials[key])!.uDir.value = 1;
      sweep = { from, to: key, t: 0 };
      hop(2.6);
    },
    greet: () => {
      hop(3.6);
      nextBlink = (clock?.elapsedTime ?? 0) + 0.7;
    },
  };

  if (reducedMotion) {
    renderStill();
  } else {
    clock = new THREE.Clock();
    const render = () => {
      frame = requestAnimationFrame(render);
      if (!visible || document.hidden) {
        clock!.getDelta(); // keep the step small when we come back
        return;
      }
      const dt = Math.min(clock!.getDelta(), 0.05);
      step(dt);
      pose(clock!.elapsedTime, dt);
      renderer.render(scene, camera);
    };
    render();
  }
  ready.value = true;
  if (!reducedMotion) window.setTimeout(() => sceneApi?.greet(), 450);
};

// ---------------------------------------------------------------------------
// Lifecycle.
// ---------------------------------------------------------------------------
let initObserver: IntersectionObserver | undefined;
let typeObserver: IntersectionObserver | undefined;
let pointerFrame = 0;
const onPointerMove = (event: PointerEvent) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.known = true;
  if (mode.value === "fallback" && !pointerFrame) {
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      updateFallbackLook();
    });
  }
};

onMounted(() => {
  const host = root.value;
  if (!host) return;
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  typed.value = "";

  typeObserver = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return;
    typeObserver?.disconnect();
    startTyping();
  }, { threshold: 0.35 });
  typeObserver.observe(host);
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  const probe = document.createElement("canvas").getContext("webgl2");
  if (!probe) {
    mode.value = "fallback";
    return;
  }
  // Give the probe's context back right away: other prototypes need theirs.
  probe.getExtension("WEBGL_lose_context")?.loseContext();
  mode.value = "webgl";

  // Load three.js only when the block comes near the viewport.
  initObserver = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return;
    initObserver?.disconnect();
    initScene().catch(() => {
      if (!disposed) mode.value = "fallback";
    });
  }, { rootMargin: "300px 0px" });
  initObserver.observe(host);
});

onBeforeUnmount(() => {
  disposed = true;
  sceneApi = null;
  window.clearTimeout(typeTimer);
  cancelAnimationFrame(pointerFrame);
  window.removeEventListener("pointermove", onPointerMove);
  initObserver?.disconnect();
  typeObserver?.disconnect();
  cleanup?.();
});
</script>

<template>
  <section ref="root" class="one-mascot" :aria-labelledby="`${uid}-question`">
    <div class="one-mascot__inner">
      <div class="one-mascot__stage">
        <div ref="stage" class="one-mascot__art" :class="{ 'is-ready': ready }" aria-hidden="true">
          <canvas v-show="mode !== 'fallback'" ref="canvas" class="one-mascot__canvas" />
          <svg
            v-if="mode === 'fallback'"
            class="one-mascot__fallback"
            :class="`is-${material}`"
            :style="fallbackStyle"
            viewBox="-1.1 -0.3 2.3 3.3"
            focusable="false"
          >
            <defs>
              <linearGradient :id="`${uid}-black`" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#3a3a3a" />
                <stop offset="0.35" stop-color="#0c0c0c" />
                <stop offset="1" stop-color="#000" />
              </linearGradient>
              <linearGradient :id="`${uid}-chrome`" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ffffff" />
                <stop offset="0.4" stop-color="#8d8d8d" />
                <stop offset="0.55" stop-color="#f2f2f2" />
                <stop offset="1" stop-color="#5e5e5e" />
              </linearGradient>
              <linearGradient :id="`${uid}-glass`" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ffffff" stop-opacity="0.38" />
                <stop offset="1" stop-color="#bfffcf" stop-opacity="0.1" />
              </linearGradient>
              <linearGradient :id="`${uid}-green`" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#5cff73" />
                <stop offset="0.5" stop-color="#20e848" />
                <stop offset="1" stop-color="#03cb00" />
              </linearGradient>
            </defs>
            <g class="one-mascot__fb-body">
              <path
                :d="ONE_PATH"
                :fill="`url(#${uid}-${material})`"
                stroke="rgb(255 255 255 / 0.28)"
                stroke-width="0.03"
              />
              <g class="one-mascot__fb-eyes">
                <g v-for="side in [-1, 1]" :key="side" class="one-mascot__fb-eye">
                  <rect
                    :x="SHAPE_W / 2 + side * EYE_GAP - 0.085"
                    :y="SHAPE_H - EYE_Y - 0.165"
                    width="0.17"
                    height="0.33"
                    rx="0.085"
                  />
                </g>
              </g>
            </g>
          </svg>
        </div>

        <div class="one-mascot__materials" role="group" :aria-label="copy.materials">
          <span class="one-mascot__materials-label" aria-hidden="true">{{ copy.materials }}</span>
          <button
            v-for="m in MATERIALS"
            :key="m"
            type="button"
            class="one-mascot__swatch"
            :class="`is-${m}`"
            :aria-pressed="material === m"
            :aria-label="copy.materialNames[m]"
            :title="copy.materialNames[m]"
            @click="selectMaterial(m)"
          >
            <span />
          </button>
          <!-- All names share one cell, so the row keeps the width of the longest
               and the swatches never shift under the pointer. -->
          <span class="one-mascot__materials-name" aria-hidden="true">
            <span v-for="m in MATERIALS" :key="m" :class="{ 'is-current': m === material }">{{ copy.materialNames[m] }}</span>
          </span>
        </div>
      </div>

      <div class="one-mascot__dialog">
        <div class="one-mascot__bubble">
          <p class="one-mascot__hello">{{ copy.hello }}</p>
          <h2 :id="`${uid}-question`" class="one-mascot__question">
            <span class="sr-only">{{ copy.question }}</span>
            <span class="one-mascot__type" aria-hidden="true">
              <span class="one-mascot__ghost">{{ copy.question }}</span>
              <span class="one-mascot__typed">{{ typed }}<span class="one-mascot__caret" :class="{ 'is-done': typingDone }" /></span>
            </span>
          </h2>
          <p class="one-mascot__hint">
            <Transition name="one-mascot-hint" mode="out-in">
              <span :key="hint">{{ hint }}</span>
            </Transition>
          </p>
        </div>

        <nav class="one-mascot__nav" :aria-label="copy.nav">
          <ul class="one-mascot__choices" role="list">
            <li v-for="choice in choices" :key="choice.key">
              <NuxtLink
                :to="choice.to"
                class="one-mascot__choice"
                :class="{ 'is-active': activeKey === choice.key }"
                :aria-describedby="`${uid}-hint-${choice.key}`"
                @pointerenter="onChoiceEnter(choice.key, $event)"
                @pointerleave="onChoiceLeave(choice.key)"
                @focus="onChoiceFocus(choice.key, $event)"
                @blur="onChoiceBlur(choice.key)"
              >
                <span>{{ choice.label }}</span>
                <svg class="one-mascot__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </NuxtLink>
            </li>
          </ul>
          <a
            :href="TELEGRAM"
            target="_blank"
            rel="noopener noreferrer"
            class="one-mascot__telegram"
            :class="{ 'is-active': activeKey === 'telegram' }"
            :aria-describedby="`${uid}-hint-telegram`"
            @pointerenter="onChoiceEnter('telegram', $event)"
            @pointerleave="onChoiceLeave('telegram')"
            @focus="onChoiceFocus('telegram', $event)"
            @blur="onChoiceBlur('telegram')"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M21.5 4.2 2.9 11.4c-.9.4-.9 1.6.1 1.9l4.6 1.5 1.8 5.5c.3.8 1.3 1 1.9.4l2.6-2.4 4.6 3.4c.7.5 1.7.1 1.9-.7l3.1-14.6c.2-1-.8-1.8-1.7-1.4ZM9.6 14.3l8.2-6.3-6.6 7.3-.3 2.9-1.3-3.9Z" />
            </svg>
            <span>{{ copy.choices.telegram }}</span>
            <span class="sr-only">{{ copy.newTab }}</span>
          </a>
        </nav>

        <div hidden>
          <span v-for="key in CHOICE_KEYS" :id="`${uid}-hint-${key}`" :key="key">{{ copy.hints[key] }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.one-mascot {
  position: relative;
  padding: 0 0 clamp(3rem, 7vw, 6.5rem);
  color: #fff;
}
.one-mascot__inner {
  display: grid;
  grid-template-columns: minmax(0, 45fr) minmax(0, 55fr);
  align-items: center;
  gap: clamp(1.5rem, 4vw, 4.5rem);
  width: 100%;
  max-width: 90.625rem;
  margin: 0 auto;
  padding: 0 clamp(1rem, 3vw, 2.5rem);
  box-sizing: border-box;
}

/* ---- stage ---- */
.one-mascot__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}
.one-mascot__art {
  position: relative;
  width: 100%;
  height: clamp(26rem, 38vw, 34rem);
}
/* The same green pool the WebGL backdrop draws, for the loading and fallback states. */
.one-mascot__art::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(closest-side, rgb(13 79 27 / 0.9), rgb(8 50 15 / 0.55) 40%, rgb(0 0 0 / 0) 100%);
  transition: opacity 0.8s ease;
}
.one-mascot__art.is-ready::before {
  opacity: 0;
}
.one-mascot__canvas {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease;
  /* Soft edges: the backdrop already fades to black, this hides any seam. */
  -webkit-mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent),
    linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent),
    linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent);
  mask-composite: intersect;
  touch-action: pan-y;
}
.one-mascot__art.is-ready .one-mascot__canvas {
  opacity: 1;
}

/* ---- fallback mark ---- */
.one-mascot__fallback {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 6% 0 8%;
  box-sizing: border-box;
  overflow: visible;
}
.one-mascot__fb-body {
  animation: one-mascot-float 3.6s ease-in-out infinite;
}
.one-mascot__fb-eyes {
  transform: translate(var(--look-x, 0), var(--look-y, 0));
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.one-mascot__fb-eye {
  transform-box: fill-box;
  transform-origin: center;
  transform: scale(var(--eye-sx, 1), var(--eye-sy, 1));
  transition: transform 0.25s ease;
}
.one-mascot__fb-eye rect {
  fill: var(--eye-color, #fff);
  transform-box: fill-box;
  transform-origin: center;
  animation: one-mascot-blink 4.8s infinite;
  transition: fill 0.25s ease;
}
@keyframes one-mascot-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.06px); }
}
@keyframes one-mascot-blink {
  0%, 93%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

/* ---- material switch ---- */
.one-mascot__materials {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3125rem 0.875rem 0.3125rem 1rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  white-space: nowrap;
}
.one-mascot__materials-label {
  margin-right: 0.375rem;
  color: rgb(255 255 255 / 0.55);
  font-family: var(--app-font-sans);
  font-size: 0.8125rem;
}
.one-mascot__materials-name {
  display: grid;
  margin-left: 0.375rem;
  color: #20e848;
  font-family: var(--app-font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
}
.one-mascot__materials-name > span {
  grid-area: 1 / 1;
  visibility: hidden;
}
.one-mascot__materials-name > .is-current {
  visibility: visible;
}
.one-mascot__swatch {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1.5px solid transparent;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.one-mascot__swatch:hover {
  transform: scale(1.08);
}
.one-mascot__swatch[aria-pressed="true"] {
  border-color: #20e848;
}
.one-mascot__swatch span {
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.22);
}
.one-mascot__swatch.is-black span {
  background: radial-gradient(circle at 32% 28%, #6b6b6b 0, #151515 38%, #000 100%);
}
.one-mascot__swatch.is-chrome span {
  background: linear-gradient(135deg, #fff 0%, #8f8f8f 42%, #f5f5f5 58%, #616161 100%);
}
.one-mascot__swatch.is-glass span {
  background: radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.85) 0, rgb(191 255 207 / 0.32) 42%, rgb(255 255 255 / 0.08) 100%);
}
.one-mascot__swatch.is-green span {
  background: radial-gradient(circle at 32% 28%, #8dff9c 0, #20e848 40%, #03cb00 100%);
}

/* ---- dialog ---- */
.one-mascot__dialog {
  display: flex;
  flex-direction: column;
  gap: clamp(1.25rem, 2vw, 1.75rem);
  min-width: 0;
}
.one-mascot__bubble {
  position: relative;
  padding: clamp(1.5rem, 2.6vw, 2.5rem);
  border: 1px solid #2a2a2a;
  border-radius: 2rem;
  background: #0d0d0d;
}
/* Tail pointing at the character. */
.one-mascot__bubble::before {
  content: "";
  position: absolute;
  top: 50%;
  left: -0.6875rem;
  width: 1.25rem;
  height: 1.25rem;
  border-left: 1px solid #2a2a2a;
  border-bottom: 1px solid #2a2a2a;
  background: #0d0d0d;
  transform: translateY(-50%) rotate(45deg);
}
.one-mascot__hello {
  margin: 0 0 0.75rem;
  color: #20e848;
  font-family: var(--app-font-sans);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.one-mascot__question {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(2rem, 1.1rem + 2.6vw, 3.75rem);
  font-weight: 600;
  line-height: 1.04;
  letter-spacing: -0.03em;
}
.one-mascot__type {
  position: relative;
  display: block;
}
.one-mascot__ghost {
  visibility: hidden;
}
.one-mascot__typed {
  position: absolute;
  inset: 0;
}
.one-mascot__caret {
  display: inline-block;
  width: 0.06em;
  height: 0.85em;
  margin-left: 0.06em;
  vertical-align: -0.05em;
  background: #20e848;
  animation: one-mascot-caret 0.9s steps(1) infinite;
}
.one-mascot__caret.is-done {
  animation: one-mascot-caret 0.9s steps(1) 3 forwards;
}
@keyframes one-mascot-caret {
  50% { opacity: 0; }
  100% { opacity: 0; }
}
.one-mascot__hint {
  min-height: 3em;
  margin: 1rem 0 0;
  color: rgb(255 255 255 / 0.62);
  font-family: var(--app-font-sans);
  font-size: clamp(1rem, 0.92rem + 0.3vw, 1.1875rem);
  line-height: 1.45;
}
.one-mascot-hint-enter-active,
.one-mascot-hint-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.one-mascot-hint-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.one-mascot-hint-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.one-mascot__nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}
.one-mascot__choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.one-mascot__choice,
.one-mascot__telegram {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 3.25rem;
  padding: 0 1.375rem;
  border-radius: 999px;
  font-family: var(--app-font-sans);
  font-size: 1.0625rem;
  font-weight: 500;
  text-decoration: none;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.one-mascot__choice {
  border: 1px solid rgb(255 255 255 / 0.2);
  background: rgb(255 255 255 / 0.03);
  color: #fff;
}
.one-mascot__choice:hover,
.one-mascot__choice.is-active {
  border-color: #20e848;
  background: rgb(32 232 72 / 0.1);
}
.one-mascot__arrow {
  width: 1.125rem;
  height: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.5;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.one-mascot__choice:hover .one-mascot__arrow,
.one-mascot__choice.is-active .one-mascot__arrow {
  color: #20e848;
  opacity: 1;
  transform: translateX(3px);
}
.one-mascot__telegram {
  border: 1px solid #03cb00;
  background: #03cb00;
  color: #000;
  font-weight: 600;
}
.one-mascot__telegram:hover,
.one-mascot__telegram.is-active {
  border-color: #20e848;
  background: #20e848;
}
.one-mascot__telegram svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: currentColor;
}
.one-mascot__choice:focus-visible,
.one-mascot__telegram:focus-visible,
.one-mascot__swatch:focus-visible {
  outline: 2px solid #20e848;
  outline-offset: 3px;
}

@media (max-width: 767px) {
  .one-mascot__inner {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }
  .one-mascot__art {
    height: 17.5rem;
  }
  .one-mascot__materials-label {
    display: none;
  }
  .one-mascot__bubble {
    border-radius: 1.5rem;
  }
  /* Stacked: the tail points up at the character. */
  .one-mascot__bubble::before {
    top: -0.6875rem;
    left: 50%;
    border-bottom: 0;
    border-top: 1px solid #2a2a2a;
    transform: translateX(-50%) rotate(45deg);
  }
  .one-mascot__question {
    font-size: 2.125rem;
  }
  .one-mascot__choice,
  .one-mascot__telegram {
    min-height: 3rem;
    padding: 0 1.125rem;
    font-size: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .one-mascot__fb-body,
  .one-mascot__fb-eye rect,
  .one-mascot__caret {
    animation: none;
  }
  .one-mascot__fb-eyes,
  .one-mascot__fb-eye,
  .one-mascot__canvas,
  .one-mascot__art::before,
  .one-mascot__choice,
  .one-mascot__telegram,
  .one-mascot__arrow,
  .one-mascot__swatch,
  .one-mascot-hint-enter-active,
  .one-mascot-hint-leave-active {
    transition: none;
  }
  .one-mascot__caret {
    display: none;
  }
}
</style>
