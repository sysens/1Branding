<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type * as ThreeModule from "three";
import OptImage from "~/components/ui/OptImage.vue";
import { optEntry, optUrl } from "~/utils/optImage";

// PROTOTYPE "ONE Pack Lab" (/services/packaging-design): the visitor picks a
// pack format and a product and turns a 3D pack in their hands. Everything is
// procedural (lathe / box / parametric meshes); the labels are painted at
// runtime on canvases from client logo thumbnails, as honest stand-ins for
// real artwork. One label material per pack mixes two canvases in its shader,
// so a product switch is a wipe instead of a pop. Without WebGL2 the section
// shows a still of the packaging service with the same text.

type ShapeId = "can" | "bottle" | "box" | "pouch" | "bag";
type Sku = {
  id: string;
  name: string;
  logo: string;
  /** Label background. */
  color: string;
  /** Type on the label. */
  ink: string;
  /** Thin bands and rings. */
  band: string;
  /** Section tint and rim light: dark brands get their accent instead. */
  glow: string;
  /** What the glass bottle is filled with. */
  liquid: string;
  /** Part of the 400 x 200 thumbnail that holds the logo (2:1). */
  crop: [number, number, number, number];
};

const FULL: [number, number, number, number] = [0, 0, 400, 200];
const SKUS: Sku[] = [
  { id: "milka", name: "Milka", logo: "milka", color: "#7b68b6", ink: "#ffffff", band: "#ffffff", glow: "#8f7ad6", liquid: "#6b4430", crop: FULL },
  { id: "perfectCandy", name: "Perfect Candy", logo: "perfectCandy", color: "#ef5b8d", ink: "#ffffff", band: "#ffe1ea", glow: "#ff5b93", liquid: "#ff8fb3", crop: [10, 45, 220, 110] },
  { id: "apexpizza", name: "Apex Pizza", logo: "apexpizza", color: "#ffd60a", ink: "#151515", band: "#151515", glow: "#ffd60a", liquid: "#ff9f1c", crop: FULL },
  { id: "GreenGo", name: "GreenGo", logo: "GreenGo", color: "#0e1a11", ink: "#20e848", band: "#20e848", glow: "#20e848", liquid: "#8ee04f", crop: [40, 20, 320, 160] },
  { id: "Poyqadam", name: "Poyqadam", logo: "Poyqadam", color: "#0d5c33", ink: "#f4efe0", band: "#d8bf73", glow: "#1f9e5a", liquid: "#f3f0e6", crop: FULL },
  { id: "wok", name: "WOK", logo: "wok", color: "#f26a21", ink: "#151515", band: "#ffffff", glow: "#ff7a2e", liquid: "#b8561d", crop: FULL },
  { id: "grechno", name: "Grechno", logo: "grechno", color: "#7c1029", ink: "#f7e8d6", band: "#f7e8d6", glow: "#c21d45", liquid: "#4a1a0e", crop: [170, 45, 220, 110] },
  { id: "dodokids", name: "Dodo Kids", logo: "dodokids", color: "#141414", ink: "#ffd21f", band: "#ffd21f", glow: "#ffd21f", liquid: "#ffcf3f", crop: FULL },
];

const SHAPES: ShapeId[] = ["can", "bottle", "box", "pouch", "bag"];
const VOLUME: Record<ShapeId, string> = { can: "250 ml", bottle: "500 ml", box: "400 g", pouch: "180 g", bag: "1 kg" };

const COPY = {
  en: {
    title: "Turn the pack in your hands",
    lead: "Pick a format and a product: the label wraps around a 3D pack the way it will stand on the shelf.",
    note: "Prototype: the labels are made from our clients’ logos as stand-ins for real packaging artwork.",
    format: "Format",
    product: "Product",
    open: "Open",
    close: "Close",
    hint: "Drag to turn",
    stage: "3D preview: {pack}. Use the arrow keys to turn it.",
    fallbackAlt: "Packaging design by ONE Branding",
    shapes: { can: "Can", bottle: "Bottle", box: "Box", pouch: "Doy-pack", bag: "Paper bag" },
  },
  ru: {
    title: "Покрутите упаковку в руках",
    lead: "Выберите формат и продукт — этикетка ляжет на 3D-упаковку так, как она будет стоять на полке.",
    note: "Это прототип: этикетки собраны из логотипов наших клиентов вместо настоящего дизайна упаковки.",
    format: "Формат",
    product: "Продукт",
    open: "Открыть",
    close: "Закрыть",
    hint: "Потяните, чтобы повернуть",
    stage: "3D-превью: {pack}. Поворачивайте стрелками.",
    fallbackAlt: "Дизайн упаковки от ONE Branding",
    shapes: { can: "Банка", bottle: "Бутылка", box: "Коробка", pouch: "Дой-пак", bag: "Крафт-пакет" },
  },
  uz: {
    title: "Qadoqni qoʻlingizda aylantiring",
    lead: "Format va mahsulotni tanlang: yorliq 3D qadoqqa xuddi peshtaxtada turgandek oʻraladi.",
    note: "Bu prototip: yorliqlar haqiqiy qadoq dizayni oʻrniga mijozlarimiz logotiplaridan yigʻilgan.",
    format: "Format",
    product: "Mahsulot",
    open: "Ochish",
    close: "Yopish",
    hint: "Aylantirish uchun suring",
    stage: "Qadoqning 3D koʻrinishi: {pack}. Strelkalar bilan aylantiring.",
    fallbackAlt: "ONE Branding qadoq dizayni",
    shapes: { can: "Banka", bottle: "Shisha", box: "Quti", pouch: "Doy-pak", bag: "Qogʻoz paket" },
  },
};
const { locale } = useI18n();
const copy = computed(() => COPY[locale.value as keyof typeof COPY] ?? COPY.en);

const root = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const shape = ref<ShapeId>("can");
const skuIndex = ref(0);
const opened = ref(false);
const ready = ref(false);
const fallback = ref(false);
const touched = ref(false);
const sku = computed(() => SKUS[skuIndex.value]!);
const stageLabel = computed(() => copy.value.stage.replace("{pack}", `${sku.value.name}, ${copy.value.shapes[shape.value]}`));

// The 200 / 400px WebP copy from the build manifest when it exists.
const thumbUrl = (name: string, min = 400) => {
  const src = `/logoss/thumbs/${name}.webp`;
  const entry = optEntry(src);
  if (!entry) return src;
  const width = entry.widths.find((w) => w >= min) ?? entry.widths[entry.widths.length - 1]!;
  return optUrl(src, entry, width, "webp");
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

// Hooks the scene exposes to the buttons once it is running.
let api: { setShape: (id: ShapeId) => void; setSku: (i: number) => void; setOpen: (open: boolean) => void } | null = null;
const pickShape = (id: ShapeId) => {
  if (id === shape.value) return;
  shape.value = id;
  opened.value = false;
  api?.setShape(id);
};
const pickSku = (i: number) => {
  if (i === skuIndex.value) return;
  skuIndex.value = i;
  api?.setSku(i);
};
const toggleOpen = () => {
  opened.value = !opened.value;
  api?.setOpen(opened.value);
};

/* ------------------------------------------------------------------ labels */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
// Same hue, darker or lighter: for side panels and gussets.
const shade = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  return `rgb(${f((n >> 16) & 255)} ${f((n >> 8) & 255)} ${f(n & 255)})`;
};

let FONT = "Arial, sans-serif";
const font = (weight: number, size: number) => `${weight} ${Math.round(size)}px ${FONT}`;

type Ctx = CanvasRenderingContext2D;
type Logos = (HTMLImageElement | null)[];
type Rect = { x: number; y: number; w: number; h: number };

const roundRect = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// The client logo on a rounded plate with a thin ring: the "artwork" slot.
const plate = (ctx: Ctx, s: Sku, logo: HTMLImageElement | null, cx: number, cy: number, w: number, ring = s.band) => {
  const h = w / 2;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const r = h * 0.18;
  ctx.save();
  ctx.shadowColor = "rgb(0 0 0 / 0.35)";
  ctx.shadowBlur = h * 0.12;
  ctx.shadowOffsetY = h * 0.04;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  if (logo) ctx.drawImage(logo, s.crop[0], s.crop[1], s.crop[2], s.crop[3], x, y, w, h);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = ring;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = Math.max(2, h * 0.025);
  roundRect(ctx, x - h * 0.05, y - h * 0.05, w + h * 0.1, h + h * 0.1, r * 1.3);
  ctx.stroke();
  ctx.restore();
};

