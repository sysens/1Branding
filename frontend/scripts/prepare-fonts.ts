import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

// Trims the SF Pro WOFF2 files to the characters the site's languages use:
// Russian and English, Uzbek (Latin and Cyrillic), the Turkish letters of the
// Istanbul office, punctuation, currency signs and arrows. The dropped Latin /
// Cyrillic Extended and Greek glyphs were ~25% of every file, and all weights
// are requested before the first paint. Characters outside this set still
// render, in the system fallback font.
//
// Needs fontTools (`pip install fonttools brotli`); the npm subset-font package
// drops the cmap table of these CFF fonts. Re-running on trimmed files is harmless.
const UNICODES = [
  "U+0020-007E", "U+00A0-00FF", // Basic Latin, Latin-1
  "U+011E-011F", "U+0130-0131", "U+015E-015F", // Ğ ğ İ ı Ş ş
  "U+02BB-02BC", "U+02C6", "U+02DA", "U+02DC", // ʻ ʼ ˆ ˚ ˜
  "U+0400-045F", // Cyrillic
  "U+0490-0493", "U+049A-049B", "U+04AE-04AF", "U+04B2-04B3", "U+04E8-04E9", // Ґ Ғ Қ Ү Ҳ Ө
  "U+2000-206F", "U+20A0-20C0", "U+2100-214F", // punctuation, currency, №/™
  "U+2190-2199", "U+2212", "U+2248", "U+2260", "U+2264-2265",
].join(",");

const dir = resolve("public/fonts");
for (const name of (await readdir(dir)).filter((file) => file.endsWith(".woff2"))) {
  const path = resolve(dir, name);
  const result = spawnSync("pyftsubset", [
    path, `--unicodes=${UNICODES}`, "--layout-features=*", "--flavor=woff2", `--output-file=${path}`,
  ], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`pyftsubset failed for ${name}`);
  console.log(`Subset ${name}`);
}
