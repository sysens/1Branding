// Regenerates public/home/marquee/light.webp, the light over the project marquee.
// PROFILE holds colours measured on the design file ("new onebranding site"), in
// four columns (side edge, 1/8, 1/4 and centre of the width) every 2% of height.
// Run: bun scripts/prepare-marquee-light.ts
import sharp from "sharp";

const PROFILE: Record<"edge" | "eighth" | "quarter" | "center", string[]> = {
  "edge": [
    "#fefcfb",
    "#fefdf9",
    "#fffefa",
    "#fefdf9",
    "#fffefa",
    "#fefdf5",
    "#fffdf1",
    "#fffbea",
    "#fefbe5",
    "#fffbdf",
    "#fdfad5",
    "#fefac9",
    "#fdfbbf",
    "#f7fab2",
    "#f3faa8",
    "#eff799",
    "#e7f68b",
    "#def27c",
    "#d7f06f",
    "#cbec5d",
    "#bfe54d",
    "#afe03e",
    "#9fda33",
    "#96d428",
    "#85cb1b",
    "#73c20e",
    "#67be08",
    "#57b400",
    "#45aa00",
    "#29a400",
    "#149b03",
    "#019401",
    "#008900",
    "#018001",
    "#017900",
    "#017000",
    "#026400",
    "#045b01",
    "#24691c",
    "#26540c",
    "#053604",
    "#042d05",
    "#041f02",
    "#021103",
    "#030303",
    "#060606",
    "#000000",
    "#020202",
    "#020301",
    "#030301"
  ],
  "eighth": [
    "#fefcfb",
    "#fffefa",
    "#fefdf9",
    "#fffefa",
    "#fefef3",
    "#fffdf1",
    "#fffbea",
    "#fefbe3",
    "#fffbdd",
    "#fdfbd1",
    "#fefbc7",
    "#fbfabb",
    "#f7fab0",
    "#f4f8a3",
    "#eff592",
    "#e9f385",
    "#e2ef76",
    "#d8eb67",
    "#cde45b",
    "#c0df4a",
    "#b1d73f",
    "#a1d031",
    "#91c725",
    "#84bd1b",
    "#72b516",
    "#63af11",
    "#53a80c",
    "#43a00c",
    "#2c9404",
    "#0c8b00",
    "#018302",
    "#017701",
    "#056c03",
    "#085e01",
    "#034e00",
    "#084503",
    "#11420c",
    "#012300",
    "#051e05",
    "#001410",
    "#000d11",
    "#000a14",
    "#000716",
    "#010719",
    "#000618",
    "#01061b",
    "#0d0d0d",
    "#000000",
    "#010200",
    "#630701"
  ],
  "quarter": [
    "#fffefa",
    "#fffefa",
    "#fffefa",
    "#fefef3",
    "#fffcef",
    "#fffbea",
    "#fffbe1",
    "#fefbda",
    "#fdfbce",
    "#fdfac4",
    "#fdfab9",
    "#fbf7ab",
    "#f8f6a0",
    "#f1f491",
    "#e9ef80",
    "#e2e973",
    "#d9e564",
    "#c9db53",
    "#bfd348",
    "#adcb3d",
    "#a2c334",
    "#8eba29",
    "#82b323",
    "#6eac1c",
    "#5fa01b",
    "#519a17",
    "#428f15",
    "#247f07",
    "#0e7402",
    "#006401",
    "#005600",
    "#004502",
    "#013700",
    "#002904",
    "#021e07",
    "#081b0e",
    "#0a1310",
    "#0a0c10",
    "#16171b",
    "#2a0e13",
    "#2b080a",
    "#3c2f02",
    "#423005",
    "#2a1c25",
    "#161926",
    "#323848",
    "#515662",
    "#616572",
    "#1b1e2a",
    "#111111"
  ],
  "center": [
    "#fffefa",
    "#fffef8",
    "#fefef3",
    "#fffbef",
    "#fffbe8",
    "#fffbe1",
    "#fefbda",
    "#fdfbd1",
    "#fefbc5",
    "#fdfab7",
    "#fbf8ad",
    "#f6f6a0",
    "#f3f38f",
    "#eaee82",
    "#e2ea73",
    "#d7e064",
    "#ced959",
    "#c0cf4d",
    "#b0c541",
    "#9ebb32",
    "#8cb22c",
    "#7cad28",
    "#69a022",
    "#59951d",
    "#4b8b1c",
    "#387b12",
    "#236b0a",
    "#0c5c03",
    "#014d01",
    "#013d00",
    "#002c00",
    "#001c00",
    "#000e00",
    "#000801",
    "#090705",
    "#0a0603",
    "#0a0b08",
    "#010101",
    "#000000",
    "#010101",
    "#060605",
    "#1a110e",
    "#060706",
    "#070707",
    "#020202",
    "#020202",
    "#020202",
    "#030303",
    "#030303",
    "#030303"
  ]
};
const output = "public/home/marquee/light.webp";
const toRows = (hexes: string[]) => hexes.map((hex, i): [number, string] => [i * 2, hex]);
const profile = { edge: toRows(PROFILE.edge), eighth: toRows(PROFILE.eighth), quarter: toRows(PROFILE.quarter), center: toRows(PROFILE.center) };