const text = (ctx: Ctx, value: string, x: number, y: number, size: number, color: string, weight = 700, spacing = 0, align: CanvasTextAlign = "center") => {
  ctx.save();
  ctx.font = font(weight, size);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${spacing * size}px`;
  ctx.fillText(value, x, y);
  ctx.restore();
};

// Fake small print: rows of short rounded bars.
const smallPrint = (ctx: Ctx, x: number, y: number, w: number, rows: number, color: string, seed = 1) => {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  const lh = Math.max(4, w * 0.034);
  for (let i = 0; i < rows; i++) {
    const len = w * (0.55 + (((Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453) % 1 + 1) % 1) * 0.45);
    roundRect(ctx, x, y + i * lh * 2, len, lh, lh / 2);
    ctx.fill();
  }
  ctx.restore();
};

const barcode = (ctx: Ctx, x: number, y: number, w: number, h: number) => {
  ctx.save();
  ctx.fillStyle = "#fff";
  roundRect(ctx, x - w * 0.08, y - h * 0.08, w * 1.16, h * 1.16, w * 0.04);
  ctx.fill();
  ctx.fillStyle = "#111";
  let px = x;
  let i = 0;
  while (px < x + w) {
    const bw = (w / 60) * (1 + ((i * 7) % 3));
    if (i % 2 === 0) ctx.fillRect(px, y, bw, h * 0.86);
    px += bw;
    i++;
  }
  ctx.restore();
};

// Wrap label for the can (full 360) and the glass bottle (front arc).
const paintWrap = (ctx: Ctx, W: number, H: number, s: Sku, logo: HTMLImageElement | null, kind: "can" | "bottle") => {
  ctx.fillStyle = s.color;
  ctx.fillRect(0, 0, W, H);
  // A large ring behind the plate gives the front a centre of gravity.
  ctx.save();
  ctx.strokeStyle = s.band;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = H * 0.05;
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.47, H * (kind === "can" ? 0.36 : 0.62), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  if (kind === "can") {
    // The back of the can: the brand name across the seam, faint.
    ctx.save();
    ctx.globalAlpha = 0.14;
    for (const x of [0, W]) {
      text(ctx, s.name.toUpperCase(), x, H * 0.32, H * 0.2, s.ink, 800, -0.02);
      text(ctx, s.name.toUpperCase(), x, H * 0.62, H * 0.2, s.ink, 800, -0.02);
    }
    ctx.restore();
    ctx.fillStyle = s.band;
    ctx.fillRect(0, H * 0.06, W, H * 0.025);
    ctx.fillRect(0, H * 0.915, W, H * 0.025);
    plate(ctx, s, logo, W / 2, H * 0.42, W * 0.29);
    text(ctx, s.name, W / 2, H * 0.68, H * 0.085, s.ink, 700, -0.01);
    text(ctx, VOLUME.can.toUpperCase(), W / 2, H * 0.79, H * 0.042, s.ink, 600, 0.18);
    barcode(ctx, W * 0.1, H * 0.58, W * 0.07, H * 0.16);
    smallPrint(ctx, W * 0.1, H * 0.24, W * 0.1, 8, s.ink, 3);
    smallPrint(ctx, W * 0.8, H * 0.3, W * 0.1, 10, s.ink, 7);
  } else {
    ctx.strokeStyle = s.band;
    ctx.lineWidth = H * 0.018;
    roundRect(ctx, H * 0.06, H * 0.08, W - H * 0.12, H * 0.84, H * 0.08);
    ctx.stroke();
    plate(ctx, s, logo, W / 2, H * 0.4, W * 0.36);
    text(ctx, s.name, W / 2, H * 0.73, H * 0.12, s.ink, 700, -0.01);
    text(ctx, VOLUME.bottle.toUpperCase(), W / 2, H * 0.85, H * 0.055, s.ink, 600, 0.18);
    barcode(ctx, W * 0.08, H * 0.6, W * 0.07, H * 0.2);
    smallPrint(ctx, W * 0.83, H * 0.32, W * 0.09, 7, s.ink, 5);
  }
};

// Carton dieline: front | right | back | left in a strip, the lid and the
// bottom below, plus two flat swatches the flaps and edges sample.
const BOX = { W: 1.2, H: 1.82, D: 0.6 };
const boxAtlas = (Wc: number) => {
  const s = Wc / (2 * BOX.W + 2 * BOX.D);
  const fw = BOX.W * s, sw = BOX.D * s, h = BOX.H * s, lh = BOX.D * s;
  return {
    s, width: Wc, height: Math.ceil(h + lh),
    front: { x: 0, y: 0, w: fw, h }, right: { x: fw, y: 0, w: sw, h }, back: { x: fw + sw, y: 0, w: fw, h }, left: { x: 2 * fw + sw, y: 0, w: sw, h },
    lid: { x: 0, y: h, w: fw, h: lh }, bottom: { x: fw, y: h, w: fw, h: lh },
    kraft: { x: 2 * fw + 8, y: h + 8, w: sw - 16, h: lh / 2 - 16 }, accent: { x: 2 * fw + 8, y: h + lh / 2 + 8, w: sw - 16, h: lh / 2 - 16 },
  };
};
const paintBox = (ctx: Ctx, W: number, s: Sku, logo: HTMLImageElement | null) => {
  const a = boxAtlas(W);
  const fill = (r: Rect, c: string) => { ctx.fillStyle = c; ctx.fillRect(r.x, r.y, r.w + 1, r.h + 1); };
  fill({ x: 0, y: 0, w: W, h: a.height }, s.color);
  fill(a.right, shade(s.color, -0.12));
  fill(a.left, shade(s.color, -0.12));
  fill(a.kraft, "#c8b08a");
  fill(a.accent, s.color);
  const f = a.front;
  ctx.fillStyle = s.band;
  ctx.fillRect(f.x, f.y + f.h * 0.05, f.w, f.h * 0.018);
  ctx.fillRect(f.x, f.y + f.h * 0.93, f.w, f.h * 0.018);
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = s.band;
  ctx.beginPath();
  ctx.arc(f.x + f.w / 2, f.y + f.h * 0.4, f.w * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  plate(ctx, s, logo, f.x + f.w / 2, f.y + f.h * 0.4, f.w * 0.8);
  text(ctx, s.name, f.x + f.w / 2, f.y + f.h * 0.68, f.w * 0.11, s.ink, 700, -0.01);
  text(ctx, VOLUME.box.toUpperCase(), f.x + f.w / 2, f.y + f.h * 0.8, f.w * 0.05, s.ink, 600, 0.18);
  for (const [r, rot] of [[a.right, -1], [a.left, 1]] as const) {
    ctx.save();
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
    ctx.rotate((rot * Math.PI) / 2);
    text(ctx, s.name.toUpperCase(), 0, 0, r.w * 0.36, s.ink, 800, 0.02);
    ctx.restore();
  }
  barcode(ctx, a.right.x + a.right.w * 0.25, a.right.y + a.right.h * 0.78, a.right.w * 0.5, a.right.h * 0.1);
  smallPrint(ctx, a.left.x + a.left.w * 0.18, a.left.y + a.left.h * 0.08, a.left.w * 0.64, 6, s.ink, 2);
  const b = a.back;
  plate(ctx, s, logo, b.x + b.w / 2, b.y + b.h * 0.22, b.w * 0.45);
  smallPrint(ctx, b.x + b.w * 0.14, b.y + b.h * 0.38, b.w * 0.72, 16, s.ink, 9);
  barcode(ctx, b.x + b.w * 0.58, b.y + b.h * 0.8, b.w * 0.26, b.h * 0.1);
  const l = a.lid;
  ctx.fillStyle = s.band;
  ctx.fillRect(l.x, l.y + l.h * 0.12, l.w, l.h * 0.06);
  text(ctx, s.name, l.x + l.w / 2, l.y + l.h * 0.55, l.h * 0.26, s.ink, 700);
  return a;
};

// Doy-pack: the front panel on the left half, the back on the right half.
const POUCH = { W: 1.5, H: 2.2, T: 0.27, TEAR: 0.93 };
const paintPouch = (ctx: Ctx, W: number, H: number, s: Sku, logo: HTMLImageElement | null) => {
  const pw = W / 2;
  ctx.fillStyle = s.color;
  ctx.fillRect(0, 0, W, H);
  for (const x0 of [0, pw]) {
    // Crimped top seal above the tear line and the zipper band below it.
    ctx.fillStyle = shade(s.color, -0.18);
    ctx.fillRect(x0, 0, pw, H * (1 - POUCH.TEAR) + 2);
    ctx.fillStyle = shade(s.color, 0.12);
    for (let y = 4; y < H * 0.065; y += 7) ctx.fillRect(x0, y, pw, 2);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = s.band;
    ctx.fillRect(x0, H * 0.135, pw, 3);
    ctx.fillRect(x0, H * 0.15, pw, 3);
    ctx.restore();
    ctx.fillStyle = shade(s.color, -0.15);
    ctx.fillRect(x0, H * 0.92, pw, H * 0.08);
  }
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = s.band;
  ctx.beginPath();
  ctx.arc(pw / 2, H * 0.45, pw * 0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  plate(ctx, s, logo, pw / 2, H * 0.43, pw * 0.74);
  text(ctx, s.name, pw / 2, H * 0.66, pw * 0.1, s.ink, 700, -0.01);
  text(ctx, VOLUME.pouch.toUpperCase(), pw / 2, H * 0.74, pw * 0.048, s.ink, 600, 0.18);
  text(ctx, "▼", pw * 0.9, H * 0.1, pw * 0.035, s.band, 700);
  plate(ctx, s, logo, pw * 1.5, H * 0.3, pw * 0.42);
  smallPrint(ctx, pw * 1.15, H * 0.42, pw * 0.7, 12, s.ink, 4);
  barcode(ctx, pw * 1.5, H * 0.76, pw * 0.26, H * 0.08);
};

// Kraft paper bag: front | right | back | left, the fold line at BAG.HB. The
// back panel's strip above the fold ends up in front once the top is folded
// over, so its artwork is drawn upside down.
const BAG = { W: 1.4, D: 0.85, HB: 1.65, F: 0.55 };
const bagAtlas = (Wc: number) => {
  const s = Wc / (2 * BAG.W + 2 * BAG.D);
  const fw = BAG.W * s, sw = BAG.D * s, h = (BAG.HB + BAG.F) * s;
  return {
    s, width: Wc, height: Math.ceil(h + 32), fold: BAG.F * s,
    front: { x: 0, y: 0, w: fw, h }, right: { x: fw, y: 0, w: sw, h }, back: { x: fw + sw, y: 0, w: fw, h }, left: { x: 2 * fw + sw, y: 0, w: sw, h },
    bottom: { x: 8, y: h + 4, w: Wc - 16, h: 24 },
  };
};
const paintBag = (ctx: Ctx, W: number, s: Sku, logo: HTMLImageElement | null) => {
  const a = bagAtlas(W);
  const ink = luminance(s.color) > 0.55 ? "#2b2118" : s.color;
  ctx.fillStyle = "#b98f5f";
  ctx.fillRect(0, 0, W, a.height);
  // Paper fibres.
  ctx.save();
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 1600; i++) {
    ctx.strokeStyle = rnd() > 0.5 ? "rgb(255 240 210 / 0.18)" : "rgb(90 60 30 / 0.16)";
    ctx.lineWidth = 1;
    const x = rnd() * W, y = rnd() * a.height, l = 3 + rnd() * 9, t = rnd() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(t) * l, y + Math.sin(t) * l);
    ctx.stroke();
  }
  ctx.restore();
  // Gussets: a printed band down each side.
  for (const r of [a.right, a.left]) {
    ctx.fillStyle = s.color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(r.x + r.w * 0.3, a.fold, r.w * 0.4, r.h - a.fold);
    ctx.globalAlpha = 1;
  }
  const f = a.front;
  const body = { y: a.fold, h: f.h - a.fold };
  plate(ctx, s, logo, f.w / 2, body.y + body.h * 0.62, f.w * 0.66, "#fff");
  text(ctx, s.name, f.w / 2, body.y + body.h * 0.83, f.w * 0.1, ink, 700, -0.01);
  text(ctx, VOLUME.bag.toUpperCase(), f.w / 2, body.y + body.h * 0.92, f.w * 0.05, ink, 600, 0.2);
  text(ctx, s.name.toUpperCase(), f.w / 2, body.y + body.h * 0.18, f.w * 0.085, ink, 800, 0.25);
  // Dashed fold lines on the front and the back.
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = "rgb(60 40 20 / 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, a.fold);
  ctx.lineTo(W, a.fold);
  ctx.stroke();
  ctx.restore();
  const b = a.back;
  smallPrint(ctx, b.x + b.w * 0.15, a.fold + body.h * 0.2, b.w * 0.7, 10, "#3a2a1a", 6);
  barcode(ctx, b.x + b.w * 0.6, a.fold + body.h * 0.78, b.w * 0.25, body.h * 0.1);
  // The header card on the back strip, rotated 180 degrees.
  ctx.save();
  ctx.translate(b.x + b.w / 2, a.fold / 2);
  ctx.rotate(Math.PI);
  ctx.fillStyle = s.color;
  ctx.fillRect(-b.w / 2 - 1, -a.fold / 2, b.w + 2, a.fold);
  ctx.fillStyle = s.band;
  ctx.fillRect(-b.w / 2, a.fold * 0.3, b.w, a.fold * 0.05);
  text(ctx, s.name, 0, -a.fold * 0.08, a.fold * 0.32, s.ink, 700, -0.01);
  ctx.beginPath();
  ctx.arc(b.w * 0.36, a.fold * 0.3, a.fold * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  text(ctx, "ONE", b.w * 0.36, a.fold * 0.3, a.fold * 0.11, "#111", 800, 0.05);
  ctx.restore();
  return a;
};

/* ------------------------------------------------------------------- scene */

type Pack = {
  group: ThreeModule.Group;
  footprint: [number, number];
  openTilt: number;
  /** How far the pack sinks while open, so a lid or a cap stays in frame. */
  openDrop: number;
  pose: (p: number) => void;
  /** Label painter for this pack's canvas. */
  paint: (ctx: Ctx, s: Sku) => void;
  canvasSize: [number, number];
  labelMaterials: ThreeModule.Material[];
  /** Per-SKU colours outside the label (liquid, cap). */
  tint?: (s: Sku, k: number, from: Sku) => void;
  dispose: () => void;
};

// Mixes the label with the next one along a line moving top to bottom, with a
// thin brand-green seam: the label "re-wraps" instead of popping.
const WIPE_MAP = /* glsl */ `
#ifdef USE_MAP
  vec4 labelA = texture2D( map, vMapUv );
  vec4 labelB = texture2D( uNext, vMapUv );
  float wipeFront = uMix * 1.3 - 0.15;
  float wipeT = 1.0 - vMapUv.y;
  float wipeK = 1.0 - smoothstep( wipeFront - 0.012, wipeFront + 0.012, wipeT );
  float wipeLine = ( 1.0 - smoothstep( 0.0, 0.025, abs( wipeT - wipeFront ) ) ) * step( 0.001, uMix ) * step( uMix, 0.999 );
  vec4 sampledDiffuseColor = mix( labelA, labelB, wipeK );
  sampledDiffuseColor.rgb = mix( sampledDiffuseColor.rgb, vec3( 0.12, 0.85, 0.2 ), wipeLine );
  diffuseColor *= sampledDiffuseColor;
#endif
`;

let cleanup: (() => void) | undefined;
let disposed = false;

const start = async () => {
  const host = stage.value;
  const el = canvas.value;
  if (!host || !el || disposed) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const probe = document.createElement("canvas").getContext("webgl2");
  if (!probe) {
    fallback.value = true;
    return;
  }

  FONT = getComputedStyle(document.documentElement).getPropertyValue("--app-font-display").trim() || FONT;
  const [THREE, { RoomEnvironment }, logos] = await Promise.all([
    import("three"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
    Promise.all(SKUS.map((s) => loadImage(thumbUrl(s.logo)))) as Promise<Logos>,
    document.fonts.load(`700 40px ${FONT}`).catch(() => undefined),
  ]);
  if (disposed) return;

  let renderer: ThreeModule.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    fallback.value = true;
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = envMap;
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(new THREE.Color(sku.value.glow), 1.6);
  rim.position.set(-4, 2.5, -3);
  scene.add(key, rim);

  // tilt (x) > spin (y) > packs + their contact shadow.
  const BASE = -1.15;
  const tiltGroup = new THREE.Group();
  const spinGroup = new THREE.Group();
  tiltGroup.add(spinGroup);
  scene.add(tiltGroup);

  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext("2d")!;
  const grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,0.62)");
  grad.addColorStop(0.45, "rgba(0,0,0,0.32)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(1, 1);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.y = BASE + 0.003;
  shadow.renderOrder = -1;
  spinGroup.add(shadow);

  // Label textures: two canvases per pack, the visible one and the next.
  type LabelSet = {
    canvases: HTMLCanvasElement[];
    textures: ThreeModule.CanvasTexture[];
    front: number;
    sku: number;
    uniforms: { uNext: { value: ThreeModule.Texture }; uMix: { value: number } };
  };
  const makeLabels = (w: number, h: number): LabelSet => {
    const canvases = [0, 1].map(() => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    });
    const textures = canvases.map((c) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = maxAniso;
      return t;
    });
    return { canvases, textures, front: 0, sku: -1, uniforms: { uNext: { value: textures[1]! }, uMix: { value: 0 } } };
  };
  const wipeMaterial = <M extends ThreeModule.MeshStandardMaterial>(material: M, labels: LabelSet) => {
    material.map = labels.textures[0]!;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uNext = labels.uniforms.uNext;
      shader.uniforms.uMix = labels.uniforms.uMix;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D uNext;\nuniform float uMix;")
        .replace("#include <map_fragment>", WIPE_MAP);
    };
    material.customProgramCacheKey = () => "packlab-wipe";
    return material;
  };

  // Remaps a box-like geometry's per-face UVs (0..1) into rects of an atlas.
  const remapGroups = (geo: ThreeModule.BufferGeometry, rects: (Rect | null)[], W: number, H: number) => {
    const uv = geo.getAttribute("uv") as ThreeModule.BufferAttribute;
    for (const [gi, group] of geo.groups.entries()) {
      const r = rects[gi];
      if (!r) continue;
      const index = geo.index!;
      const seen = new Set<number>();
      for (let i = group.start; i < group.start + group.count; i++) {
        const v = index.getX(i);
        if (seen.has(v)) continue;
        seen.add(v);
        uv.setXY(v, (r.x + uv.getX(v) * r.w) / W, 1 - (r.y + r.h) / H + (uv.getY(v) * r.h) / H);
      }
    }
    uv.needsUpdate = true;
  };
  // Drops one face of a BoxGeometry (the open top) and merges the rest into one draw call.
  const dropGroup = (geo: ThreeModule.BufferGeometry, drop: number) => {
    const index = Array.from(geo.index!.array);
    const g = geo.groups[drop]!;
    index.splice(g.start, g.count);
    geo.setIndex(index);
    geo.clearGroups();
  };

  const disposeGroup = (group: ThreeModule.Object3D) => {
    group.traverse((o) => {
      const mesh = o as ThreeModule.Mesh;
      if (!mesh.isMesh || mesh === shadow) return;
      mesh.geometry.dispose();
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
    });
  };
  const aluminium = () => new THREE.MeshStandardMaterial({ color: 0xd3d8de, metalness: 1, roughness: 0.24, side: THREE.DoubleSide });

  /* ---------------------------------------------------------------- can */
  const buildCan = (): Pack & { labels: LabelSet } => {
    const group = new THREE.Group();
    const R = 0.66;
    const profile = [
      [0, 0.11], [0.2, 0.1], [0.38, 0.075], [0.47, 0.035], [0.5, 0.006], [0.535, 0], [0.565, 0.006], [0.6, 0.03], [0.635, 0.075], [0.655, 0.12], [R, 0.17],
      [R, 1.9], [0.655, 1.95], [0.635, 2.01], [0.6, 2.07], [0.565, 2.12], [0.545, 2.16], [0.543, 2.19],
      [0.552, 2.205], [0.556, 2.225], [0.548, 2.243], [0.532, 2.245], [0.522, 2.232], [0.515, 2.205], [0.5, 2.2], [0, 2.2],
    ].map(([r, y]) => new THREE.Vector2(r!, y!));
    const shell = new THREE.Mesh(new THREE.LatheGeometry(profile, 72), aluminium());
    const labels = makeLabels(1024, 512);
    const labelMat = wipeMaterial(new THREE.MeshStandardMaterial({ metalness: 0.55, roughness: 0.3 }), labels);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.004, R + 0.004, 1.73, 96, 1, true, Math.PI, Math.PI * 2), labelMat);
    body.position.y = 0.17 + 1.73 / 2;

    const lid = new THREE.Group();
    lid.position.y = 2.2;
    const hole = new THREE.Shape();
    hole.absellipse(0, 0, 0.15, 0.1, 0, Math.PI * 2, false, 0);
    const holeGeo = new THREE.ShapeGeometry(hole, 24);
    holeGeo.rotateX(-Math.PI / 2);
    const opening = new THREE.Mesh(holeGeo, new THREE.MeshBasicMaterial({ color: 0x060606 }));
    opening.position.set(0, 0.003, -0.27);
    const tabShape = new THREE.Shape();
    const rr = (s: ThreeModule.Shape | ThreeModule.Path, x0: number, y0: number, x1: number, y1: number, r: number) => {
      s.moveTo(x0 + r, y0);
      s.lineTo(x1 - r, y0);
      s.quadraticCurveTo(x1, y0, x1, y0 + r);
      s.lineTo(x1, y1 - r);
      s.quadraticCurveTo(x1, y1, x1 - r, y1);
      s.lineTo(x0 + r, y1);
      s.quadraticCurveTo(x0, y1, x0, y1 - r);
      s.lineTo(x0, y0 + r);
      s.quadraticCurveTo(x0, y0, x0 + r, y0);
    };
    // Shape y becomes -z once laid flat: the nose points to the opening at the back.
    rr(tabShape, -0.1, -0.28, 0.1, 0.11, 0.07);
    const finger = new THREE.Path();
    rr(finger, -0.06, -0.22, 0.06, -0.1, 0.04);
    tabShape.holes.push(finger);
    const tabGeo = new THREE.ExtrudeGeometry(tabShape, { depth: 0.014, bevelEnabled: false, curveSegments: 6 });
    tabGeo.rotateX(-Math.PI / 2);
    const tabPivot = new THREE.Group();
    tabPivot.position.y = 0.004;
    tabPivot.add(new THREE.Mesh(tabGeo, aluminium()));
    const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), aluminium());
    lid.add(opening, tabPivot, rivet);
    group.add(shell, body, lid);

    return {
      group, labels, footprint: [1.9, 1.9], openTilt: 0.38, openDrop: 0, canvasSize: [1024, 512], labelMaterials: [labelMat],
      paint: (ctx, s) => paintWrap(ctx, 1024, 512, s, logos[SKUS.indexOf(s)] ?? null, "can"),
      pose: (p) => {
        // The tab lifts, pushes the panel in, then settles half way back.
        const a = p < 0.55 ? (1 - (1 - p / 0.55) ** 2) * 1.25 : 1.25 - easeInOut((p - 0.55) / 0.45) * 0.9;
        tabPivot.rotation.x = -a;
        const k = smooth(0.25, 0.55, p);
        opening.scale.setScalar(Math.max(k, 0.001));
        opening.visible = k > 0.001;
      },
      dispose: () => disposeGroup(group),
    };
  };

  /* ------------------------------------------------------------- bottle */
  const buildBottle = (): Pack & { labels: LabelSet } => {
    const group = new THREE.Group();
    const outer = [
      [0, 0.05], [0.3, 0.035], [0.5, 0.012], [0.575, 0], [0.605, 0.018], [0.62, 0.06], [0.622, 0.12],
      [0.622, 1.18], [0.615, 1.3], [0.59, 1.42], [0.54, 1.54], [0.46, 1.66], [0.37, 1.77], [0.29, 1.87], [0.245, 1.96], [0.228, 2.05], [0.226, 2.14],
      [0.24, 2.16], [0.242, 2.19], [0.226, 2.21], [0.24, 2.23], [0.242, 2.26], [0.226, 2.28], [0.232, 2.3], [0.226, 2.315], [0.2, 2.318], [0.19, 2.29], [0.188, 2.1],
    ].map(([r, y]) => new THREE.Vector2(r!, y!));
    // Fake glass: almost clear where the surface faces the camera, reflective
    // at grazing angles and wherever the environment's lights hit it. Real
    // transmission would need an opaque backdrop behind the pack.
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0f0c, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.1, side: THREE.DoubleSide,
      depthWrite: false, envMapIntensity: 2.2, clearcoat: 1, clearcoatRoughness: 0.03,
    });
    glassMat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `float glassF = pow( 1.0 - clamp( dot( normal, normalize( vViewPosition ) ), 0.0, 1.0 ), 2.2 );
        float glassS = dot( totalSpecular, vec3( 0.2126, 0.7152, 0.0722 ) );
        diffuseColor.a = clamp( diffuseColor.a + glassF * 0.7 + glassS * 1.4, 0.0, 1.0 );
        #include <opaque_fragment>`,
      );
    };
    glassMat.customProgramCacheKey = () => "packlab-glass";
    const glass = new THREE.Mesh(new THREE.LatheGeometry(outer, 72), glassMat);
    glass.renderOrder = 2;
    const liquidPts = [[0, 0.075], [0.5, 0.05], [0.575, 0.08], [0.582, 0.14], [0.582, 1.18], [0.575, 1.3], [0.55, 1.42], [0.5, 1.54], [0.485, 1.56], [0, 1.56]]
      .map(([r, y]) => new THREE.Vector2(r!, y!));
    const liquidMat = new THREE.MeshPhysicalMaterial({ color: sku.value.liquid, roughness: 0.12, metalness: 0, clearcoat: 0.6, emissive: sku.value.liquid, emissiveIntensity: 0.18 });
    const liquid = new THREE.Mesh(new THREE.LatheGeometry(liquidPts, 64), liquidMat);
    const labels = makeLabels(1024, 344);
    const arc = Math.PI * 1.24;
    const labelGeo = new THREE.CylinderGeometry(0.628, 0.628, 0.82, 96, 1, true, Math.PI * 2 - arc / 2, arc);
    const labelMat = wipeMaterial(new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0 }), labels);
    const label = new THREE.Mesh(labelGeo, labelMat);
    // The label's paper back, seen through the glass from behind.
    const labelBack = new THREE.Mesh(labelGeo, new THREE.MeshStandardMaterial({ color: 0xefece4, roughness: 0.8, side: THREE.BackSide }));
    label.position.y = labelBack.position.y = 0.64;
    const capGeo = new THREE.CylinderGeometry(0.262, 0.262, 0.2, 96, 2, false);
    // Knurled ridges on the cap's side.
    const pos = capGeo.getAttribute("position") as ThreeModule.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      if (r < 0.26) continue;
      const k = 1 + 0.014 * Math.cos(Math.atan2(x, z) * 48);
      pos.setXYZ(i, x * k, pos.getY(i), z * k);
    }
    capGeo.computeVertexNormals();
    const capMat = new THREE.MeshStandardMaterial({ color: sku.value.color, metalness: 0.65, roughness: 0.32 });
    const cap = new THREE.Mesh(capGeo, capMat);
    const capY = 2.24;
    cap.position.y = capY;
    group.add(liquid, label, labelBack, glass, cap);
    const a = new THREE.Color(), b = new THREE.Color();
    return {
      group, labels, footprint: [1.8, 1.8], openTilt: 0.12, openDrop: 0.18, canvasSize: [1024, 344], labelMaterials: [labelMat],
      paint: (ctx, s) => paintWrap(ctx, 1024, 344, s, logos[SKUS.indexOf(s)] ?? null, "bottle"),
      tint: (s, k, from) => {
        liquidMat.color.copy(a.set(from.liquid)).lerp(b.set(s.liquid), k);
        liquidMat.emissive.copy(liquidMat.color);
        capMat.color.copy(a.set(from.color)).lerp(b.set(s.color), k);
      },
      pose: (p) => {
        // Twist up off the thread, then lift aside and tilt.
        const e = easeInOut(clamp01(p / 0.55));
        const e2 = easeInOut(clamp01((p - 0.55) / 0.45));
        cap.rotation.y = -e * Math.PI * 2.6;
        cap.position.set(e2 * 0.72, capY + e * 0.16 + e2 * 0.2, 0);
        cap.rotation.z = -e2 * 0.5;
      },
      dispose: () => disposeGroup(group),
    };
  };

  /* ---------------------------------------------------------------- box */
  const buildBox = (): Pack & { labels: LabelSet } => {
    const group = new THREE.Group();
    const { W, H, D } = BOX;
    const atlas = boxAtlas(1024);
    const AW = atlas.width, AH = atlas.height;
    const labels = makeLabels(AW, AH);
    const labelMat = wipeMaterial(new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0 }), labels);
    // BoxGeometry groups: +x, -x, +y, -y, +z, -z.
    const bodyGeo = new THREE.BoxGeometry(W, H, D);
    bodyGeo.translate(0, H / 2, 0);
    remapGroups(bodyGeo, [atlas.right, atlas.left, null, atlas.bottom, atlas.front, atlas.back], AW, AH);
    dropGroup(bodyGeo, 2);
    const body = new THREE.Mesh(bodyGeo, labelMat);
    const inside = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0xbca27c, roughness: 0.9, side: THREE.BackSide }));

    const lidGeo = new THREE.BoxGeometry(W, 0.012, D);
    remapGroups(lidGeo, [atlas.accent, atlas.accent, atlas.lid, atlas.kraft, atlas.accent, atlas.accent], AW, AH);
    lidGeo.translate(0, 0.006, D / 2);
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, H, -D / 2);
    lidPivot.add(new THREE.Mesh(lidGeo, labelMat));
    const tongueGeo = new THREE.BoxGeometry(W * 0.98, 0.012, 0.2);
    remapGroups(tongueGeo, [atlas.kraft, atlas.kraft, atlas.accent, atlas.kraft, atlas.kraft, atlas.kraft], AW, AH);
    tongueGeo.translate(0, 0.006, 0.1);
    const tonguePivot = new THREE.Group();
    tonguePivot.position.set(0, 0, D - 0.008);
    tonguePivot.add(new THREE.Mesh(tongueGeo, labelMat));
    lidPivot.add(tonguePivot);
    const flap = (side: 1 | -1) => {
      const geo = new THREE.BoxGeometry(0.01, 0.24, D * 0.92);
      const outerFace = side < 0 ? 1 : 0;
      remapGroups(geo, [0, 1, 2, 3, 4, 5].map((i) => (i === outerFace ? atlas.accent : atlas.kraft)), AW, AH);
      geo.translate(0, 0.12, 0);
      const pivot = new THREE.Group();
      pivot.position.set(side * (W / 2 - 0.006), H - 0.014, 0);
      pivot.add(new THREE.Mesh(geo, labelMat));
      return pivot;
    };
    const left = flap(-1), right = flap(1);
    group.add(body, inside, lidPivot, left, right);
    return {
      group, labels, footprint: [2.1, 1.3], openTilt: 0.24, openDrop: 0.22, canvasSize: [AW, AH], labelMaterials: [labelMat],
      paint: (ctx, s) => paintBox(ctx, AW, s, logos[SKUS.indexOf(s)] ?? null),
      pose: (p) => {
        const e = easeInOut(clamp01(p / 0.65));
        lidPivot.rotation.x = -e * 1.8;
        tonguePivot.rotation.x = Math.PI / 2 + (0.25 - Math.PI / 2) * easeInOut(clamp01((p - 0.05) / 0.5));
        const f = easeInOut(clamp01((p - 0.35) / 0.65));
        left.rotation.z = -Math.PI / 2 + (0.22 + Math.PI / 2) * f;
        right.rotation.z = Math.PI / 2 - (0.22 + Math.PI / 2) * f;
      },
      dispose: () => disposeGroup(group),
    };
  };

  /* -------------------------------------------------------------- pouch */
  const buildPouch = (): Pack & { labels: LabelSet } => {
    const group = new THREE.Group();
    const { W, H, T, TEAR } = POUCH;
    const NU = 36;
    const profile = (v: number) => {
      if (v < 0.1) return 0.86 + 0.14 * smooth(0, 0.1, v);
      if (v < 0.86) return Math.cos(((v - 0.1) / 0.76) * (Math.PI / 2)) ** 0.85;
      return 0;
    };
    // Front and back sheets over v0..v1 (0 = bottom, 1 = top seal), plus the
    // flat gusset bottom when v0 is 0. `open` parts the sheets at the mouth.
    const sheet = (v0: number, v1: number, nv: number) => {
      const per = (NU + 1) * (nv + 1);
      const capVerts = v0 === 0 ? (NU + 1) * 2 : 0;
      const positions = new Float32Array((per * 2 + capVerts) * 3);
      const uvs = new Float32Array((per * 2 + capVerts) * 2);
      const index: number[] = [];
      const id = (side: number, i: number, j: number) => side * per + j * (NU + 1) + i;
      for (let side = 0; side < 2; side++) {
        for (let j = 0; j <= nv; j++) {
          for (let i = 0; i <= NU; i++) {
            const u = i / NU, v = v0 + ((v1 - v0) * j) / nv;
            const n = id(side, i, j);
            uvs[n * 2] = side === 0 ? u * 0.5 : 0.5 + (1 - u) * 0.5;
            uvs[n * 2 + 1] = v;
            if (i < NU && j < nv) {
              const a = id(side, i, j), b = id(side, i + 1, j), c = id(side, i + 1, j + 1), d = id(side, i, j + 1);
              if (side === 0) index.push(a, b, d, b, c, d);
              else index.push(a, d, b, b, d, c);
            }
          }
        }
      }
      if (capVerts) {
        const c0 = per * 2;
        for (let i = 0; i <= NU; i++) {
          uvs[(c0 + i) * 2] = 0.25;
          uvs[(c0 + i) * 2 + 1] = 0.01;
          uvs[(c0 + NU + 1 + i) * 2] = 0.75;
          uvs[(c0 + NU + 1 + i) * 2 + 1] = 0.01;
          if (i < NU) {
            const f0 = c0 + i, f1 = c0 + i + 1, b0 = c0 + NU + 1 + i, b1 = b0 + 1;
            index.push(f0, b0, f1, f1, b0, b1);
          }
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(index);
      const update = (open: number, flat: boolean) => {
        for (let side = 0; side < 2; side++) {
          for (let j = 0; j <= nv; j++) {
            const v = v0 + ((v1 - v0) * j) / nv;
            const prof = flat ? 0 : profile(v);
            for (let i = 0; i <= NU; i++) {
              const u = i / NU;
              const bulge = Math.sin(Math.PI * u);
              const t = flat ? 0.004 : T * prof * bulge ** 0.5 + open * 0.075 * smooth(0.6, TEAR, v) * bulge ** 0.8 + 0.004;
              const n = id(side, i, j) * 3;
              positions[n] = (u - 0.5) * W * (1 - 0.045 * prof);
              positions[n + 1] = v * H;
              positions[n + 2] = side === 0 ? t : -t;
            }
          }
        }
        if (capVerts) {
          const c0 = per * 2;
          for (let i = 0; i <= NU; i++) {
            for (let side = 0; side < 2; side++) {
              const src = id(side, i, 0) * 3, dst = (c0 + side * (NU + 1) + i) * 3;
              positions[dst] = positions[src]!;
              positions[dst + 1] = positions[src + 1]!;
              positions[dst + 2] = positions[src + 2]!;
            }
          }
        }
        geo.getAttribute("position").needsUpdate = true;
        geo.computeVertexNormals();
        geo.computeBoundingSphere();
      };
      return { geo, update };
    };
    const labels = makeLabels(1024, 734);
    const labelMat = wipeMaterial(new THREE.MeshPhysicalMaterial({ roughness: 0.36, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.22 }), labels);
    const foil = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 1, roughness: 0.35, side: THREE.BackSide });
    const bodySheet = sheet(0, TEAR, 44);
    bodySheet.update(0, false);
    const strip = sheet(TEAR, 1, 3);
    strip.update(0, true);
    const stripMesh = new THREE.Mesh(strip.geo, labelMat);
    // The strip tears off around its own centre.
    strip.geo.translate(0, -(TEAR + 1) / 2 * H, 0);
    const stripPivot = new THREE.Group();
    stripPivot.position.y = ((TEAR + 1) / 2) * H;
    stripPivot.add(stripMesh);
    group.add(new THREE.Mesh(bodySheet.geo, labelMat), new THREE.Mesh(bodySheet.geo, foil), stripPivot);
    let lastOpen = 0;
    return {
      group, labels, footprint: [2.2, 1.15], openTilt: 0.16, openDrop: 0, canvasSize: [1024, 734], labelMaterials: [labelMat],
      paint: (ctx, s) => paintPouch(ctx, 1024, 734, s, logos[SKUS.indexOf(s)] ?? null),
      pose: (p) => {
        const e = easeInOut(clamp01(p / 0.45));
        stripPivot.position.set(e * 0.3, ((TEAR + 1) / 2) * H + e * 0.4, e * 0.1);
        stripPivot.rotation.z = -e * 0.35;
        const s = 1 - smooth(0.35, 0.6, p);
        stripPivot.scale.setScalar(Math.max(s, 0.001));
        stripPivot.visible = s > 0.001;
        const open = smooth(0.3, 1, p);
        if (open !== lastOpen) {
          lastOpen = open;
          bodySheet.update(open, false);
        }
      },
      dispose: () => disposeGroup(group),
    };
  };

  /* ---------------------------------------------------------------- bag */
  const buildBag = (): Pack & { labels: LabelSet } => {
    const group = new THREE.Group();
    const { W, D, HB, F } = BAG;
    const HT = HB + F;
    const atlas = bagAtlas(1024);
    const labels = makeLabels(atlas.width, atlas.height);
    const labelMat = wipeMaterial(new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 }), labels);
    // 40 rows put a row exactly on the fold line (HB / HT = 30 / 40).
    const geo = new THREE.BoxGeometry(W, HT, D, 1, 40, 2);
    geo.translate(0, HT / 2, 0);
    remapGroups(geo, [atlas.right, atlas.left, null, atlas.bottom, atlas.front, atlas.back], atlas.width, atlas.height);
    dropGroup(geo, 2);
    const pos = geo.getAttribute("position") as ThreeModule.BufferAttribute;
    const rest = Float32Array.from(pos.array as Float32Array);
    // pinch: the back and the gussets fold against the front near the top.
    // fold: the strip above HB turns over the front.
    const pose = (pinch: number, fold: number) => {
      const theta = fold * Math.PI * 0.965;
      const c = Math.cos(theta), s = Math.sin(theta);
      for (let i = 0; i < pos.count; i++) {
        const x = rest[i * 3]!, y = rest[i * 3 + 1]!, z = rest[i * 3 + 2]!;
        const k = pinch * smooth(HB - 0.32, HB, y);
        let nz = D / 2 + (z - D / 2) * (1 - 0.94 * k);
        let nx = x;
        if (Math.abs(Math.abs(x) - W / 2) < 1e-4 && Math.abs(z) < 1e-4) nx = Math.sign(x) * (W / 2 - 0.03 - k * (D / 2) * 0.9);
        let ny = y;
        if (y > HB + 1e-4) {
          const dy = y - HB, dz = nz - D / 2;
          ny = HB + dy * c - dz * s;
          nz = D / 2 + dy * s + dz * c;
        }
        pos.setXYZ(i, nx, ny, nz);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
    };
    pose(1, 1);
    group.add(new THREE.Mesh(geo, labelMat), new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x5e452b, roughness: 0.95, side: THREE.BackSide })));
    let last = -1;
    return {
      group, labels, footprint: [2.2, 1.6], openTilt: 0.22, openDrop: 0.3, canvasSize: [atlas.width, atlas.height], labelMaterials: [labelMat],
      paint: (ctx, s) => paintBag(ctx, atlas.width, s, logos[SKUS.indexOf(s)] ?? null),
      pose: (p) => {
        if (p === last) return;
        last = p;
        pose(1 - easeInOut(clamp01((p - 0.4) / 0.6)), 1 - easeInOut(clamp01(p / 0.55)));
      },
      dispose: () => disposeGroup(group),
    };
  };

  const builders: Record<ShapeId, () => Pack & { labels: LabelSet }> = { can: buildCan, bottle: buildBottle, box: buildBox, pouch: buildPouch, bag: buildBag };
  const packs = new Map<ShapeId, Pack & { labels: LabelSet }>();

  // Wipe in progress (one at a time; a new pick finishes the running one).
  let wipe: { pack: Pack & { labels: LabelSet }; t: number; from: Sku; to: Sku } | null = null;
  const finishWipe = () => {
    if (!wipe) return;
    const { pack, to } = wipe;
    const l = pack.labels;
    l.front = 1 - l.front;
    pack.labelMaterials.forEach((m) => ((m as ThreeModule.MeshStandardMaterial).map = l.textures[l.front]!));
    l.uniforms.uMix.value = 0;
    pack.tint?.(to, 1, to);
    wipe = null;
  };
  const paintInto = (pack: Pack & { labels: LabelSet }, slot: number, s: Sku) => {
    const ctx = pack.labels.canvases[slot]!.getContext("2d")!;
    ctx.clearRect(0, 0, pack.canvasSize[0], pack.canvasSize[1]);
    pack.paint(ctx, s);
    pack.labels.textures[slot]!.needsUpdate = true;
  };
  const applySku = (pack: Pack & { labels: LabelSet }, i: number, animate: boolean) => {
    const l = pack.labels;
    if (l.sku === i) return;
    if (wipe?.pack === pack) finishWipe();
    const from = SKUS[l.sku] ?? SKUS[i]!;
    const to = SKUS[i]!;
    l.sku = i;
    if (!animate) {
      paintInto(pack, l.front, to);
      pack.tint?.(to, 1, to);
      return;
    }
    const back = 1 - l.front;
    paintInto(pack, back, to);
    l.uniforms.uNext.value = l.textures[back]!;
    l.uniforms.uMix.value = 0;
    wipe = { pack, t: 0, from, to };
  };

  const getPack = (id: ShapeId) => {
    let pack = packs.get(id);
    if (!pack) {
      pack = builders[id]();
      pack.group.position.y = BASE;
      pack.group.visible = false;
      pack.pose(0);
      spinGroup.add(pack.group);
      packs.set(id, pack);
    }
    applySku(pack, skuIndex.value, false);
    return pack;
  };

  // Fits the camera to the stage: a narrow stage moves the camera back.
  const layout = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const dist = 7.9 * Math.max(1, 0.8 / camera.aspect);
    camera.position.set(0, 1.0, dist);
    camera.lookAt(0, 0.14, 0);
    camera.updateProjectionMatrix();
    dirty = true;
  };

  // State driven by the loop.
  let current = getPack(shape.value);
  current.group.visible = true;
  shadow.scale.set(current.footprint[0], 1, current.footprint[1]);
  let swap: { from: Pack; to: Pack; t: number } | null = null;
  let openP = 0;
  let openTarget = 0;
  let rotY = -0.45;
  let vel = 0;
  let tilt = 0.08;
  let tiltTarget = 0.08;
  let dragging = false;
  let lastInput = -10;
  let dirty = true;
  const rimFrom = new THREE.Color(sku.value.glow);
  const rimTo = new THREE.Color(sku.value.glow);
  let rimT = 1;

  api = {
    setShape: (id) => {
      if (swap) {
        swap.from.group.visible = false;
        current = swap.to as typeof current;
        current.group.scale.setScalar(1);
        current.group.rotation.y = 0;
        swap = null;
      }
      const next = getPack(id);
      if (next === current) return;
      if (wipe) finishWipe();
      current.pose((openP = openTarget = 0));
      next.pose(0);
      if (reducedMotion) {
        current.group.visible = false;
        next.group.visible = true;
        next.group.scale.setScalar(1);
        shadow.scale.set(next.footprint[0], 1, next.footprint[1]);
        current = next;
      } else {
        swap = { from: current, to: next, t: 0 };
      }
      dirty = true;
    },
    setSku: (i) => {
      const pack = swap ? (swap.to as typeof current) : current;
      applySku(pack, i, !reducedMotion);
      rimFrom.copy(rim.color);
      rimTo.set(SKUS[i]!.glow);
      rimT = reducedMotion ? 1 : 0;
      if (reducedMotion) rim.color.copy(rimTo);
      dirty = true;
    },
    setOpen: (open) => {
      openTarget = open ? 1 : 0;
      if (reducedMotion) {
        openP = openTarget;
        current.pose(openP);
      }
      dirty = true;
    },
  };

  /* ---------------------------------------------------------- interaction */
  let lastX = 0, lastY = 0, lastT = 0, pointerId = -1, mouseLike = false;
  const onDown = (event: PointerEvent) => {
    if (event.button > 0) return;
    dragging = true;
    pointerId = event.pointerId;
    mouseLike = event.pointerType !== "touch";
    lastX = event.clientX;
    lastY = event.clientY;
    lastT = performance.now();
    vel = 0;
    touched.value = true;
    host.setPointerCapture?.(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastT) / 1000;
    const dx = event.clientX - lastX;
    const step = dx * 0.0105;
    rotY += step;
    vel = vel * 0.6 + (step / dt) * 0.4;
    // Only a mouse or pen tilts: a vertical finger move scrolls the page.
    if (mouseLike) tiltTarget = Math.min(0.55, Math.max(-0.35, tiltTarget + (event.clientY - lastY) * 0.005));
    lastX = event.clientX;
    lastY = event.clientY;
    lastT = now;
    lastInput = performance.now() / 1000;
    dirty = true;
  };
  const onUp = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = -1;
    if (reducedMotion || performance.now() - lastT > 80) vel = 0;
    lastInput = performance.now() / 1000;
  };
  const onKey = (event: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowLeft: () => (reducedMotion ? (rotY -= 0.4) : (vel -= 1.1)),
      ArrowRight: () => (reducedMotion ? (rotY += 0.4) : (vel += 1.1)),
      ArrowUp: () => (tiltTarget = Math.max(-0.35, tiltTarget - 0.12)),
      ArrowDown: () => (tiltTarget = Math.min(0.55, tiltTarget + 0.12)),
    };
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
    touched.value = true;
    lastInput = performance.now() / 1000;
    dirty = true;
  };
  host.addEventListener("pointerdown", onDown);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onUp);
  host.addEventListener("keydown", onKey);

  let visible = true;
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    dirty = true;
  }, { rootMargin: "100px 0px" });
  observer.observe(host);
  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(host);
  layout();

  const clock = new THREE.Clock();
  let frame = 0;
  const AUTO = 0.32;
  const render = () => {
    frame = requestAnimationFrame(render);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || document.hidden) return;
    const now = performance.now() / 1000;
    let animating = dragging;

    // Spin: inertia after a drag, then an idle auto-rotate.
    if (!dragging) {
      const idle = !reducedMotion && now - lastInput > 2.5;
      const target = idle ? AUTO : 0;
      vel += (target - vel) * (1 - Math.exp(-dt * (idle ? 0.9 : 2.4)));
      if (Math.abs(vel) > 1e-4) {
        rotY += vel * dt;
        animating = true;
      }
    }
    const tiltGoal = tiltTarget + current.openTilt * (swap ? 0 : openP);
    if (Math.abs(tiltGoal - tilt) > 1e-4) {
      tilt += (tiltGoal - tilt) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 5));
      animating = true;
    }
    spinGroup.rotation.y = rotY;
    tiltGroup.rotation.x = tilt;
    tiltGroup.position.y = swap ? 0 : -current.openDrop * easeInOut(openP);

    if (openP !== openTarget && !reducedMotion) {
      const step = dt / (current === packs.get("bag") ? 1.6 : 1.3);
      openP = openTarget > openP ? Math.min(openTarget, openP + step) : Math.max(openTarget, openP - step);
      current.pose(easeInOut(openP));
      animating = true;
    }

    if (swap) {
      swap.t = Math.min(1, swap.t + dt / 0.62);
      const t = swap.t;
      const out = 1 - easeInOut(clamp01(t / 0.38));
      swap.from.group.scale.setScalar(Math.max(out, 0.001));
      swap.from.group.rotation.y = (1 - out) * -0.8;
      swap.from.group.visible = out > 0.001;
      const inT = clamp01((t - 0.38) / 0.62);
      swap.to.group.visible = inT > 0;
      swap.to.group.scale.setScalar(Math.max(easeOutBack(inT), 0.001));
      swap.to.group.rotation.y = (1 - easeInOut(inT)) * 1.1;
      const fa = swap.from.footprint, fb = swap.to.footprint;
      const k = smooth(0.2, 0.8, t);
      shadow.scale.set(fa[0] + (fb[0] - fa[0]) * k, 1, fa[1] + (fb[1] - fa[1]) * k);
      if (t >= 1) {
        swap.to.group.rotation.y = 0;
        current = swap.to as typeof current;
        swap = null;
      }
      animating = true;
    }

    if (wipe) {
      wipe.t = Math.min(1, wipe.t + dt / 0.75);
      const k = easeInOut(wipe.t);
      wipe.pack.labels.uniforms.uMix.value = k;
      wipe.pack.tint?.(wipe.to, k, wipe.from);
      if (wipe.t >= 1) finishWipe();
      animating = true;
    }
    if (rimT < 1) {
      rimT = Math.min(1, rimT + dt / 0.75);
      rim.color.copy(rimFrom).lerp(rimTo, easeInOut(rimT));
      animating = true;
    }

    if (animating || dirty) {
      renderer.render(scene, camera);
      dirty = false;
      if (!ready.value) ready.value = true;
    }
  };
  render();

  cleanup = () => {
    cancelAnimationFrame(frame);
    api = null;
    observer.disconnect();
    resizeObserver.disconnect();
    host.removeEventListener("pointerdown", onDown);
    host.removeEventListener("pointermove", onMove);
    host.removeEventListener("pointerup", onUp);
    host.removeEventListener("pointercancel", onUp);
    host.removeEventListener("keydown", onKey);
    for (const pack of packs.values()) {
      pack.dispose();
      pack.labels.textures.forEach((t) => t.dispose());
    }
    shadowGeo.dispose();
    shadowMat.dispose();
    shadowTex.dispose();
    envMap.dispose();
    renderer.dispose();
  };
};

