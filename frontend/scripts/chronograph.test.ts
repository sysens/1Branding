import { expect, test } from "bun:test";
import { LOOP_SECONDS, poseAt } from "../app/utils/chronograph/timeline";

test("the reference loop closes without an angular jump", () => {
  const start = poseAt(0), end = poseAt(LOOP_SECONDS);
  for (const hand of ["hour", "minute", "second"] as const) {
    expect((end[hand] - start[hand]) % 360).toBe(0);
    expect(Math.abs(end[hand] - poseAt(LOOP_SECONDS - 0.001)[hand])).toBeLessThan(1);
  }
});
test("hands advance continuously through both acceleration segments", () => {
  let before = poseAt(0);
  for (let time = 1/120; time <= 16; time += 1/120) {
    const after = poseAt(time);
    for (const hand of ["hour", "minute", "second"] as const) {
      expect(after[hand]).toBeGreaterThanOrEqual(before[hand]);
      expect(Number.isFinite(after[hand])).toBe(true);
    }
    before = after;
  }
});

test("the clock uses the One Branding palette", async () => {
  const { PRIMARY_LIGHT, SECONDARY_LIGHT } = await import("../app/utils/chronograph/palette");
  expect(PRIMARY_LIGHT).toEqual([3, 203, 0]);
  expect(SECONDARY_LIGHT[1]).toBeGreaterThan(SECONDARY_LIGHT[0]);
});

