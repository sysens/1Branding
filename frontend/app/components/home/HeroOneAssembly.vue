<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { optEntry, optUrl } from "~/utils/optImage";

// PROTOTYPE "2500 → ONE": client logos leave the hero's logo wall and assemble
// into one big "ONE" mark in front of it. Holding the pointer on the hero
// scatters the mark into a cloud of large, readable logos; releasing it puts
// the mark back together. Scrolling away flies the tiles towards the camera.
// One InstancedMesh (one draw call); the logos come from a runtime atlas of the
// same thumbnails the CSS wall uses. Emits "ready" once the first frame is
// drawn so the page can dim the wall behind it. Without WebGL nothing is
// emitted and the classic hero stays as it is.
const emit = defineEmits<{ ready: [] }>();

const LOGOS = [
  "apexpizza", "artAnor", "asakabank", "barberra", "brono", "burger", "chizzago", "clop", "cybernat",
  "daniel", "Deco", "delicco", "dodokids", "FmFood", "GlossMaxx", "grechno", "GreenGo", "hayaati",
  "kebabHouse", "Korean", "Luqmam", "luxion", "Makva", "marinno", "merhaba", "milka", "nescafe", "OMAF",
  "perfectCandy", "perfectCandy2", "Poyqadam", "Rafting", "Raviosta", "RedBull", "silvera", "streetvibe",
  "st77", "texnikach", "websiteONEBRANDING", "wok", "yana",
].map((name) => `/logoss/thumbs/${name}.webp`);

const HINTS: Record<string, string> = {
  en: "Hold — 2500+ brands",
  ru: "Зажмите — 2500+ брендов",
  uz: "Bosib turing — 2500+ brend",
};
const { locale } = useI18n();
const hint = HINTS[locale.value] ?? HINTS.en;

const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const showHint = ref(false);
// A soft dark pool behind the assembled mark keeps it readable over the wall.
const formed = ref(false);

// Atlas: 8 x 6 cells of 256 x 128 (the thumbnails are 2:1).
const ATLAS_COLS = 8;
const ATLAS_ROWS = 6;
const CELL_W = 256;
const CELL_H = 128;