// Builds the scene only when the section comes near the viewport.
let nearObserver: IntersectionObserver | undefined;
onMounted(() => {
  const el = root.value;
  if (!el) return;
  nearObserver = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return;
    nearObserver?.disconnect();
    nearObserver = undefined;
    void start();
  }, { rootMargin: "600px 0px" });
  nearObserver.observe(el);
});

onBeforeUnmount(() => {
  disposed = true;
  nearObserver?.disconnect();
  cleanup?.();
});
</script>

<template>
  <section ref="root" class="packlab" :style="{ '--packlab-glow': sku.glow }" aria-labelledby="packlab-title">
    <div class="packlab__head">
      <p class="packlab__eyebrow">ONE Pack Lab</p>
      <h2 id="packlab-title" class="packlab__title">{{ copy.title }}</h2>
      <p class="packlab__lead">{{ copy.lead }}</p>
    </div>

    <div
      ref="stage"
      class="packlab__stage"
      :class="{ 'is-ready': ready, 'is-fallback': fallback }"
      :tabindex="fallback ? undefined : 0"
      role="group"
      aria-roledescription="3D"
      :aria-label="fallback ? copy.fallbackAlt : stageLabel"
    >
      <OptImage
        v-if="fallback"
        src="/home/threeLayerLocal/34.webp"
        :alt="copy.fallbackAlt"
        sizes="(min-width: 900px) 50vw, 92vw"
        loading="lazy"
        decoding="async"
        class="packlab__fallback"
      />
      <template v-else>
        <canvas ref="canvas" class="packlab__canvas" />
        <span v-if="!ready" class="packlab__loading" aria-hidden="true" />
        <p class="packlab__chip" aria-hidden="true">
          <span class="packlab__chip-dot" />{{ sku.name }} · {{ copy.shapes[shape] }}
        </p>
        <p class="packlab__hint" :class="{ 'is-hidden': touched || !ready }" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" /></svg>
          {{ copy.hint }}
        </p>
      </template>
    </div>

    <div v-if="!fallback" class="packlab__controls">
      <div class="packlab__group" role="group" aria-labelledby="packlab-format">
        <p id="packlab-format" class="packlab__label">{{ copy.format }}</p>
        <div class="packlab__shapes">
          <button
            v-for="id in SHAPES"
            :key="id"
            type="button"
            class="packlab__shape"
            :aria-pressed="shape === id"
            @click="pickShape(id)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <template v-if="id === 'can'"><path d="M7 5.5c0-1 2.2-1.6 5-1.6s5 .6 5 1.6v13c0 1-2.2 1.6-5 1.6s-5-.6-5-1.6z" /><path d="M7 5.5c0 1 2.2 1.6 5 1.6s5-.6 5-1.6" /></template>
              <template v-else-if="id === 'bottle'"><path d="M10.5 2.8h3v3.4c0 1.4 3.5 2.6 3.5 5.6v8.4c0 .6-.4 1-1 1H8c-.6 0-1-.4-1-1v-8.4c0-3 3.5-4.2 3.5-5.6z" /><path d="M7 13h10" /></template>
              <template v-else-if="id === 'box'"><path d="M12 3 4.5 6.8v10.4L12 21l7.5-3.8V6.8z" /><path d="m4.5 6.8 7.5 3.8 7.5-3.8M12 10.6V21" /></template>
              <template v-else-if="id === 'pouch'"><path d="M6.5 3.5h11l-.3 4.5c1.6 2.5 2.3 6 1.8 11.5H5c-.5-5.5.2-9 1.8-11.5z" /><path d="M6.8 6.5h10.4" /></template>
              <template v-else><path d="M5 9.5h14l-1 11H6z" /><path d="M6.5 9.5 8 4h8l1.5 5.5" /><circle cx="12" cy="7" r="1" /></template>
            </svg>
            <span>{{ copy.shapes[id] }}</span>
          </button>
        </div>
      </div>

      <div class="packlab__group" role="group" aria-labelledby="packlab-product">
        <p id="packlab-product" class="packlab__label">{{ copy.product }}</p>
        <div class="packlab__skus">
          <button
            v-for="(item, i) in SKUS"
            :key="item.id"
            type="button"
            class="packlab__sku"
            :style="{ '--swatch': item.glow }"
            :aria-pressed="skuIndex === i"
            :aria-label="item.name"
            :title="item.name"
            @click="pickSku(i)"
          >
            <img :src="thumbUrl(item.logo, 200)" alt="" width="200" height="100" loading="lazy" decoding="async">
          </button>
        </div>
      </div>

      <div class="packlab__actions">
        <button type="button" class="ob-button packlab__open" :aria-pressed="opened" :disabled="!ready" @click="toggleOpen">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path v-if="opened" d="M6 6l12 12M18 6 6 18" />
            <path v-else d="M12 19V5M6 11l6-6 6 6" />
          </svg>
          {{ opened ? copy.close : copy.open }}
        </button>
      </div>
    </div>

    <p class="packlab__note">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>
      {{ copy.note }}
    </p>
  </section>
