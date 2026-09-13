import { expect, test } from "bun:test";
import { Color, LineSegments, Points, Uniform } from "three";
import { parseGlobePositions } from "../app/utils/globe/assets";
import { createWorldSurface } from "../app/utils/globe/surface";
import { createOrbitalNetwork } from "../app/utils/globe/orbits";

test("world outlines are compact, complete line pairs on the same globe surface", async () => {
  const file = Bun.file(new URL("../public/globe/outlines.v1.bin", import.meta.url));
  const outlines = parseGlobePositions(await file.arrayBuffer(), 512_000, 24);
  expect(outlines.length / 6).toBeGreaterThan(7000);
  expect(file.size).toBeLessThan(200_000);
  for (let i = 0; i < outlines.length; i += 3)
    expect(Math.hypot(outlines[i]!, outlines[i + 1]!, outlines[i + 2]!)).toBeCloseTo(1.004, 5);
});

test("globe assets reject malformed or non-finite coordinates before allocating GPU buffers", () => {
  expect(() => parseGlobePositions(new ArrayBuffer(0), 512_000)).toThrow();
  expect(() => parseGlobePositions(new ArrayBuffer(13), 512_000)).toThrow();
  expect(() => parseGlobePositions(new ArrayBuffer(48), 24)).toThrow();
  expect(() => parseGlobePositions(new Float32Array([NaN, 0, 1]).buffer, 512_000)).toThrow();
  expect(() => parseGlobePositions(new Float32Array([0, 0, 10]).buffer, 512_000)).toThrow();
  expect(() => parseGlobePositions(new Float32Array([0, 0, 1.004]).buffer, 512_000, 24)).toThrow();
});

test("the globe keeps distinct land, ocean dots and green geographic outlines", async () => {
  const land = parseGlobePositions(await Bun.file(new URL("../public/globe/land-points.v1.bin", import.meta.url)).arrayBuffer(), 512_000);
  const outlines = parseGlobePositions(await Bun.file(new URL("../public/globe/outlines.v1.bin", import.meta.url)).arrayBuffer(), 512_000, 24);
  const surface = createWorldSurface(land, outlines, new Uniform(1));
  expect(surface.children.filter(child => child instanceof Points).length).toBe(3);
  expect(surface.children.filter(child => child instanceof LineSegments).length).toBe(1);
  surface.traverse(child => {
    if (!(child instanceof Points || child instanceof LineSegments)) return;
    const positions = child.geometry.getAttribute("position");
    expect(positions.count).toBeGreaterThan(3000);
    for (let i = 0; i < positions.count; i++)
      expect(Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i))).toBeGreaterThan(1);
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if ("color" in material && material.color instanceof Color) expect(material.color.g).toBeGreaterThan(material.color.r);
      material.dispose();
    }
    child.geometry.dispose();
  });
});

test("orbital lights animate above the surface without changing their radius", () => {
  const network = createOrbitalNetwork();
  network.update(0);
  const lights: Points[] = [];
  network.group.traverse(child => { if (child instanceof Points) lights.push(child); });
  expect(lights.length).toBe(3);
  const before = lights.map(light => Array.from(light.geometry.getAttribute("position").array));
  network.update(3);
  lights.forEach((light, index) => {
    const positions = light.geometry.getAttribute("position");
    expect(Array.from(positions.array)).not.toEqual(before[index]);
    for (let i = 0; i < positions.count; i++)
      expect(Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i))).toBeCloseTo(1.045 + index * .012, 5);
  });
});
