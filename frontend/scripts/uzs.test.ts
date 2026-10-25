import { describe, expect, test } from "bun:test";
import { formatRate, formatRateDate, uzsAmount } from "../app/utils/uzs";
import { parseCbuRate } from "../server/utils/usdRate";

const RATE = 11838.92;

describe("prices in so'm", () => {
  test("rounds to tenths of a million, or tens of thousands below a million", () => {
    expect(uzsAmount(5900, RATE, "en")).toEqual({ unit: "million", amount: "69.8" });
    expect(uzsAmount(900, RATE, "ru")).toEqual({ unit: "million", amount: "10,7" });
    expect(uzsAmount(99, RATE, "uz")).toEqual({ unit: "million", amount: "1,2" });
    expect(uzsAmount(65, RATE, "en")).toEqual({ unit: "thousand", amount: "770" });
    expect(uzsAmount(35, RATE, "en")).toEqual({ unit: "thousand", amount: "410" });
    // 999 995 rounds up to a million, not to "1000 thousand".
    expect(uzsAmount(999_995, 1, "en")).toEqual({ unit: "million", amount: "1.0" });
    expect(uzsAmount(100_000, RATE, "ru")).toEqual({ unit: "million", amount: "1 183,9" });
  });

  test("shows nothing without a price or a rate", () => {
    expect(uzsAmount(Number.NaN, RATE, "en")).toBeNull();
    expect(uzsAmount(900, 0, "en")).toBeNull();
  });

  test("prints the rate and its date as the bank gives them", () => {
    expect(formatRate(RATE, "en")).toBe("11,838.92");
    expect(formatRate(RATE, "uz")).toBe("11 838,92");
    expect(formatRateDate("2026-10-24")).toBe("24.10.2026");
  });

  test("reads the Central Bank's answer", () => {
    expect(parseCbuRate([{ Ccy: "USD", Rate: "11838.92", Date: "24.10.2026" }])).toEqual({ rate: RATE, date: "2026-10-24" });
    expect(parseCbuRate([{ Ccy: "EUR", Rate: "13000", Date: "24.10.2026" }])).toBeNull();
    expect(parseCbuRate([{ Ccy: "USD", Rate: "", Date: "24.10.2026" }])).toBeNull();
    expect(parseCbuRate("<html>")).toBeNull();
  });
});