</template>

<style scoped>
/* A registered colour animates, so a product switch fades the section's tint. */
@property --packlab-glow {
  syntax: "<color>";
  inherits: true;
  initial-value: #03cb00;
}

.packlab {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  grid-template-areas:
    "stage head"
    "stage controls"
    "stage note";
  grid-template-rows: auto auto 1fr;
  gap: 0 3.5rem;
  margin-top: 7.5rem;
  padding: 3rem;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 2rem;
  background:
    radial-gradient(55% 75% at 28% 58%, color-mix(in srgb, var(--packlab-glow) 34%, transparent), transparent 72%),
    radial-gradient(45% 55% at 92% 0%, color-mix(in srgb, var(--packlab-glow) 12%, transparent), transparent 70%),
    #050505;
  color: #fff;
  transition: --packlab-glow 0.9s ease;
}

.packlab__head {
  grid-area: head;
  align-self: end;
}

.packlab__eyebrow {
  margin: 0 0 1rem;
  color: #20e848;
  font-family: var(--app-font-sans);
  font-size: var(--type-label-size);
  line-height: var(--type-label-lh);
  letter-spacing: var(--type-label-ls);
  font-weight: 600;
  text-transform: uppercase;
}

.packlab__title {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: var(--type-h3-size);
  line-height: var(--type-h3-lh);
  letter-spacing: var(--type-h3-ls);
  font-weight: 600;
}

