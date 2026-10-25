/**
 * The Central Bank of Uzbekistan's official US dollar rate, for showing the
 * site's dollar prices in so'm as well (server/api/usd-rate.get.ts). Read at
 * most every 6 hours, in the background once a rate is known. When the bank
 * does not answer, the last rate read stays in use for up to 7 days; without
 * one the pages show dollars only, and the bank is asked again 10 minutes later.
 */
export type UsdRate = { rate: number; date: string };
export type FetchJson = (url: string, options: { timeout: number }) => Promise<unknown>;

const CBU_URL = "https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/";
const REFRESH_MS = 6 * 3600_000;
const MAX_AGE_MS = 7 * 24 * 3600_000;
const RETRY_MS = 10 * 60_000;

let last: { at: number; value: UsdRate } | null = null;
let failedAt = 0;
let pending: Promise<void> | null = null;

/** The bank's answer ([{ Ccy: "USD", Rate: "11838.92", Date: "24.10.2026" }]) as a rate and an ISO date. */
export const parseCbuRate = (body: unknown): UsdRate | null => {
  const row = Array.isArray(body) ? body.find((item) => item?.Ccy === "USD") : null;
  const rate = Number.parseFloat(String(row?.Rate ?? ""));
  const date = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(row?.Date ?? ""));
  if (!Number.isFinite(rate) || rate <= 0 || !date) return null;
  return { rate, date: `${date[3]}-${date[2]}-${date[1]}` };
};

export async function usdRate(fetchJson: FetchJson): Promise<UsdRate | null> {
  const now = Date.now();
  const stale = !last || now - last.at > REFRESH_MS;
  if (stale && !pending && (last || now - failedAt > RETRY_MS)) {
    pending = fetchJson(CBU_URL, { timeout: 4000 })
      .then((body) => {
        const value = parseCbuRate(body);
        if (!value) throw new Error("no USD rate in the answer");
        last = { at: Date.now(), value };
      })
      .catch(() => {
        failedAt = Date.now();
      })
      .finally(() => {
        pending = null;
      });
  }
  // The first read waits for the bank; later ones keep the last rate meanwhile.
  if (!last && pending) await pending;
  return last && Date.now() - last.at <= MAX_AGE_MS ? last.value : null;
}
