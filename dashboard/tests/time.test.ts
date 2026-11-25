// Working-hours arithmetic (first response speed, the 15-minute reminder).
import { describe, expect, test } from "bun:test";
import { DEFAULT_SCHEDULE, isWorkingTime, previousPeriod, tashkentDay, workingMsBetween } from "../shared/utils/time";

const at = (local: string) => Date.parse(`${local}+05:00`);
const min = 60_000;

describe("Tashkent working hours (Mon–Fri 10:00–19:00)", () => {
  test("inside one working day", () => {
    expect(workingMsBetween(at("2026-11-23T10:00:00"), at("2026-11-23T10:15:00"))).toBe(15 * min);
  });
  test("a lead at night is counted from 10:00", () => {
    expect(workingMsBetween(at("2026-11-23T02:00:00"), at("2026-11-23T10:10:00"))).toBe(10 * min);
  });
  test("Friday evening to Monday morning skips the weekend", () => {
    expect(workingMsBetween(at("2026-11-27T18:50:00"), at("2026-11-30T10:05:00"))).toBe(15 * min);
  });
  test("Saturday is not working time", () => {
    expect(isWorkingTime(at("2026-11-28T12:00:00"), DEFAULT_SCHEDULE)).toBe(false);
    expect(isWorkingTime(at("2026-11-27T12:00:00"), DEFAULT_SCHEDULE)).toBe(true);
  });
  test("the day in Tashkent, not in UTC", () => {
    expect(tashkentDay(Date.parse("2026-11-23T20:30:00Z"))).toBe("2026-11-24");
  });
  test("the previous period has the same length", () => {
    expect(previousPeriod("2026-11-01", "2026-11-30")).toEqual({ from: "2026-10-02", to: "2026-10-31" });
  });
});
