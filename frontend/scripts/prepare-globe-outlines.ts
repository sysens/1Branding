import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { globePoint } from "../app/utils/globe/geography";

const require = createRequire(import.meta.url);
const topology: Topology<{ countries: GeometryCollection }> = await Bun.file(
  require.resolve("world-atlas/countries-110m.json"),
).json();
const outlines = mesh(topology, topology.objects.countries);
const coordinates: number[] = [];
for (const line of outlines.coordinates) {
  for (let index = 1; index < line.length; index++) {
    const from = line[index - 1]!;
    const to = line[index]!;
    coordinates.push(...globePoint([from[1]!, from[0]!], 1.004));
    coordinates.push(...globePoint([to[1]!, to[0]!], 1.004));
  }
}
const output = new URL("../public/globe/outlines.v1.bin", import.meta.url);
await mkdir(new URL("../public/globe/", import.meta.url), { recursive: true });
const data = Buffer.alloc(coordinates.length * 4);
coordinates.forEach((value, index) => data.writeFloatLE(value, index * 4));
await writeFile(output, data);
console.log(`Generated ${coordinates.length / 6} globe outline segments (${data.length} bytes).`);