const vertexShader = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aTarget;
  attribute vec3 aScatter;
  attribute vec2 aCell;
  attribute float aDelay;
  attribute float aSeed;
  uniform float uAssemble;
  uniform float uScatter;
  uniform float uScroll;
  uniform float uTime;
  uniform float uWave;
  uniform vec2 uStartSize;
  uniform vec2 uOneSize;
  uniform float uScatterScale;
  varying vec2 vUv;
  varying vec2 vCell;
  varying float vLight;
  varying float vEdge;

  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  void main() {
    // Each tile starts its flight a little later than the one to its left.
    float t = easeInOutCubic(clamp((uAssemble - aDelay * 0.55) / 0.45, 0.0, 1.0));
    float s = uScatter;

    vec3 one = aTarget;
    one.z += sin(uTime * 1.3 + aTarget.x * 0.9 + aTarget.y * 0.6) * 0.06 * uWave;
    vec3 p = mix(aStart, one, t);
    // Arc towards the viewer during the flight.
    p.z += sin(t * 3.14159) * (1.2 + aSeed * 1.6);
    p = mix(p, aScatter, s);

    // Scroll: the mark breaks towards the camera like a tunnel.
    p.z += uScroll * (5.0 + aSeed * 9.0);
    p.xy *= 1.0 + uScroll * 0.35;

    vec2 size = mix(uStartSize, uOneSize, t) * mix(1.0, uScatterScale, s);
    float spin = (1.0 - t) * (aSeed - 0.5) * 1.6 + s * (aSeed - 0.5) * 0.9;
    vec2 corner = rot(spin) * (position.xy * size);

    vec4 mv = modelViewMatrix * vec4(p + vec3(corner, 0.0), 1.0);
    gl_Position = projectionMatrix * mv;

    vUv = uv;
    vCell = aCell;
    // Tiles still in the wall are as dim as the wall; assembled ones are lit.
    vLight = mix(0.42, 1.0, max(t, s)) * (1.0 - uScroll * 0.85);
    vEdge = t * (1.0 - s);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform vec2 uCellSize;
  uniform vec3 uGreen;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec2 vCell;
  varying float vLight;
  varying float vEdge;

  float roundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    // Rounded tile corners (2:1 tile, so the radius is scaled on x).
    vec2 p = (vUv - 0.5) * vec2(2.0, 1.0);
    float d = roundBox(p, vec2(1.0, 0.5), 0.12);
    if (d > 0.0) discard;
    vec3 color = texture2D(uAtlas, vCell + vUv * uCellSize).rgb * vLight;
    // Thin brand-green rim once the tile has joined the mark.
    float rim = smoothstep(-0.07, -0.015, d);
    color = mix(color, uGreen, rim * vEdge * 0.85);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

let cleanup: (() => void) | undefined;
let disposed = false;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

// The 200px-wide WebP copy from the build manifest when it exists.
const thumbUrl = (src: string) => {
  const entry = optEntry(src);
  if (!entry) return src;
  const width = entry.widths.find((w) => w >= 200) ?? entry.widths[entry.widths.length - 1]!;
  return optUrl(src, entry, width, "webp");
};

const buildAtlas = async () => {
  const atlas = document.createElement("canvas");
  atlas.width = ATLAS_COLS * CELL_W;
  atlas.height = ATLAS_ROWS * CELL_H;
  const ctx = atlas.getContext("2d");
  if (!ctx) return null;
  const images = await Promise.all(LOGOS.map((src) => loadImage(thumbUrl(src))));
  images.forEach((image, i) => {
    const x = (i % ATLAS_COLS) * CELL_W;
    const y = Math.floor(i / ATLAS_COLS) * CELL_H;
    if (image) ctx.drawImage(image, x, y, CELL_W, CELL_H);
    else {
      ctx.fillStyle = "#0b2a0b";
      ctx.fillRect(x, y, CELL_W, CELL_H);
    }
  });
  return { atlas, count: images.length };
};

// Cells of a tile grid (2:1 tiles) that fall inside the word "ONE".
const sampleWord = async (columns: number) => {
  try {
    await document.fonts.load('700 300px "SF Pro Display"');
  } catch {
    // The fallback stack still draws a bold sans.
  }
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 420;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 330px "SF Pro Display", "SF Pro Text", "Segoe UI", Arial, sans-serif';
  ctx.fillText("ONE", c.width / 2, c.height / 2 + 12);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);

  // Tight bounds of the drawn word.
  let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
  for (let y = 0; y < c.height; y += 2) {
    for (let x = 0; x < c.width; x += 2) {
      if (data[(y * c.width + x) * 4 + 3]! > 128) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  const cellW = (maxX - minX) / columns;
  const cellH = cellW / 2;
  const rows = Math.ceil((maxY - minY) / cellH);
  const points: { u: number; v: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = Math.round(minX + (col + 0.5) * cellW);
      const y = Math.round(minY + (row + 0.5) * cellH);
      if (data[(y * c.width + x) * 4 + 3]! > 128) points.push({ u: col / columns, v: row / rows });
    }
  }
  return points.map((p) => ({ x: p.u, y: p.v, aspect: (maxY - minY) / (maxX - minX) }));
};

const seeded = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};