.packlab__lead {
  margin: 1rem 0 0;
  color: #c9cbce;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
}

.packlab__stage {
  grid-area: stage;
  position: relative;
  align-self: center;
  aspect-ratio: 1 / 1.02;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 1.5rem;
  background:
    radial-gradient(60% 50% at 50% 42%, color-mix(in srgb, var(--packlab-glow) 22%, transparent), transparent 75%),
    radial-gradient(70% 18% at 50% 86%, rgb(255 255 255 / 0.05), transparent 70%),
    rgb(0 0 0 / 0.45);
  cursor: grab;
  /* A vertical swipe scrolls the page; a horizontal one turns the pack. */
  touch-action: pan-y;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.packlab__stage:active {
  cursor: grabbing;
}

.packlab__stage:focus-visible {
  box-shadow: 0 0 0 2px #000, 0 0 0 4px #20e848;
}

.packlab__stage.is-fallback {
  cursor: default;
  aspect-ratio: 16 / 10;
}

.packlab__canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.packlab__stage.is-ready .packlab__canvas {
  opacity: 1;
}

.packlab__fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.packlab__loading {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2.25rem;
  height: 2.25rem;
  margin: -1.125rem 0 0 -1.125rem;
  border: 2px solid rgb(255 255 255 / 0.15);
  border-top-color: #20e848;
  border-radius: 50%;
  animation: packlab-spin 0.9s linear infinite;
}

@keyframes packlab-spin {
  to {
    transform: rotate(1turn);
  }
}

.packlab__chip,
.packlab__hint {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.45rem 0.85rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(0 0 0 / 0.5);
  backdrop-filter: blur(8px);
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
}

.packlab__chip {
  top: 1rem;
  left: 1rem;
}

.packlab__chip-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--packlab-glow);
  box-shadow: 0 0 0.6rem var(--packlab-glow);
}

