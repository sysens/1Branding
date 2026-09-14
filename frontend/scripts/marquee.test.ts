import { expect, test } from "bun:test";
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { createTileFace, createTileShape, toPlane } from "../app/utils/marquee/geometry";
import { ATLAS_HEIGHT, ATLAS_WIDTH, MARQUEE_TILES, MARQUEE_TILT, type MarqueePoint } from "../app/utils/marquee/layout";
import { marqueeLane, marqueeVerticalOffset } from "../app/utils/marquee/motion";

test("original mosaic columns start in place and preserve adjoining notches", () => {
  for (const tile of MARQUEE_TILES) expect(marqueeVerticalOffset(marqueeLane(tile.id), 0)).toBeCloseTo(0);
  expect(marqueeLane("hilal")).toBe(marqueeLane("cleo"));
  expect(marqueeLane("cleo")).toBe(marqueeLane("luqman"));
  expect(marqueeLane("brono")).toBe(marqueeLane("merhaba"));
});

test("projected tile vertices match the design's source coordinates", () => {
  for (const tile of MARQUEE_TILES) {
    for (const point of tile.points) {
      const { x, y } = toPlane(point);
      expect((x - y) / Math.SQRT2 + ATLAS_WIDTH / 2).toBeCloseTo(point[0], 8);
      expect(-Math.cos(MARQUEE_TILT) * (x + y) / Math.SQRT2 + ATLAS_HEIGHT / 2).toBeCloseTo(point[1], 8);
    }
  }
});

test("atlas and standalone image coordinates are finite and remain inside the texture", () => {
  expect(new Set(MARQUEE_TILES.map(tile => tile.id)).size).toBe(MARQUEE_TILES.length);
  for (const tile of MARQUEE_TILES) {
    for (const atlas of [true, false]) {
      const geometry = createTileFace(createTileShape(tile.points), atlas);
      expect(geometry.index!.count).toBeGreaterThan(6);
      const uv = geometry.getAttribute("uv");
      for (let i = 0; i < uv.count; i++) {
        expect(uv.getX(i)).toBeGreaterThanOrEqual(-0.00001);
        expect(uv.getX(i)).toBeLessThanOrEqual(1.00001);
        expect(uv.getY(i)).toBeGreaterThanOrEqual(-0.00001);
        expect(uv.getY(i)).toBeLessThanOrEqual(1.00001);
      }
      geometry.dispose();
    }
  }
});

function hits(id: string, point: MarqueePoint): boolean {
  const tile = MARQUEE_TILES.find(tile => tile.id === id)!;
  const geometry = createTileFace(createTileShape(tile.points), true);
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const mesh = new Mesh(geometry, material);
  const p = toPlane(point);
  const ray = new Raycaster(new Vector3(p.x, p.y, 10), new Vector3(0, 0, -1));
  mesh.updateMatrixWorld();
  const result = ray.intersectObject(mesh).length > 0;
  geometry.dispose();
  material.dispose();
  return result;
}

test("Hilal and Cleo retain concave corners and Luqman fills the lower opening", () => {
  expect(hits("hilal", [850, 130])).toBe(false);
  expect(hits("hilal", [850, 200])).toBe(true);
  expect(hits("cleo", [1260, 358])).toBe(false);
  expect(hits("cleo", [1260, 290])).toBe(true);
  expect(hits("luqman", [1260, 358])).toBe(true);
});

test("reference texture is bundled locally and does not require a large image download", async () => {
  const asset = Bun.file(new URL("../public/home/marquee/reference.v1.webp", import.meta.url));
  expect(await asset.exists()).toBe(true);
  expect(asset.size).toBeLessThan(200_000);
});