onMounted(async () => {
  const host = root.value;
  const el = canvas.value;
  if (!host || !el) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const probe = document.createElement("canvas").getContext("webgl2");
  if (!probe) return;

  const THREE = await import("three");
  const atlasResult = await buildAtlas();
  if (disposed || !atlasResult) return;

  const mobile = window.innerWidth < 768;
  const word = await sampleWord(mobile ? 20 : 30);
  if (disposed || !word.length) return;

  const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  const texture = new THREE.CanvasTexture(atlasResult.atlas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.generateMipmaps = true;

  // Visible size of the z = 0 plane.
  const viewHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let viewWidth = viewHeight;

  const count = word.length;
  const geometry = new THREE.InstancedBufferGeometry();
  const plane = new THREE.PlaneGeometry(1, 1);
  geometry.index = plane.index;
  geometry.setAttribute("position", plane.getAttribute("position"));
  geometry.setAttribute("uv", plane.getAttribute("uv"));
  geometry.instanceCount = count;

  const aStart = new Float32Array(count * 3);
  const aTarget = new Float32Array(count * 3);
  const aScatter = new Float32Array(count * 3);
  const aCell = new Float32Array(count * 2);
  const aDelay = new Float32Array(count);
  const aSeed = new Float32Array(count);
  geometry.setAttribute("aStart", new THREE.InstancedBufferAttribute(aStart, 3));
  geometry.setAttribute("aTarget", new THREE.InstancedBufferAttribute(aTarget, 3));
  geometry.setAttribute("aScatter", new THREE.InstancedBufferAttribute(aScatter, 3));
  geometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(aCell, 2));
  geometry.setAttribute("aDelay", new THREE.InstancedBufferAttribute(aDelay, 1));
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 1));

  const uniforms = {
    uAtlas: { value: texture },
    uCellSize: { value: new THREE.Vector2(1 / ATLAS_COLS, 1 / ATLAS_ROWS) },
    uGreen: { value: new THREE.Color("#20e848") },
    uAssemble: { value: reducedMotion ? 1 : 0 },
    uScatter: { value: 0 },
    uScroll: { value: 0 },
    uTime: { value: 0 },
    uWave: { value: reducedMotion ? 0 : 1 },
    uStartSize: { value: new THREE.Vector2(1.6, 0.8) },
    uOneSize: { value: new THREE.Vector2(0.3, 0.15) },
    uScatterScale: { value: 4.2 },
    uOpacity: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const group = new THREE.Group();
  group.add(mesh);
  scene.add(group);

  // Lays the tiles out for the current aspect: the mark sits in the upper half
  // of the hero, above the headline, and keeps its width inside the screen.
  const layout = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    viewWidth = viewHeight * camera.aspect;

    const markWidth = Math.min(viewWidth * (mobile ? 0.9 : 0.62), 11);
    const columns = mobile ? 20 : 30;
    const tileW = (markWidth / columns) * 0.94;
    uniforms.uOneSize.value.set(tileW, tileW / 2);
    uniforms.uStartSize.value.set(Math.min(viewWidth / 6, 2.4), Math.min(viewWidth / 6, 2.4) / 2);
    const markHeight = markWidth * word[0]!.aspect;
    const centerY = viewHeight * (mobile ? 0.16 : 0.13);
    // Screen position of the mark (fraction of the hero height) for the backdrop and the hint.
    host.style.setProperty("--one-center", `${(0.5 - centerY / viewHeight) * 100}%`);
    host.style.setProperty("--one-bottom", `${(0.5 - (centerY - markHeight / 2) / viewHeight) * 100}%`);
    host.style.setProperty("--one-width", `${(markWidth / viewWidth) * 100}%`);

    const random = seeded(2500);
    for (let i = 0; i < count; i++) {
      const w = word[i]!;
      aTarget[i * 3] = (w.x - 0.5) * markWidth + tileW / 2;
      aTarget[i * 3 + 1] = centerY + (0.5 - w.y) * markHeight;
      aTarget[i * 3 + 2] = (random() - 0.5) * 0.25;

      // Start: a tile of the tilted wall behind the mark.
      aStart[i * 3] = (random() - 0.5) * viewWidth * 1.5;
      aStart[i * 3 + 1] = (random() - 0.5) * viewHeight * 1.4;
      aStart[i * 3 + 2] = -6;

      // Scatter: a loose shell around the mark, mostly in front of it.
      const theta = random() * Math.PI * 2;
      const radius = (0.35 + random() * 0.75) * viewWidth * 0.55;
      aScatter[i * 3] = Math.cos(theta) * radius;
      aScatter[i * 3 + 1] = centerY * 0.4 + Math.sin(theta) * radius * 0.55;
      aScatter[i * 3 + 2] = -4 + random() * 8;

      const cell = Math.floor(random() * atlasResult.count);
      aCell[i * 2] = (cell % ATLAS_COLS) / ATLAS_COLS;
      // The atlas canvas has its origin top-left; textures sample from bottom-left.
      aCell[i * 2 + 1] = 1 - (Math.floor(cell / ATLAS_COLS) + 1) / ATLAS_ROWS;
      aDelay[i] = w.x * 0.7 + random() * 0.3;
      aSeed[i] = random();
    }
    for (const name of ["aStart", "aTarget", "aScatter", "aCell", "aDelay", "aSeed"]) {
      (geometry.getAttribute(name) as InstanceType<typeof THREE.InstancedBufferAttribute>).needsUpdate = true;
    }
  };
  layout();

  // Hold to scatter: pointer on the hero (not on its links or buttons).
  const hero = host.closest<HTMLElement>(".home-hero-surface") ?? host.parentElement ?? host;
  let holding = false;
  // A short delay keeps a touch that starts a scroll (pointercancel) from twitching the mark.
  let holdTimer: number | undefined;
  const onDown = (event: PointerEvent) => {
    if (reducedMotion || event.button > 0) return;
    if ((event.target as HTMLElement | null)?.closest("a, button, input, select, textarea, [role='button']")) return;
    window.clearTimeout(holdTimer);
    holdTimer = window.setTimeout(() => {
      holding = true;
      showHint.value = false;
    }, 150);
  };
  const onUp = () => {
    window.clearTimeout(holdTimer);
    holding = false;
  };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (event: PointerEvent) => {
    pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
  };
  hero.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  window.addEventListener("pointermove", onMove, { passive: true });

  // Draw only while the hero is on screen and the tab is visible.
  let visible = true;
  const observer = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? true; }, { rootMargin: "100px 0px" });
  observer.observe(host);
  // With reduced motion there is no loop, so a resize redraws the still frame.
  const resizeObserver = new ResizeObserver(() => {
    layout();
    if (reducedMotion) renderer.render(scene, camera);
  });
  resizeObserver.observe(host);

  const clock = new THREE.Clock();
  let assembleStart = -1;
  let scatterVelocity = 0;
  let frame = 0;
  let readySent = false;

  const render = () => {
    frame = requestAnimationFrame(render);
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    uniforms.uTime.value = time;

    if (!reducedMotion) {
      if (assembleStart < 0) assembleStart = time + 0.35;
      uniforms.uAssemble.value = Math.min(1, Math.max(0, (time - assembleStart) / 2.6));
      if (uniforms.uAssemble.value >= 1 && !showHint.value && assembleStart > 0 && time - assembleStart < 4) showHint.value = true;

      // Critically damped spring towards the hold state.
      const target = holding ? 1 : 0;
      const stiffness = holding ? 40 : 26;
      const accel = stiffness * (target - uniforms.uScatter.value) - 2 * Math.sqrt(stiffness) * scatterVelocity;
      scatterVelocity += accel * dt;
      uniforms.uScatter.value += scatterVelocity * dt;
      formed.value = uniforms.uAssemble.value > 0.7 && uniforms.uScatter.value < 0.3;

      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      group.rotation.y = pointer.x * 0.16;
      group.rotation.x = pointer.y * 0.08;

      uniforms.uScroll.value = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
    }

    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      if (reducedMotion) formed.value = true;
      emit("ready");
    }
    if (reducedMotion) cancelAnimationFrame(frame);
  };
  render();

  cleanup = () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(holdTimer);
    observer.disconnect();
    resizeObserver.disconnect();
    hero.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    window.removeEventListener("pointermove", onMove);
    geometry.dispose();
    plane.dispose();
    material.dispose();
    texture.dispose();
    renderer.dispose();
  };
});

