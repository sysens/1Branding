// Responsive AVIF + WebP copies of the landing's images, made at build time so
// the server never resizes on request (the /_ipx path did, and a cache miss
// took seconds).
//
// Usage: node scripts/optimize-images.mjs
//
// For every source in SOURCES it writes public/opt/<dir>/<name>.<hash>-<width>.avif
// and .webp for each width of the source's ladder (never wider than the source),
// and records the source in app/utils/optImages.json: its size, the widths, the
// content hash (in the file names, so the files can be cached forever) and, for
// opaque photos, a tiny blurred preview (data URI) shown until the image loads.
// Unchanged sources are skipped; copies of an older version are deleted.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const OUT = join(PUBLIC, "opt");
const MANIFEST = join(ROOT, "app", "utils", "optImages.json");

// dir: under /public. widths: the ladder (the source width is always added as
// the top step). alpha: keep transparency (no preview, higher quality so the
// edges stay clean).
const SOURCES = [
  { dir: "home/threeLayerLocal", widths: [480, 640, 960, 1280] },
  { dir: "home/identity", widths: [480, 720, 960] },
  { dir: "home/social", widths: [360] },
  { dir: "home/awards/artwork", widths: [208] },
  { dir: "home/awards", widths: [683], files: ["stage.v1.webp", "stage-ceiling.v1.webp"], alpha: true },
  { dir: "home/parts", widths: [], alpha: true },
  { dir: "logoss/thumbs", widths: [200] },
  { dir: "globe", widths: [580], files: ["preview-green.v1.webp", "preview.v1.webp"] },
  { dir: "home", widths: [480, 800, 1200, 1600], files: ["frenk.webp", "Frame331.jpg", "scene.jpg"] },
  { dir: "home/w1280", widths: [480, 800], files: ["Quaker.webp"] },
];

const PHOTO = { avif: { quality: 55, effort: 6, chromaSubsampling: "4:2:0" }, webp: { quality: 80, effort: 6 } };
const ALPHA = { avif: { quality: 72, effort: 6, chromaSubsampling: "4:4:4" }, webp: { quality: 90, alphaQuality: 100, effort: 6 } };

const manifest = JSON.parse(await readFile(MANIFEST, "utf8").catch(() => "{}"));
let made = 0;
let kept = 0;

for (const source of SOURCES) {
  const dir = join(PUBLIC, source.dir);
  const names = source.files ?? (await readdir(dir)).filter((name) => /\.(webp|png|jpe?g)$/i.test(name));
  const outDir = join(OUT, source.dir);
  await mkdir(outDir, { recursive: true });
  const existing = new Set(await readdir(outDir));

  for (const name of names) {
    const file = join(dir, name);
    if (!(await stat(file)).isFile()) continue;
    const buffer = await readFile(file);
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 8);
    const stem = basename(name, extname(name));
    const key = `/${source.dir}/${name}`;
    const meta = await sharp(buffer).metadata();
    const hasAlpha = Boolean(source.alpha && meta.hasAlpha);
    const widths = [...new Set([...source.widths.filter((w) => w < meta.width), meta.width])].sort((a, b) => a - b);
    const settings = hasAlpha ? ALPHA : PHOTO;

    for (const width of widths) {
      for (const format of ["avif", "webp"]) {
        const out = `${stem}.${hash}-${width}.${format}`;
        if (existing.has(out)) { kept++; continue; }
        await sharp(buffer).resize({ width, withoutEnlargement: true })[format](settings[format]).toFile(join(outDir, out));
        made++;
      }
    }
    // Copies of an older version of this source.
    for (const old of existing) {
      if (old.startsWith(`${stem}.`) && !old.startsWith(`${stem}.${hash}-`)) await rm(join(outDir, old));
    }

    const entry = { w: meta.width, h: meta.height, v: hash, widths };
    if (hasAlpha) entry.alpha = true;
    else {
      const preview = await sharp(buffer).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
      entry.lqip = `data:image/webp;base64,${preview.toString("base64")}`;
    }
    manifest[key] = entry;
  }
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 1)}\n`);
console.log(`optimize-images: ${made} files written, ${kept} up to date, ${Object.keys(sorted).length} sources in the manifest.`);
