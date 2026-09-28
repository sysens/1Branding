import { expect, test } from "bun:test";
import { createCursorTrails, stepCursorTrails } from "../app/utils/cursorTrails";
import { createStarField } from "../app/utils/globe/stars";

test("cursor spring trails stay finite and settle at the actual pointer", () => {
  const trails = createCursorTrails(0, 0);
  expect(trails.length).toBe(20);
  expect(trails[0]?.nodes.length).toBe(50);
  for (let frame = 0; frame < 1500; frame++) stepCursorTrails(trails, 720, 360);
  for (const trail of trails) for (const node of trail.nodes) {
    expect(node.x).toBeCloseTo(720, 1);
    expect(node.y).toBeCloseTo(360, 1);
  }
});
test("world star field contains bright stars outside the globe and animated light", () => {
  const field = createStarField();
  const positions = field.points.geometry.getAttribute("position");
  expect(positions.count).toBe(5200);
  let exterior = 0;
  for (let i = 0; i < positions.count; i++) {
    expect(Number.isFinite(positions.getZ(i))).toBe(true);
    if (Math.hypot(positions.getX(i), positions.getY(i)) > 1.4) exterior++;
  }
  expect(exterior).toBeGreaterThan(2000);
  field.update(5);
  expect(field.points.material.uniforms.time?.value).toBe(5);
  field.points.geometry.dispose(); field.points.material.dispose();
});
