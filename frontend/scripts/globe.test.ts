import { expect, test } from "bun:test";
import { globePoint, arcPoint } from "../app/utils/globe/geography";
import { LOCATIONS, ROUTES } from "../app/utils/globe/locations";

test("geographic axes and radius are consistent", () => {
  expect(globePoint([0, 0])).toEqual([0, 0, 1]);
  expect(globePoint([90, 0])[1]).toBeCloseTo(1, 8);
  expect(globePoint([0, 90])[0]).toBeCloseTo(1, 8);
  for (const place of LOCATIONS)
    expect(Math.hypot(...globePoint(place.coordinate))).toBeCloseTo(1, 8);
});
test("every flight arc stays outside the globe and meets its destinations", () => {
  for (const [a, b] of ROUTES) {
    const from = LOCATIONS[a]!.coordinate,
      to = LOCATIONS[b]!.coordinate;
    const start = arcPoint(from, to, 0),
      origin = globePoint(from, 1.008);
    start.forEach((value, index) =>
      expect(value).toBeCloseTo(origin[index]!, 8),
    );
    for (let t = 0; t <= 1; t += 0.02) {
      const radius = Math.hypot(...arcPoint(from, to, t));
      expect(radius).toBeGreaterThanOrEqual(1.0079);
      expect(radius).toBeLessThanOrEqual(1.329);
    }
    const end = arcPoint(from, to, 1),
      target = globePoint(to, 1.008);
    end.forEach((value, index) => expect(value).toBeCloseTo(target[index]!, 8));
  }
});
test("the precomputed land asset is compact and contains valid surface positions", async () => {
  const buffer = await Bun.file(
    new URL("../public/globe/land-points.v1.bin", import.meta.url),
  ).arrayBuffer();
  expect(buffer.byteLength).toBeLessThan(100_000);
  expect(buffer.byteLength % 12).toBe(0);
  const points = new Float32Array(buffer);
  expect(points.length / 3).toBeGreaterThan(5000);
  for (let i = 0; i < points.length; i += 3)
    expect(Math.hypot(points[i]!, points[i + 1]!, points[i + 2]!)).toBeCloseTo(
      1.003,
      5,
    );
});
