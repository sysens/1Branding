<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

/**
 * The lightning around the selected price card, drawn on a canvas, after the
 * look of huly.io/pricing's plan cards (there a pre-rendered video; this is our
 * own drawing): a soft, smoky band of light a little outside the card's edge,
 * a white-hot line along it, and thin filaments wound round it, white where
 * they bunch and in the card's colour around that. The light is not even: two hot stretches run round the card
 * (one lap in about 2.6s and 3.4s), the filaments burning bright there and
 * fading to a faint line between them, while their wiggles flow along the
 * frame. Short bolts break off and sparks drift away where it burns. The glow
 * comes from CSS filters on the canvas. Colours are "r g b" triples: the
 * line's colour, its pale core and the sparks'.
 */
const props = defineProps<{ tone: string; core: string; spark: string; sparks?: number }>();

const canvas = ref<HTMLCanvasElement | null>(null);
// The canvas reaches this far past the card on every side (CSS px), the line
// runs this far outside the card's edge.
const MARGIN = 48;
const GAP = 13;

type Octave = { n: number; amp: number; period: number; drift: number; sharp: boolean; a: Float32Array; b: Float32Array; t0: number };
type Bolt = { points: Array<[number, number]>; born: number; life: number; light: number };
type Spark = { x: number; y: number; vx: number; vy: number; born: number; life: number; size: number; light: number };

const random = (n: number) => { const values = new Float32Array(n); for (let i = 0; i < n; i++) values[i] = Math.random() * 2 - 1; return values; };
// A sharp octave joins its points with straight lines: the zigzag kinks of
// lightning; a smooth one bends.
const octave = (n: number, amp: number, period: number, drift: number, sharp = false): Octave => {
  const size = Math.max(3, Math.round(n));
  return { n: size, amp, period, drift, sharp, a: random(size), b: random(size), t0: 0 };
};

// Smooth noise that wraps round the perimeter (u in 0..1), drifts along it and
// slowly turns into new noise.
const sample = (o: Octave, u: number, now: number) => {
  if (now - o.t0 >= o.period) { o.a = o.b; o.b = random(o.n); o.t0 = now; }
  const pos = ((u + o.drift * now) % 1 + 1) % 1 * o.n;
  const i = Math.floor(pos);
  const f = pos - i;
  const s = o.sharp ? f : f * f * (3 - 2 * f);
  const j = (i + 1) % o.n;
  const va = o.a[i]! + (o.a[j]! - o.a[i]!) * s;
  const vb = o.b[i]! + (o.b[j]! - o.b[i]!) * s;
  const k = Math.min(1, (now - o.t0) / o.period);
  const ks = k * k * (3 - 2 * k);
  return (va + (vb - va) * ks) * o.amp;
};

// The two hot stretches, as angles round the card's centre (radians, turning
// clockwise on screen), and how bright the frame is at an angle: a faint
// line everywhere, full where a stretch passes.
const LAPS = [2.6, 3.4];
const SPREAD = 0.95;
const FLOOR = 0.1;
const angleGap = (a: number, b: number) => { const d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); };
const heat = (angle: number, now: number) => {
  let value = FLOOR;
  LAPS.forEach((lap, index) => {
    const at = (now / lap) * 2 * Math.PI + index * Math.PI;
    value += Math.exp(-((angleGap(angle, at) / SPREAD) ** 2)) * (index ? 0.85 : 1);
  });
  return Math.min(1, value);
};

let frame = 0;
let running = false;
let observer: IntersectionObserver | null = null;
let resize: ResizeObserver | null = null;
let draw: ((now: number) => void) | null = null;

const loop = (time: number) => {
  frame = 0;
  if (!running || !draw) return;
  draw(time / 1000);
  frame = requestAnimationFrame(loop);
};
const start = () => { if (running) return; running = true; frame = requestAnimationFrame(loop); };
const stop = () => { running = false; if (frame) cancelAnimationFrame(frame); frame = 0; };
const onVisibility = () => { if (document.hidden) stop(); else if (observer) start(); };

