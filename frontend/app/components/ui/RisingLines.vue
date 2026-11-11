<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

/**
 * Lines of light rising from a glowing horizon, drawn on a canvas that fills
 * its positioned parent. Pointer events are listened for on that parent, so
 * the effect can sit behind the parent's text.
 *
 * This is the site's own drawing of the behaviour React Bits Pro documents for
 * its "Rising Lines" (pro.reactbits.dev/docs/components/rising-lines): the same
 * props with the same meaning and defaults, none of its code. Each line is a
 * white-hot head rising from the horizon, through the line colour, to a tail
 * that tapers into the tail colour; fine sparks rise with them; a bright
 * horizon line with a glow under them. With `interactive` the lines under the
 * pointer rise faster and denser (the updraft) and a click launches a volley
 * from the horizon. With `intro` the horizon opens from the centre and the
 * lines rise into view. Visitors who ask for less motion get a still frame;
 * the loop also stops while the canvas is off screen or the tab is hidden.
 */
const props = withDefaults(defineProps<{
  /** Tail and haze colour, then line colour. */
  colors?: [string, string];
  /** Fill behind the effect; "transparent" shows the page. */
  backgroundColor?: string;
  /** How many lines rise from the horizon. */
  density?: number;
  /** Speed of the lines and sparks. */
  speed?: number;
  /** Line width in CSS pixels. */
  lineWidth?: number;
  /** Length of the tapering tail behind each head. */
  lineLength?: number;
  /** Vertical position of the horizon: -0.65 is the bottom edge, higher values move it up. */
  horizonHeight?: number;
  /** Brightness of the horizon line and its glow. */
  horizonGlow?: number;
  /** Perspective: distant lines start above the horizon, thinner and dimmer. */
  depth?: number;
  /** Width of the visible field and of the horizon glow. */
  spread?: number;
  /** Strength of the hover updraft. */
  updraft?: number;
  /** Brightness of the fine rising sparks; 0 hides them. */
  particles?: number;
  interactive?: boolean;
  intro?: boolean;
  paused?: boolean;
  /** Largest device pixel ratio of the canvas. */
  dpr?: number;
}>(), {
  colors: () => ["#8B5CF6", "#FF9FFC"],
  backgroundColor: "transparent",
  density: 1,
  speed: 0.6,
  lineWidth: 1,
  lineLength: 1,
  horizonHeight: -0.45,
  horizonGlow: 1,
  depth: 0.5,
  spread: 1,
  updraft: 1,
  particles: 1,
  interactive: true,
  intro: true,
  paused: false,
  dpr: 2,
});

type Rgb = [number, number, number];
/** A rising line; `u` is its place across the field (-1..1), `z` its distance (0 near, 1 far). */
type Line = { u: number; z: number; reach: number; tail: number; bright: number; width: number; hot: number; life: number; t: number };
/** A short-lived line of a hover or a volley, at a pixel position. */
type Bonus = { x: number; reach: number; tail: number; bright: number; width: number; life: number; t: number };
type Spark = { u: number; rise: number; vy: number; drift: number; size: number; phase: number; life: number; t: number };

const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);

const WHITE: Rgb = [255, 255, 255];
const HORIZON_SLOPE = 0.563; // the horizon's place per unit of horizonHeight, from -0.65 at the bottom edge
const INTRO_SECONDS = 3.6;

const rand = (min = 0, max = 1) => min + Math.random() * (max - min);
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const triangle = () => Math.random() + Math.random() - 1;

const parseColor = (value: string, fallback: Rgb): Rgb => {
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim())?.[1];
  if (!hex) return fallback;
  const full = hex.length === 3 ? [...hex].map((digit) => digit + digit).join("") : hex;
  return [Number.parseInt(full.slice(0, 2), 16), Number.parseInt(full.slice(2, 4), 16), Number.parseInt(full.slice(4, 6), 16)];
};
const mixColor = (a: Rgb, b: Rgb, k: number): Rgb => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const rgba = (color: Rgb, alpha: number) => `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${clamp(alpha).toFixed(3)})`;