.packlab__hint {
  bottom: 1rem;
  left: 50%;
  translate: -50% 0;
  color: #20e848;
  transition: opacity 0.5s ease;
}

.packlab__hint.is-hidden {
  opacity: 0;
}

.packlab__hint svg,
.packlab__note svg {
  flex: none;
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* minmax(0, 1fr): the swatch row's full width must not widen the column
   (on a phone it scrolls inside it instead). */
.packlab__controls {
  grid-area: controls;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.75rem;
  margin-top: 2.25rem;
}

.packlab__label {
  margin: 0 0 0.75rem;
  color: #9b9ea2;
  font-family: var(--app-font-sans);
  font-size: var(--type-label-size);
  letter-spacing: var(--type-label-ls);
  font-weight: 600;
  text-transform: uppercase;
}

.packlab__shapes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.packlab__shape {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.75rem;
  padding: 0 1rem 0 0.8rem;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease;
}

.packlab__shape svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.packlab__shape:hover {
  border-color: rgb(255 255 255 / 0.4);
}

.packlab__shape[aria-pressed="true"] {
  border-color: #20e848;
  background: #20e848;
  color: #031a06;
}

.packlab__shape:focus-visible,
.packlab__sku:focus-visible {
  outline: 2px solid #20e848;
  outline-offset: 3px;
}

.packlab__skus {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
}

.packlab__sku {
  position: relative;
  padding: 0;
  overflow: hidden;
  aspect-ratio: 2 / 1;
  border: 0;
  border-radius: 0.75rem;
  background: #111;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.12);
  transition: box-shadow 0.25s ease;
}

.packlab__sku img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.72;
  transition: opacity 0.25s ease;
}

