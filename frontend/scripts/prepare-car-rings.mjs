// The racing car's tyre rings as a mask (GuaranteeSpeed.vue): white where the
// picture shows a tyre's painted green ring, black elsewhere. The section's
// shader runs lights round the rings and dims them between the lights; the
// track's green lies a pixel or two from a ring in places, so the rings are
// taken from the picture itself, to the pixel, not from a drawn shape.
//
// Usage: node scripts/prepare-car-rings.mjs   (after replacing car.webp, whose
// wheels are then to be measured anew: WHEELS, here and in the component)
//
// A ring's pixels are green, not burnt white, and lie about the wheel's
// ellipse. They are gathered into connected groups, and a group is kept when
// it sits on the ellipse's band: that drops the track seen past a tyre and
// the reflections under it.
import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE = join(ROOT, "public", "one-guarantee-page", "car.webp");
// In its own folder: scripts/optimize-images.mjs takes every picture that lies
// directly in one-guarantee-page/, and the mask is served as it is.
const OUT = join(ROOT, "public", "one-guarantee-page", "masks", "car-rings.png");

// Each ring's centre and half-axes, as shares of the picture's width and
// height (x right, y up), as in the component. `reach` is how far out from
// the centre (1 = the ellipse) the ring's pixels are looked for, by the angle
// in degrees (0 = right, 90 = up).
const WHEELS = [
  {
    // The rear wheel: the lit track stands right against its upper left, so
    // the reach there ends at the ring's own edge.
    ring: [0.2926, 0.5006, 0.0066, 0.0583],
    reach: (angle) => (angle <= 50 ? 1.12 : angle <= 100 ? 1.02 : angle <= 180 ? 1.02 + ((angle - 100) / 80) * 0.07 : 1.09),
  },
  { ring: [0.3929, 0.4679, 0.0121, 0.0814], reach: () => 1.3 },
  { ring: [0.6561, 0.5039, 0.0176, 0.055], reach: () => 1.3 },
];
// A ring pixel: green over red and blue by this much, and not burnt white.
const GREEN = 0.2;
const WHITE = 0.62;
// A group is kept from this many pixels, with this share of them on the band.
const GROUP_PIXELS = 9;
const BAND = [0.6, 1.15];
const BAND_SHARE = 0.4;

const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const mask = Buffer.alloc(width * height);

for (const wheel of WHEELS) {
  const cx = wheel.ring[0] * width;
  const cy = (1 - wheel.ring[1]) * height;
  const ax = wheel.ring[2] * width;
  const ay = wheel.ring[3] * height;
  const left = Math.max(0, Math.floor(cx - ax * 1.4));
  const right = Math.min(width - 1, Math.ceil(cx + ax * 1.4));
  const top = Math.max(0, Math.floor(cy - ay * 1.4));
  const bottom = Math.min(height - 1, Math.ceil(cy + ay * 1.4));
  const columns = right - left + 1;
  const rows = bottom - top + 1;
  const rho = (x, y) => Math.hypot((x - cx) / ax, (y - cy) / ay);

  const candidate = new Uint8Array(columns * rows);
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const at = (y * width + x) * 3;
      const red = data[at] / 255;
      const green = data[at + 1] / 255;
      const blue = data[at + 2] / 255;
      const other = Math.max(red, blue);
      if (green - 0.6 * other <= GREEN || other >= WHITE) continue;
      const distance = rho(x, y);
      const angle = (Math.atan2(cy - y, x - cx) * 180) / Math.PI;
      if (distance >= 0.5 && distance <= wheel.reach(angle < 0 ? angle + 360 : angle)) candidate[(y - top) * columns + (x - left)] = 1;
    }
  }

  // Connected groups (four neighbours).
  const seen = new Uint8Array(columns * rows);
  let kept = 0;
  for (let start = 0; start < candidate.length; start++) {
    if (!candidate[start] || seen[start]) continue;
    const group = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const point = stack.pop();
      group.push(point);
      const x = point % columns;
      const y = (point - x) / columns;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) continue;
        const next = ny * columns + nx;
        if (candidate[next] && !seen[next]) {
          seen[next] = 1;
          stack.push(next);
        }
      }
    }
    if (group.length < GROUP_PIXELS) continue;
    const onBand = group.filter((point) => {
      const distance = rho(left + (point % columns), top + Math.floor(point / columns));
      return distance >= BAND[0] && distance <= BAND[1];
    }).length;
    if (onBand / group.length < BAND_SHARE) continue;
    for (const point of group) mask[(top + Math.floor(point / columns)) * width + left + (point % columns)] = 255;
    kept += group.length;
  }
  console.log(`ring at ${Math.round(cx)}, ${Math.round(cy)}: ${kept} px`);
}

// A soft edge, so the lights do not end on a stair of pixels.
await mkdir(dirname(OUT), { recursive: true });
await sharp(mask, { raw: { width, height, channels: 1 } }).blur(0.6).png({ compressionLevel: 9 }).toFile(OUT);
console.log(`${OUT} (${width} x ${height})`);