const W = 1200, H = Math.round(1200 * 942 / 1983);

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
// Columns by normalised distance from the centre line (0 = centre, 1 = side edge).
type Column = { d: number; cardLine: number; rows: [number, string][]; colors?: number[][] };
const columns: Column[] = [
  { d: 0, cardLine: 0.66, rows: profile.center },
  { d: 0.5, cardLine: 0.69, rows: profile.quarter },
  { d: 0.75, cardLine: 0.73, rows: profile.eighth },
  { d: 0.94, cardLine: 0.75, rows: profile.edge },
];
for (const column of columns) column.colors = column.rows.map(([, hex]) => rgb(hex));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => lerp(v, b[i]!, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Colour of one measured column at height y (0..1), clamped to the card line.
const columnColor = (column: Column, y: number): number[] => {
  const colors = column.colors!;
  const yy = Math.min(y, column.cardLine) * 100 / 2;
  const i = Math.min(Math.floor(yy), colors.length - 2);
  return mix(colors[i]!, colors[i + 1]!, yy - i);
};

// Monotone cubic (Fritsch-Carlson) through the column samples along d, with a
// flat tangent at the centre line (the light is symmetric): no kinks, no
// overshoot, so the arc bends smoothly from the centre to the sides.
const monotone = (xs: number[], ys: number[]) => {
  const n = xs.length, dx: number[] = [], m: number[] = [], t: number[] = new Array(n);
  for (let i = 0; i < n - 1; i++) { dx.push(xs[i + 1] - xs[i]); m.push((ys[i + 1] - ys[i]) / dx[i]); }
  t[0] = 0;
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  t[n - 1] = m[n - 2];
  return (x: number): number => {
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = dx[i], s = (x - xs[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * t[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * t[i + 1];
  };
};
const ds = columns.map((c) => c.d);
const cardLineAt = monotone(ds, columns.map((c) => c.cardLine));
const sampleAt = (y: number, d: number) => [0, 1, 2].map((ch) => monotone(ds, columns.map((c) => columnColor(c, y)[ch]))(d));

const pixels = Buffer.alloc(W * H * 4);
let seed = 7;
const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };

for (let py = 0; py < H; py++) {
  const y = py / (H - 1);
  const row: [number[], number][] = [];
  // One spline per row, evaluated for every x (the colour only depends on d).
  for (let px = 0; px < W; px++) {
    const d = Math.min(1, Math.abs(px / (W - 1) - 0.5) * 2);
    const cardLine = cardLineAt(d);
    let color = sampleAt(Math.min(y, cardLine), d);
    let alpha = 1;
    if (y > cardLine) {
      // Veil over the cards: eases from opaque at the card line to fully clear at
      // the bottom edge (no seam where the image ends) while its colour sinks
      // towards black (dark green at the sides).
      const k = (y - cardLine) / (1 - cardLine);
      alpha = Math.pow(1 - smooth(k), 1.25);
      color = color.map((v) => v * Math.pow(1 - k, 1.4));
    }
    row.push([color, alpha]);
  }
  for (let px = 0; px < W; px++) {
    const [color, alpha] = row[px]!;
    const o = (py * W + px) * 4;
    // ±0.5 LSB of noise keeps the long gradients free of banding.
    pixels[o] = Math.max(0, Math.min(255, Math.round(color[0] + noise())));
    pixels[o + 1] = Math.max(0, Math.min(255, Math.round(color[1] + noise())));
    pixels[o + 2] = Math.max(0, Math.min(255, Math.round(color[2] + noise())));
    pixels[o + 3] = Math.round(alpha * 255);
  }
}

await sharp(pixels, { raw: { width: W, height: H, channels: 4 } })
  .webp({ quality: 90, alphaQuality: 90, effort: 6, smartSubsample: true })
  .toFile(output);
console.log(`Prepared ${output} (${W}x${H}).`);