.packlab__sku:hover img,
.packlab__sku[aria-pressed="true"] img {
  opacity: 1;
}

.packlab__sku[aria-pressed="true"] {
  box-shadow: 0 0 0 2px #000, 0 0 0 4px var(--swatch);
}

.packlab__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.packlab__open:disabled {
  opacity: 0.5;
  cursor: default;
}

.packlab__note {
  grid-area: note;
  align-self: end;
  display: flex;
  gap: 0.5rem;
  margin: 2rem 0 0;
  color: #8d9094;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
}

.packlab__note svg {
  margin-top: 0.1rem;
}

@media (max-width: 899px) {
  .packlab {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "head" "stage" "controls" "note";
    grid-template-rows: none;
    margin-top: 5rem;
    padding: 1.75rem 1rem 1.5rem;
    border-radius: 1.5rem;
  }

  /* The stage runs to the card's edges on a phone. */
  .packlab__stage {
    margin: 1.5rem -1rem 0;
    border-width: 1px 0;
    border-radius: 0;
    aspect-ratio: 1 / 1.05;
  }

  .packlab__controls {
    gap: 1.4rem;
    margin-top: 1.5rem;
  }

  .packlab__shapes {
    gap: 0.4rem;
  }

  .packlab__shape {
    padding: 0 0.8rem 0 0.65rem;
  }

  /* One row of swatches that scrolls sideways. */
  .packlab__skus {
    display: flex;
    gap: 0.6rem;
    margin: 0 -1rem;
    padding: 0.35rem 1rem;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }

  .packlab__skus::-webkit-scrollbar {
    display: none;
  }

  .packlab__sku {
    flex: none;
    width: 5.5rem;
    scroll-snap-align: start;
  }

  .packlab__note {
    margin-top: 1.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .packlab,
  .packlab__canvas,
  .packlab__hint {
    transition: none;
  }

  .packlab__loading {
    animation: none;
  }
}
</style>
