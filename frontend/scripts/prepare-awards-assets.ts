import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { AWARD_ARTWORK_IDS } from "../app/utils/awards/layout";

const output = resolve("public/home/awards/artwork");
await mkdir(output, { recursive: true });
for (const id of AWARD_ARTWORK_IDS) {
  await sharp(resolve(`public/home/threeLayerLocal/${id}.webp`))
    .resize(416, 234, { fit: "cover" }).webp({ quality: 82 })
    .toFile(resolve(output, `${id}.webp`));
}
console.log(`Prepared ${AWARD_ARTWORK_IDS.length} HTML gallery images.`);