let frame = 0;
let running = false;
let visible = false;
let stop = () => {};
let launchVolley: (x?: number, strength?: number) => void = () => {};
let restartIntro: () => void = () => {};

onMounted(() => {
  const el = root.value;
  const cv = canvas.value;
  const ctx = cv?.getContext("2d");
  if (!el || !cv || !ctx) return;
  const host = el.parentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0;
  let H = 0;
  let dpr = 1;
  let horizonY = 0;
  let fieldHalf = 0;
  let tailColor = parseColor(props.colors[0], [139, 92, 246]);
  let lineColor = parseColor(props.colors[1], [255, 159, 252]);
  let introProgress = props.intro && !reduced ? 0 : 1;
  // The intro waits until the horizon is on screen, so that it is seen and not
  // over before the visitor has scrolled to it; `flared`: the horizon's flash
  // when its line has opened has been shown.
  let introArmed = introProgress >= 1;
  let flared = introProgress >= 1;
  let pulse = 0;
  let spawnDebt = 0;
  let previous = 0;
  const pointer = { x: 0, y: 0, inside: false };
  const lines: Line[] = [];
  const bonus: Bonus[] = [];
  const sparks: Spark[] = [];

  // A soft round light for the heads and the bigger sparks.
  const sprite = document.createElement("canvas");
  sprite.width = 64;
  sprite.height = 64;
  const drawSprite = () => {
    const sc = sprite.getContext("2d")!;
    sc.clearRect(0, 0, 64, 64);
    const gradient = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, rgba(WHITE, 1));
    gradient.addColorStop(0.18, rgba(mixColor(lineColor, WHITE, 0.4), 0.85));
    gradient.addColorStop(0.5, rgba(lineColor, 0.22));
    gradient.addColorStop(1, rgba(lineColor, 0));
    sc.fillStyle = gradient;
    sc.fillRect(0, 0, 64, 64);
  };

  const lifeSeconds = () => rand(7, 16) / (0.35 + props.speed * 2.2);
  // About half of the lines are young ones that rise only a little before they
  // fade: they crowd the horizon like a bright undergrowth, the tall ones rise
  // above them.
  const makeLine = (): Line => {
    const z = Math.random() ** 1.3;
    const short = Math.random() < 0.5;
    return {
      u: triangle(),
      z,
      reach: short ? rand(0.03, 0.2) : rand(0.28, 1) ** 0.8,
      tail: short ? rand(0.04, 0.12) : rand(0.08, 0.26),
      bright: short ? 0.35 + 0.65 * Math.random() ** 1.5 : 0.25 + 0.75 * Math.random() ** 2,
      width: rand(0.7, 1.4),
      hot: !short && Math.random() < 0.18 ? 1 : 0.5,
      life: short ? lifeSeconds() * 0.3 : lifeSeconds(),
      t: 0,
    };
  };
  const makeSpark = (): Spark => ({
    u: triangle(),
    rise: Math.random() ** 1.6,
    vy: rand(0.012, 0.04),
    drift: rand(-0.01, 0.01),
    size: rand(0.6, 1.7) * (Math.random() < 0.14 ? 2.4 : 1),
    phase: rand(0, Math.PI * 2),
    life: rand(5, 12),
    t: 0,
  });

  const populate = () => {
    const count = Math.max(0, Math.round(300 * props.density));
    lines.length = 0;
    for (let i = 0; i < count; i++) {
      const line = makeLine();
      line.t = Math.random() * line.life; // a steady state from the first frame
      lines.push(line);
    }
    sparks.length = 0;
    const sparkCount = Math.round(95 * clamp((W * H) / (1440 * 600), 0.4, 1.6));
    for (let i = 0; i < sparkCount; i++) {
      const spark = makeSpark();
      spark.t = Math.random() * spark.life;
      sparks.push(spark);
    }
  };

  // The lines wait a moment, nearer the middle first, then rise into view.
  restartIntro = () => {
    introProgress = 0;
    introArmed = false;
    flared = false;
    for (const line of lines) {
      line.t = -(0.5 + rand(0, 2.2) + Math.abs(line.u) * 0.9);
    }
    for (const spark of sparks) spark.t = -(0.8 + rand(0.4, 2.6));
    if (!running) frame = requestAnimationFrame(loop);
  };

  launchVolley = (x = 0.5, strength = 1) => {
    const count = Math.round(20 * clamp(strength, 0.2, 2));
    for (let i = 0; i < count; i++) {
      bonus.push({ x: x * W + triangle() * W * 0.08, reach: rand(0.4, 0.95), tail: rand(0.12, 0.32), bright: rand(0.7, 1), width: rand(0.9, 1.6), life: rand(2.2, 4.2), t: -rand(0, 0.35) });
    }
    pulse = Math.min(1.6, pulse + 0.7 * strength);
    if (!running) frame = requestAnimationFrame(loop);
  };

  const resize = () => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    W = rect.width;
    H = rect.height;
    dpr = Math.min(props.dpr, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    horizonY = H * clamp(1 - (props.horizonHeight + 0.65) * HORIZON_SLOPE, 0.15, 1);
    fieldHalf = W * 0.5 * clamp(props.spread, 0.05, 1.5) * 0.92;
    if (!lines.length) populate();
    if (!running) draw();
  };

  // ---------- one frame ----------
  const bloom = (cx: number, cy: number, rx: number, ry: number, color: Rgb, alpha: number) => {
    if (rx < 1 || alpha <= 0.002) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, rgba(color, alpha));
    gradient.addColorStop(0.35, rgba(color, alpha * 0.4));
    gradient.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // The intro, in the order it is seen: the horizon's line opens from the
  // centre; the light blooms in round it (and rises, its height growing); the
  // line's opening ends in a flash; the lines rise into view.
  const introLine = () => 1 - (1 - smooth(introProgress / 0.5)) ** 3;
  const introGlow = () => smooth((introProgress - 0.12) / 0.62);

  const drawHorizon = () => {
    const open = introLine();
    const bloomIn = introGlow();
    const base = props.horizonGlow * (1 + pulse * 0.6);
    const glow = base * bloomIn;
    const lineGlow = base * (0.4 + 0.6 * bloomIn); // the line shows before the light
    const rise = 0.35 + 0.65 * bloomIn;
    const rx = fieldHalf * open;
    const cx = W / 2 + (pointer.inside && props.interactive ? clamp((pointer.x - W / 2) / W, -0.5, 0.5) * W * 0.06 : 0);
    // The glow: more of it above the horizon than under it.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, horizonY);
    ctx.clip();
    bloom(cx, horizonY, rx * 1.15, H * 0.3 * rise, tailColor, clamp(0.2 * glow, 0, 0.7));
    bloom(cx, horizonY, rx * 0.62, H * 0.16 * rise, mixColor(tailColor, lineColor, 0.5), clamp(0.42 * glow, 0, 0.9));
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, horizonY, W, H - horizonY);
    ctx.clip();
    bloom(cx, horizonY, rx * 0.9, H * 0.1 * rise, tailColor, clamp(0.16 * glow, 0, 0.5));
    ctx.restore();
    // The line itself: white-hot in the middle, running out into the colours at both ends.
    if (rx > 2) {
      const line = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      line.addColorStop(0, rgba(tailColor, 0));
      line.addColorStop(0.2, rgba(lineColor, 0.35 * lineGlow));
      line.addColorStop(0.5, rgba(WHITE, 0.95 * lineGlow));
      line.addColorStop(0.8, rgba(lineColor, 0.35 * lineGlow));
      line.addColorStop(1, rgba(tailColor, 0));
      ctx.fillStyle = line;
      ctx.fillRect(cx - rx, horizonY - 0.75, rx * 2, 1.5);
      const halo = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      halo.addColorStop(0, rgba(tailColor, 0));
      halo.addColorStop(0.5, rgba(lineColor, 0.3 * lineGlow));
      halo.addColorStop(1, rgba(tailColor, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(cx - rx, horizonY - 3.5, rx * 2, 7);
    }
  };

  const streak = (x: number, yHead: number, yTail: number, alpha: number, width: number, hot: number) => {
    if (alpha < 0.01 || yTail - yHead < 2) return;
    const gradient = ctx.createLinearGradient(0, yHead, 0, yTail);
    gradient.addColorStop(0, rgba(WHITE, alpha * 0.95));
    gradient.addColorStop(0.05, rgba(lineColor, alpha * 0.9));
    gradient.addColorStop(0.4, rgba(mixColor(lineColor, tailColor, 0.55), alpha * 0.5));
    gradient.addColorStop(1, rgba(tailColor, 0));
    ctx.strokeStyle = gradient;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, yHead);
    ctx.lineTo(x, yTail);
    ctx.stroke();
    if (hot > 0.6 && alpha > 0.35) {
      const size = 5 + 7 * hot * Math.min(1.2, width);
      ctx.globalAlpha = clamp(alpha * 0.7);
      ctx.drawImage(sprite, x - size / 2, yHead - size / 2, size, size);
      ctx.globalAlpha = 1;
    }
  };

  const columnFalloff = (x: number) => {
    if (!pointer.inside || !props.interactive) return 0;
    const d = (x - pointer.x) / (W * 0.09);
    return Math.exp(-d * d);
  };

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    if (props.backgroundColor && props.backgroundColor !== "transparent") {
      ctx.fillStyle = props.backgroundColor;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = "lighter";
    drawHorizon();

    const reachLimit = fieldHalf * introLine() * 1.1;
    ctx.lineCap = "butt";
    for (const line of lines) {
      if (line.t < 0) continue;
      const x = W / 2 + line.u * fieldHalf;
      if (Math.abs(x - W / 2) > reachLimit) continue;
      const p = clamp(line.t / line.life);
      const rise = 1 - (1 - p) ** 1.8;
      const start = horizonY - line.z * props.depth * H * 0.08; // distant lines start above the horizon
      const yHead = start - rise * line.reach * horizonY;
      const lift = columnFalloff(x);
      const alpha = line.bright * smooth(p / 0.06) * (1 - smooth((p - 0.62) / 0.38)) * (1 - props.depth * line.z * 0.85) * (1 + lift * props.updraft * 0.5);
      const tail = line.tail * props.lineLength * H * (1 - props.depth * line.z * 0.4);
      streak(x, yHead, Math.min(start, yHead + tail), alpha, props.lineWidth * line.width * (1 - props.depth * line.z * 0.45), line.hot);
    }
    for (const b of bonus) {
      if (b.t < 0) continue;
      const p = clamp(b.t / b.life);
      const rise = 1 - (1 - p) ** 2.2;
      const yHead = horizonY - rise * b.reach * horizonY;
      streak(b.x, yHead, Math.min(horizonY, yHead + b.tail * props.lineLength * H), b.bright * smooth(p / 0.05) * (1 - smooth((p - 0.55) / 0.45)), props.lineWidth * b.width, 1);
    }

    if (props.particles > 0) {
      for (const spark of sparks) {
        if (spark.t < 0) continue;
        const p = clamp(spark.t / spark.life);
        const x = W / 2 + spark.u * fieldHalf + spark.drift * W * spark.t;
        const y = horizonY - (spark.rise * 0.9 + spark.vy * spark.t) * horizonY;
        const twinkle = 0.55 + 0.45 * Math.sin(spark.phase + spark.t * 2.4);
        const alpha = clamp(props.particles * 0.5 * twinkle * smooth(p / 0.12) * (1 - smooth((p - 0.7) / 0.3)) * smooth(introProgress * 1.4));
        if (alpha < 0.02 || y < 0 || y > horizonY) continue;
        const size = spark.size * 2.6;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, x - size, y - size, size * 2, size * 2);
      }
      ctx.globalAlpha = 1;
    }
  };

  // ---------- motion ----------
  const advance = (dt: number) => {
    if (!introArmed) {
      const horizonOnScreen = el.getBoundingClientRect().top + horizonY;
      const shown = !document.documentElement.classList.contains("ob-restoring");
      if (!shown || horizonOnScreen < innerHeight * 0.12 || horizonOnScreen > innerHeight * 0.92) return;
      introArmed = true;
    }
    introProgress = Math.min(1, introProgress + dt / INTRO_SECONDS);
    if (!flared && introProgress >= 0.5) {
      flared = true;
      pulse = Math.max(pulse, 0.7);
    }
    pulse = Math.max(0, pulse - dt * 0.9);
    for (const line of lines) {
      const x = W / 2 + line.u * fieldHalf;
      line.t += dt * (1 + columnFalloff(x) * props.updraft * 1.6);
      if (line.t >= line.life) Object.assign(line, makeLine());
    }
    for (let i = bonus.length - 1; i >= 0; i--) {
      const b = bonus[i]!;
      b.t += dt;
      if (b.t >= b.life) bonus.splice(i, 1);
    }
    if (pointer.inside && props.interactive && bonus.length < 140) {
      spawnDebt += dt * props.updraft * 9;
      while (spawnDebt >= 1) {
        spawnDebt -= 1;
        bonus.push({ x: pointer.x + triangle() * W * 0.07, reach: rand(0.18, 0.6), tail: rand(0.08, 0.22), bright: rand(0.5, 0.9), width: rand(0.8, 1.4), life: rand(1.4, 2.6), t: 0 });
      }
    }
    for (const spark of sparks) {
      const x = W / 2 + spark.u * fieldHalf;
      spark.t += dt * (1 + columnFalloff(x) * props.updraft * 1.2);
      if (spark.t >= spark.life) {
        Object.assign(spark, makeSpark());
        spark.rise = Math.random() ** 3 * 0.3;
      }
    }
  };

  // Runs while the canvas is on screen, the tab is in front and the motion is
  // not paused; otherwise it draws one frame and stops.
  const loop = (time: number) => {
    frame = 0;
    const ready = visible && !document.hidden && !props.paused && !reduced;
    if (!ready) {
      running = false;
      draw();
      return;
    }
    running = true;
    const dt = previous ? Math.min(0.05, (time - previous) / 1000) : 0;
    previous = time;
    advance(dt);
    draw();
    frame = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || reduced || props.paused || !visible) return;
    previous = 0;
    frame = requestAnimationFrame(loop);
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    if (visible) start();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      running = false;
    }
  });
  const onVisibility = () => { if (!document.hidden) start(); };

  const place = (event: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.inside = true;
  };
  const onMove = (event: PointerEvent) => { if (props.interactive) place(event); };
  const onLeave = () => { pointer.inside = false; };
  const onDown = (event: PointerEvent) => {
    if (!props.interactive || reduced) return;
    place(event);
    launchVolley(clamp(pointer.x / Math.max(1, W)), 1);
  };

  const resizer = new ResizeObserver(resize);
  drawSprite();
  resize();
  resizer.observe(el);
  if (!reduced) {
    observer.observe(el);
    document.addEventListener("visibilitychange", onVisibility);
    host?.addEventListener("pointermove", onMove);
    host?.addEventListener("pointerleave", onLeave);
    host?.addEventListener("pointerdown", onDown);
  } else {
    draw();
  }
  if (!reduced && props.intro) restartIntro();

  watch(() => props.paused, (paused) => {
    if (paused) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      running = false;
    } else {
      start();
    }
  });
  watch(() => [props.colors[0], props.colors[1]], () => {
    tailColor = parseColor(props.colors[0], tailColor);
    lineColor = parseColor(props.colors[1], lineColor);
    drawSprite();
    if (!running) draw();
  });
  watch(() => [props.density, props.horizonHeight, props.spread, props.dpr], () => {
    populate();
    resize();
  });

  stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    running = false;
    observer.disconnect();
    resizer.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    host?.removeEventListener("pointermove", onMove);
    host?.removeEventListener("pointerleave", onLeave);
    host?.removeEventListener("pointerdown", onDown);
  };
});

onBeforeUnmount(() => stop());

defineExpose({
  /** Fires a volley of lines from the horizon at a 0 to 1 position. */
  launch: (x?: number, strength?: number) => launchVolley(x, strength),
  /** Restarts the intro. */
  replay: () => restartIntro(),
});
</script>

<template>
  <div ref="root" class="rising-lines" aria-hidden="true">
    <canvas ref="canvas" class="rising-lines__canvas" />
  </div>
</template>

<style scoped>
.rising-lines {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.rising-lines__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
