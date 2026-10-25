/**
 * The US dollar rate in so'm, for showing the site's dollar prices in so'm as
 * well (server/api/usd-rate.get.ts). The Central Bank of Uzbekistan's official
 * rate when its site answers; it answers only inside Uzbekistan, and the
 * server runs abroad, so otherwise ExchangeRate-API's daily rate (its open
 * endpoint asks for a credit link, which the pages show with such a rate).
 *
 * Read at most every 6 hours, in the background once a rate is known. When
 * neither answers, the last rate read stays in use for up to 7 days; without
 * one the pages show dollars only, and the sources are asked again 10 minutes later.
 */
export type UsdRateSource = "cbu" | "er-api";
export type UsdRate = { rate: number; date: string; source: UsdRateSource };
export type FetchJson = (url: string, options: { timeout: number }) => Promise<unknown>;

const REFRESH_MS = 6 * 3600_000;
const MAX_AGE_MS = 7 * 24 * 3600_000;
const RETRY_MS = 10 * 60_000;

/** The bank's answer ([{ Ccy: "USD", Rate: "11838.92", Date: "24.10.2026" }]) as a rate and an ISO date. */
export const parseCbuRate = (body: unknown): UsdRate | null => {
  const row = Array.isArray(body) ? body.find((item) => item?.Ccy === "USD") : null;
  const rate = Number.parseFloat(String(row?.Rate ?? ""));
  const date = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(row?.Date ?? ""));
  if (!Number.isFinite(rate) || rate <= 0 || !date) return null;
  return { rate, date: `${date[3]}-${date[2]}-${date[1]}`, source: "cbu" };
};

/** ExchangeRate-API's answer ({ result: "success", time_last_update_unix, rates: { UZS } }). */
export const parseErApiRate = (body: unknown): UsdRate | null => {
  const data = body as { result?: string; time_last_update_unix?: number; rates?: Record<string, number> } | null;
  const rate = Number(data?.rates?.UZS);
  const updated = Number(data?.time_last_update_unix);
  if (data?.result !== "success" || !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(updated)) return null;
  return { rate, date: new Date(updated * 1000).toISOString().slice(0, 10), source: "er-api" };
};

// In order of preference.
const SOURCES = [
  { url: "https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/", timeout: 2500, parse: parseCbuRate },
  { url: "https://open.er-api.com/v6/latest/USD", timeout: 4000, parse: parseErApiRate },
];

let last: { at: number; value: UsdRate } | null = null;
let failedAt = 0;
let pending: Promise<void> | null = null;

const read = async (fetchJson: FetchJson): Promise<UsdRate> => {
  const answers = await Promise.allSettled(SOURCES.map((source) => fetchJson(source.url, { timeout: source.timeout }).then(source.parse)));
  for (const answer of answers) if (answer.status === "fulfilled" && answer.value) return answer.value;
  throw new Error("no USD rate");
};

export async function usdRate(fetchJson: FetchJson): Promise<UsdRate | null> {
  const now = Date.now();
  const stale = !last || now - last.at > REFRESH_MS;
  if (stale && !pending && (last || now - failedAt > RETRY_MS)) {
    pending = read(fetchJson)
      .then((value) => {
        last = { at: Date.now(), value };
      })
      .catch(() => {
        failedAt = Date.now();
      })
      .finally(() => {
        pending = null;
      });
  }
  // The first read waits for the sources; later ones keep the last rate meanwhile.
  if (!last && pending) await pending;
  return last && Date.now() - last.at <= MAX_AGE_MS ? last.value : null;
}
