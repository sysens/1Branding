import { expect, test } from "bun:test";
import { createCursorTrails, stepCursorTrails } from "../app/utils/cursorTrails";
import { Euler } from "three";
import { MARQUEE_TILT } from "../app/utils/marquee/layout";
import { marqueeLane, marqueeVerticalDirection, marqueeVerticalOffset } from "../app/utils/marquee/motion";
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
test("marquee lanes alternate vertically and preserve notched neighbours", () => {
  expect(marqueeVerticalOffset(0, 2)).toBeGreaterThan(0);
  expect(marqueeVerticalOffset(1, 2)).toBeLessThan(0);
  expect(marqueeVerticalOffset(2, 2)).toBe(marqueeVerticalOffset(0, 2));
  expect(marqueeLane("hilal")).toBe(marqueeLane("cleo"));
  expect(marqueeLane("cleo")).toBe(marqueeLane("luqman"));
  expect(marqueeLane("brono")).toBe(marqueeLane("merhaba"));
  expect(marqueeLane("merhaba")).toBe(marqueeLane("street-vibe"));
  expect(marqueeVerticalOffset(0, 8)).toBeCloseTo(0);
});
test("marquee motion stays above the backing and projects only vertically", () => {
  const direction = marqueeVerticalDirection();
  const rotation = new Euler(MARQUEE_TILT, 0, Math.PI / 4);
  for (let time = 0; time <= 36; time += .25) for (const lane of [0, 1, 2]) {
    const offset = marqueeVerticalOffset(lane, time);
    const position = direction.clone().multiplyScalar(offset);
    expect(position.z).toBeCloseTo(0, 8);
    position.applyEuler(rotation);
    expect(position.x).toBeCloseTo(0, 8);
    expect(position.y).toBeCloseTo(offset, 8);
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
