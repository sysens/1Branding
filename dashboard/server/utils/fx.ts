// Exchange rates of the Central Bank of Uzbekistan (cbu.uz open data): UZS
// for one unit of each currency, per day. Every payment, cost and expense is
// stored with the rates of its own date (spec 8.4).
import { and, desc, eq, lte } from "drizzle-orm";
import { createError } from "h3";
import { fxRates } from "../db/schema";
import { useDb } from "./db";
import { markIntegration } from "./integrations";

type CbuRow = { Ccy: string; Rate: string; Nominal: string; Date: string };

const CBU_URL = "https://cbu.uz/ru/arkhiv-kursov-valyut/json/all";

/** Loads the rates the CBU set for a day (default: today) into fx_rates. */
export async function fetchCbuRates(day?: string): Promise<number> {
  const url = day ? `${CBU_URL}/${day}/` : `${CBU_URL}/`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`cbu.uz ответил HTTP ${response.status}`);
  const list = (await response.json()) as CbuRow[];
  if (!Array.isArray(list) || !list.length) throw new Error("cbu.uz вернул пустой список курсов");
  const values = list
    .map((row) => {
      const [d, m, y] = String(row.Date).split(".");
      const nominal = Number(row.Nominal) || 1;
      const value = Number(row.Rate) / nominal;
      return { day: `${y}-${m}-${d}`, currency: String(row.Ccy).toUpperCase(), uzsPerUnit: value };
    })
    .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.day) && Number.isFinite(row.uzsPerUnit) && row.uzsPerUnit > 0);
  if (!values.length) return 0;
  await useDb().insert(fxRates).values(values).onConflictDoUpdate({
    target: [fxRates.day, fxRates.currency],
    set: { uzsPerUnit: fxRates.uzsPerUnit },
  });
  return values.length;
}

const attempted = new Map<string, number>();

/** UZS for one unit of the currency on the day: the latest rate set on or before it. */
export async function uzsPerUnit(day: string, currency: string): Promise<number> {
  const ccy = currency.toUpperCase();
  if (ccy === "UZS") return 1;
  const db = useDb();
  const find = async () => (await db.select().from(fxRates)
    .where(and(eq(fxRates.currency, ccy), lte(fxRates.day, day)))
    .orderBy(desc(fxRates.day)).limit(1))[0];
  let row = await find();
  // Not loaded yet (a new day, an old payment typed in): ask cbu.uz once per day and hour.
  const key = `${day}:${new Date().toISOString().slice(0, 13)}`;
  if ((!row || row.day !== day) && !attempted.has(key)) {
    attempted.set(key, Date.now());
    try {
      await fetchCbuRates(day);
      await markIntegration("cbu", { ok: true });
      row = await find();
    } catch (error) {
      await markIntegration("cbu", { ok: false, error: (error as Error).message });
    }
  }
  if (!row) throw createError({ statusCode: 422, message: `Нет курса ЦБ для ${ccy} на ${day}` });
  return row.uzsPerUnit;
}

/** The two rates stored next to every amount. */
export async function ratesFor(day: string, currency: string) {
  const [unit, usd] = await Promise.all([uzsPerUnit(day, currency), uzsPerUnit(day, "USD")]);
  return { uzsPerUnit: unit, uzsPerUsd: usd };
}