onBeforeUnmount(() => {
  disposed = true;
  cleanup?.();
});
</script>

<template>
  <div ref="root" class="hero-one" aria-hidden="true">
    <div class="hero-one__backdrop" :class="{ 'is-visible': formed }" />
    <canvas ref="canvas" class="hero-one__canvas" />
    <p class="hero-one__hint" :class="{ 'is-visible': showHint }">{{ hint }}</p>
  </div>
</template>

<style scoped>
.hero-one {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.hero-one__canvas {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}
.hero-one__backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse calc(var(--one-width, 60%) * 0.75) 30% at 50% var(--one-center, 37%),
    rgb(0 0 0 / 0.82) 0%,
    rgb(0 0 0 / 0.55) 45%,
    rgb(0 0 0 / 0) 100%
  );
  opacity: 0;
  transition: opacity 0.9s ease;
}
.hero-one__backdrop.is-visible {
  opacity: 1;
}
.hero-one__hint {
  position: absolute;
  left: 50%;
  top: calc(var(--one-bottom, 55%) + 1.25rem);
  transform: translate(-50%, 8px);
  padding: 0.45rem 0.9rem;
  border: 1px solid rgb(32 232 72 / 0.45);
  border-radius: 999px;
  background: rgb(0 0 0 / 0.55);
  color: #20e848;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.hero-one__hint.is-visible {
  opacity: 1;
  transform: translate(-50%, 0);
}
</style>
