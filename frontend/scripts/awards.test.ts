import { describe, expect, test } from "bun:test";
import { AWARD_ROWS, CARD_HEIGHT, CARD_WIDTH, STAGE_WIDTH, getCardPosition, artworkSource } from "../app/utils/awards/layout";
import { createAwardNumeral } from "../app/utils/awards/scenery";
import { CEILING_CENTERS, ceilingCurveY, createStageLights } from "../app/utils/awards/ceiling";

describe("awards stage", () => {
  test("seven rows have uniform card proportions and wider gaps", () => {
    expect(AWARD_ROWS.length).toBe(7);
    expect(AWARD_ROWS.slice(0, 4).map(row => row.direction)).toEqual(["left", "right", "right", "left"]);
    for (const row of AWARD_ROWS) {
      expect(row.height / row.width).toBeCloseTo(CARD_HEIGHT / CARD_WIDTH, 8);
      expect(row.gap).toBeGreaterThanOrEqual(row.width * .19);
      expect(row.count * (row.width + row.gap)).toBeGreaterThan(STAGE_WIDTH + row.width * 2);
      if (row.index) expect(row.width).toBeGreaterThan(AWARD_ROWS[row.index - 1]!.width);
    }
  });
  test("each row moves in its own direction and loops without a visible seam", () => {
    for (const row of AWARD_ROWS) {
      const period = row.count * (row.width + row.gap);
      const before = getCardPosition(row, 0, 0);
      const after = getCardPosition(row, 0, .1);
      expect(Math.sign(after.x - before.x)).toBe(row.direction === "left" ? -1 : 1);
      expect(getCardPosition(row, 0, period / row.speed).x).toBeCloseTo(before.x, 7);
      for (let column = 0; column < row.count; column++) {
        const position = getCardPosition(row, column, 100000);
        expect(Math.abs(position.x)).toBeLessThanOrEqual(period / 2);
        expect(artworkSource(row.index, column)).toMatch(/^\/home\/awards\/artwork\/\d+\.webp$/);
      }
    }
  });
  test("the crescent bows down at both sides and keeps neighboring cards separated", () => {
    for (const row of AWARD_ROWS) {
      const positions = Array.from({length:row.count}, (_, column) => getCardPosition(row, column, 3)).sort((a,b) => a.x-b.x);
      const center = [...positions].sort((a,b) => Math.abs(a.x)-Math.abs(b.x))[0]!;
      expect(positions[0]!.y).toBeGreaterThan(center.y);
      expect(positions.at(-1)!.y).toBeGreaterThan(center.y);
      for (let i=1; i<positions.length; i++) expect(positions[i]!.x-positions[i-1]!.x).toBeCloseTo(row.width+row.gap,7);
    }
  });
  test("numeral has beveled depth and finite gradient vertices", () => {
    const numeral = createAwardNumeral();
    numeral.geometry.computeBoundingBox();
    const box = numeral.geometry.boundingBox!;
    expect(box.max.z - box.min.z).toBeGreaterThan(14);
    expect(box.max.y - box.min.y).toBeGreaterThan(320);
    for (const number of numeral.geometry.getAttribute("position").array) expect(Number.isFinite(number)).toBe(true);
    numeral.geometry.dispose(); numeral.material.dispose();
  });
  test("curved ceiling contains thirteen illuminated ribbons", () => {
    const lights = createStageLights();
    expect(lights.children.length).toBe(13);
  });
  test("ceiling spacing compresses toward the gallery and curves soften with depth", () => {
    const scale = STAGE_WIDTH / 1325;
    const gaps = CEILING_CENTERS.slice(1).map((height, index) => height - CEILING_CENTERS[index]!);
    expect(gaps[0]! / scale).toBeCloseTo(26, 6);
    expect(gaps[5]! / scale).toBeCloseTo(13, 6);
    for (let index = 1; index < gaps.length; index++) expect(gaps[index]!).toBeLessThan(gaps[index - 1]!);
    for (let row = 0; row < CEILING_CENTERS.length; row++) {
      expect(ceilingCurveY(row, 0)).toBe(CEILING_CENTERS[row]!);
      expect(ceilingCurveY(row, -400)).toBe(ceilingCurveY(row, 400));
      expect(ceilingCurveY(row, 400)).toBeLessThan(ceilingCurveY(row, 200));
      expect(Number.isFinite(ceilingCurveY(row, 760))).toBe(true);
    }
    const rise = (row: number) => CEILING_CENTERS[row]! - ceilingCurveY(row, 500 * scale);
    expect(rise(1) / scale).toBeCloseTo(100.5, 0);
    expect(rise(6) / scale).toBeCloseTo(74.5, 0);
    expect(rise(12)).toBeLessThan(rise(6));
  });
});
