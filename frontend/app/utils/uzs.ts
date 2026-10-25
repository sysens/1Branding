import type { SiteLocale } from "./locales";

/**
 * A dollar price in so'm, short and rounded, since the rate changes every
 * day: tenths of a million ("69.8" million), or tens of thousands below a
 * million ("410" thousand). Written by hand rather than with Intl, so the
 * server and the browser print exactly the same text.
 */
export type UzsAmount = { unit: "million" | "thousand"; amount: string };

const DECIMAL: Record<SiteLocale, string> = { en: ".", ru: ",", uz: "," };
const GROUP: Record<SiteLocale, string> = { en: ",", ru: " ", uz: " " };

const group = (digits: string, locale: SiteLocale) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP[locale]);

export const uzsAmount = (usd: number, rate: number, locale: SiteLocale): UzsAmount | null => {
  const uzs = usd * rate;
  if (!Number.isFinite(uzs) || uzs <= 0) return null;
  const thousands = Math.round(uzs / 10_000) * 10;
  if (thousands < 1000) return { unit: "thousand", amount: String(Math.max(thousands, 10)) };
  const [whole = "0", tenth = "0"] = (Math.round(uzs / 100_000) / 10).toFixed(1).split(".");
  return { unit: "million", amount: `${group(whole, locale)}${DECIMAL[locale]}${tenth}` };
};

/** The rate itself, as the bank gives it: "11,838.92" / "11 838,92". */
export const formatRate = (rate: number, locale: SiteLocale) => {
  const [whole = "0", cents = "00"] = rate.toFixed(2).split(".");
  return `${group(whole, locale)}${DECIMAL[locale]}${cents}`;
};

/** "2026-10-24" -> "24.10.2026". */
export const formatRateDate = (date: string) => date.split("-").reverse().join(".");