onMounted(() => {
  const el = canvas.value;
  const card = el?.parentElement;
  const ctx = el?.getContext("2d");
  if (!el || !card || !ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let radius = 24;
  let perimeter = 0;
  let filaments: Array<{ octaves: Octave[]; shift: number }> = [];
  const bolts: Bolt[] = [];
  const sparks: Spark[] = [];
  let lastSpawn = 0;
  let previous = 0;
  // The white-hot core's own layer.
  const hot = document.createElement("canvas");
  const hotCtx = hot.getContext("2d")!;

  const centre = () => [MARGIN + width / 2, MARGIN + height / 2] as const;
  const angleAt = (x: number, y: number) => { const [cx, cy] = centre(); return Math.atan2(y - cy, x - cx); };

  // A point of the rounded rectangle the line follows, with its outward normal.
  const point = (u: number): [number, number, number, number] => {
    const x0 = MARGIN - GAP;
    const y0 = MARGIN - GAP;
    const w = width + 2 * GAP;
    const h = height + 2 * GAP;
    const r = radius + GAP;
    const sides = [w - 2 * r, (Math.PI / 2) * r, h - 2 * r, (Math.PI / 2) * r, w - 2 * r, (Math.PI / 2) * r, h - 2 * r, (Math.PI / 2) * r];
    let d = (((u % 1) + 1) % 1) * perimeter;
    let side = 0;
    while (side < 7 && d > sides[side]!) { d -= sides[side]!; side++; }
    const corner = (cx: number, cy: number, from: number) => {
      const angle = from + d / r;
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, Math.cos(angle), Math.sin(angle)] as [number, number, number, number];
    };
    switch (side) {
      case 0: return [x0 + r + d, y0, 0, -1];
      case 1: return corner(x0 + w - r, y0 + r, -Math.PI / 2);
      case 2: return [x0 + w, y0 + r + d, 1, 0];
      case 3: return corner(x0 + w - r, y0 + h - r, 0);
      case 4: return [x0 + w - r - d, y0 + h, 0, 1];
      case 5: return corner(x0 + r, y0 + h - r, Math.PI / 2);
      case 6: return [x0, y0 + h - r - d, -1, 0];
      default: return corner(x0 + r, y0 + r, Math.PI);
    }
  };

  const setup = () => {
    width = card.offsetWidth;
    height = card.offsetHeight;
    radius = Number.parseFloat(getComputedStyle(card).borderTopLeftRadius) || 24;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = Math.round((width + 2 * MARGIN) * dpr);
    el.height = Math.round((height + 2 * MARGIN) * dpr);
    const w = width + 2 * GAP;
    const h = height + 2 * GAP;
    const r = radius + GAP;
    perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
    // Five filaments: the middle one keeps close to the frame, the outer ones
    // wander further. Each bends slowly, kinks and crackles, the wiggles
    // flowing round the card with the light.
    filaments = [0, 2.5, -2.5, 4.5, -4.5].map((shift, index) => {
      const loose = 1 + Math.abs(shift) * 0.2;
      return {
        shift,
        octaves: [
          octave(perimeter / 170, 3.4 * loose, 1.3 + index * 0.17, 0.03 + index * 0.006),
          octave(perimeter / 30, 3.2 * loose, 0.34 + index * 0.05, 0.08, true),
          octave(perimeter / 13, 1.4 * loose, 0.14 + index * 0.02, 0.12, true),
        ],
      };
    });
    hot.width = el.width;
    hot.height = el.height;
  };

  // Where it burns the filaments fly apart and go wild; between the hot
  // stretches they draw together into a quiet line.
  const path = (octaves: Octave[], shift: number, now: number) => {
    const steps = Math.ceil(perimeter / 3);
    const points: Array<[number, number]> = [];
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const [x, y, nx, ny] = point(u);
      const wild = 0.35 + 0.95 * heat(angleAt(x, y), now);
      let push = shift * wild;
      for (const o of octaves) push += sample(o, u, now) * wild;
      points.push([x + nx * push, y + ny * push]);
    }
    return points;
  };

  // The light along the frame as a conic gradient round the card's centre,
  // sharpened by a power (the white-hot core only where it burns most).
  const lightMask = (target: CanvasRenderingContext2D, now: number, power: number) => {
    const [cx, cy] = centre();
    const gradient = target.createConicGradient(0, cx, cy);
    for (let step = 0; step <= 72; step++) {
      const angle = (step / 72) * 2 * Math.PI;
      gradient.addColorStop(step / 72, `rgb(0 0 0 / ${(heat(angle, now) ** power).toFixed(3)})`);
    }
    target.globalCompositeOperation = "destination-in";
    target.fillStyle = gradient;
    target.fillRect(0, 0, width + 2 * MARGIN, height + 2 * MARGIN);
  };

  const stroke = (points: Array<[number, number]>, lineWidth: number, color: string, target = ctx, blur = 0) => {
    target.beginPath();
    points.forEach(([x, y], i) => (i ? target.lineTo(x, y) : target.moveTo(x, y)));
    target.lineWidth = lineWidth;
    target.strokeStyle = color;
    // A blurred stroke is light, not a line: its shadow, in its colour.
    target.shadowBlur = blur * dpr;
    target.shadowColor = blur ? color : "transparent";
    target.stroke();
    target.shadowBlur = 0;
  };

  const spawn = (now: number) => {
    const dt = Math.min(0.1, now - lastSpawn);
    lastSpawn = now;
    // Bolts break off where the frame burns, mostly outwards.
    for (let tries = 0; tries < 2; tries++) {
      if (Math.random() >= dt * 18) continue;
      const [x, y, nx, ny] = point(Math.random());
      const light = heat(angleAt(x, y), now);
      if (light < 0.45 || Math.random() > light) continue;
      const outward = Math.random() < 0.75 ? 1 : -0.5;
      let angle = Math.atan2(ny, nx) + (Math.random() - 0.5) * 1.3;
      const points: Array<[number, number]> = [[x, y]];
      let px = x;
      let py = y;
      const segments = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < segments; i++) {
        angle += (Math.random() - 0.5) * 1.2;
        const length = 3 + Math.random() * 7;
        px += Math.cos(angle) * length * outward;
        py += Math.sin(angle) * length * outward;
        points.push([px, py]);
      }
      bolts.push({ points, born: now, life: 0.08 + Math.random() * 0.12, light });
    }
    // Sparks drift off the burning stretches.
    let count = dt * (props.sparks ?? 6);
    while (count > 0) {
      if (Math.random() < count) {
        const [x, y, nx, ny] = point(Math.random());
        const light = heat(angleAt(x, y), now);
        if (light > 0.5) {
          const speed = 10 + Math.random() * 26;
          sparks.push({ x, y, vx: nx * speed + (Math.random() - 0.5) * 12, vy: ny * speed + (Math.random() - 0.5) * 12, born: now, life: 0.5 + Math.random() * 0.8, size: 0.7 + Math.random() * 1.1, light });
        }
      }
      count -= 1;
    }
    for (const list of [bolts, sparks] as Array<Array<{ born: number; life: number }>>) {
      for (let i = list.length - 1; i >= 0; i--) if (now - list[i]!.born > list[i]!.life) list.splice(i, 1);
    }
  };

  draw = (now: number) => {
    if (!width) return;
    const dt = previous ? Math.min(0.05, now - previous) : 0;
    previous = now;
    spawn(now);
    const fullWidth = width + 2 * MARGIN;
    const fullHeight = height + 2 * MARGIN;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, fullWidth, fullHeight);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // The band: the main filament's slow bends only, drawn as soft light
    // (wide blurred strokes) - the smoke the filaments burn in.
    ctx.globalCompositeOperation = "lighter";
    const band = path(filaments[0]!.octaves.slice(0, 1), 0, now);
    stroke(band, 12, `rgb(${props.tone} / 0.22)`, ctx, 16);
    stroke(band, 6, `rgb(${props.tone} / 0.35)`, ctx, 8);
    stroke(band, 2.4, `rgb(${props.core} / 0.55)`, ctx, 4);
    // The filaments over it, thin: in the colour, then the pale core. Then the
    // light: kept where the hot stretches are, faded between them.
    filaments.forEach(({ octaves, shift }, index) => {
      const points = path(octaves, shift, now);
      stroke(points, index === 0 ? 1.8 : 1.1, `rgb(${props.tone} / ${index === 0 ? 0.6 : 0.42})`);
      stroke(points, index === 0 ? 0.9 : 0.55, `rgb(${props.core} / ${index === 0 ? 0.85 : 0.6})`);
    });
    lightMask(ctx, now, 1);

    // The white-hot core on its own layer, only where it burns most.
    hotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hotCtx.globalCompositeOperation = "source-over";
    hotCtx.clearRect(0, 0, fullWidth, fullHeight);
    hotCtx.lineJoin = "round";
    hotCtx.lineCap = "round";
    stroke(band, 9, `rgb(${props.tone} / 0.5)`, hotCtx, 10);
    stroke(band, 2.6, `rgb(${props.core})`, hotCtx, 3);
    lightMask(hotCtx, now, 3);
    ctx.globalCompositeOperation = "lighter";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(hot, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Bolts and sparks, over it.
    ctx.globalCompositeOperation = "lighter";
    for (const bolt of bolts) {
      const fade = (1 - (now - bolt.born) / bolt.life) * bolt.light;
      stroke(bolt.points, 1.8, `rgb(${props.tone} / ${0.7 * fade})`);
      stroke(bolt.points, 0.8, `rgb(${props.core} / ${0.9 * fade})`);
    }
    for (const spark of sparks) {
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy -= 10 * dt;
      const fade = (1 - (now - spark.born) / spark.life) * spark.light;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${props.spark} / ${fade})`;
      ctx.fill();
    }
  };

  setup();
  resize = new ResizeObserver(() => { setup(); if (!running) draw?.(performance.now() / 1000); });
  resize.observe(card);

  // Visitors who ask for less motion see one still frame.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    draw(performance.now() / 1000);
    return;
  }
  // Only while it is on screen and the tab is in front.
  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting && !document.hidden) start();
    else stop();
  });
  observer.observe(el);
  document.addEventListener("visibilitychange", onVisibility);
});

onBeforeUnmount(() => {
  stop();
  observer?.disconnect();
  resize?.disconnect();
  observer = null;
  draw = null;
  document.removeEventListener("visibilitychange", onVisibility);
});
</script>

<template>
  <canvas ref="canvas" class="lightning" aria-hidden="true" />
</template>

<style scoped>
/* Behind the card, past its border edge by the canvas margin (MARGIN above;
   the 1px more is the card's border, which the inset counts from). The
   glow: a tight bright one, a soft one and a wide haze in the line's colour. */
.lightning {
  position: absolute;
  inset: -49px;
  z-index: -1;
  width: calc(100% + 98px);
  height: calc(100% + 98px);
  filter: drop-shadow(0 0 0.2rem rgb(v-bind("props.tone"))) drop-shadow(0 0 0.9rem rgb(v-bind("props.tone") / 0.8)) drop-shadow(0 0 2.2rem rgb(v-bind("props.tone") / 0.5));
  pointer-events: none;
  animation: lightning-in 0.35s ease-out both;
}

@keyframes lightning-in {
  from { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .lightning {
    animation: none;
  }
}
</style>
