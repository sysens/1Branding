import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { globePoint } from "../app/utils/globe/geography";

const require = createRequire(import.meta.url);
const topology: Topology<{ land: GeometryCollection }> = await Bun.file(
  require.resolve("world-atlas/land-110m.json"),
).json();
const land = feature(topology, topology.objects.land);
const positions: number[] = [];
const step = 1.25;
for (let latitude = -78; latitude < 84; latitude += step) {
  const longitudeStep = step / Math.cos((latitude * Math.PI) / 180);
  for (let longitude = -180; longitude < 180; longitude += longitudeStep) {
    if (geoContains(land, [longitude, latitude]))
      positions.push(...globePoint([latitude, longitude], 1.003));
  }
}
const output = new URL("../public/globe/land-points.v1.bin", import.meta.url);
await mkdir(new URL("../public/globe/", import.meta.url), { recursive: true });
const buffer = Buffer.alloc(positions.length * 4);
positions.forEach((value, index) => buffer.writeFloatLE(value, index * 4));
await writeFile(output, buffer);
console.log(
  `Generated ${positions.length / 3} land points (${buffer.length} bytes).`,
);
