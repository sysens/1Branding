import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { W1280_IMAGES } from "../app/utils/responsiveImage";

// Phone-sized copies: 1280px /home images (w1280Srcset) and 200x100 hero
// marquee logos (LogoMarquee srcset).
const w1280 = resolve("public/home/w1280");
await mkdir(w1280, { recursive: true });
for (const path of W1280_IMAGES) {
  const name = path.replace("/home/", "");
  await sharp(resolve("public/home", name)).resize({ width: 1280 }).webp({ quality: 80, effort: 6 })
    .toFile(resolve(w1280, name));
}

const thumbs = resolve("public/logoss/thumbs");
const thumbsSm = resolve("public/logoss/thumbs-sm");
await mkdir(thumbsSm, { recursive: true });
const logos = (await readdir(thumbs)).filter((name) => name.endsWith(".webp"));
for (const name of logos) {
  await sharp(resolve(thumbs, name)).resize(200, 100, { fit: "cover" }).webp({ quality: 80, effort: 6 })
    .toFile(resolve(thumbsSm, name));
}
console.log(`Prepared ${W1280_IMAGES.length} 1280px images and ${logos.length} 200px logo thumbnails.`);
