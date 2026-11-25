// The filters on every report (spec 6): period (with comparison to the
// previous one), channels, services, currency, attribution model. They live
// in the page's URL, so a link opens the same view; the last choice is
// remembered in the browser.
import type { AttributionModel, ReportCurrency } from "#shared/utils/constants";
import { addDays, monthStart, tashkentDay } from "#shared/utils/time";

const STORAGE_KEY = "ob-dashboard-filters";

export type PeriodPreset = "today" | "7d" | "30d" | "month" | "prev_month" | "custom";

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Сегодня",
  "7d": "7 дней",
  "30d": "30 дней",
  month: "Этот месяц",
  prev_month: "Прошлый месяц",
  custom: "Произвольный",
};

export function presetRange(preset: PeriodPreset): { from: string; to: string } {
  const today = tashkentDay();
  if (preset === "today") return { from: today, to: today };
  if (preset === "7d") return { from: addDays(today, -6), to: today };
  if (preset === "30d") return { from: addDays(today, -29), to: today };
  if (preset === "prev_month") {
    const end = addDays(monthStart(today), -1);
    return { from: monthStart(end), to: end };
  }
  return { from: monthStart(today), to: today };
}

type Stored = { preset?: PeriodPreset; currency?: ReportCurrency; attribution?: AttributionModel };

const readStored = (): Stored => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Stored;
  } catch {
    return {};
  }
};

export function useFilters() {
  const route = useRoute();
  const router = useRouter();
  const { meta } = useMeta();
  const stored = import.meta.client ? readStored() : {};

  const preset = computed<PeriodPreset>(() => (route.query.preset as PeriodPreset) || stored.preset || "month");
  const range = computed(() => {
    if (preset.value === "custom" && route.query.from && route.query.to) return { from: String(route.query.from), to: String(route.query.to) };
    return presetRange(preset.value === "custom" ? "month" : preset.value);
  });
  const ids = (value: unknown) => String(value ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const channels = computed(() => ids(route.query.channels));
  const services = computed(() => ids(route.query.services));
  const currency = computed<ReportCurrency>(() =>
    (route.query.currency as ReportCurrency) || stored.currency || meta.value?.defaults.reportCurrency || "USD");
  const attribution = computed<AttributionModel>(() =>
    (route.query.attribution as AttributionModel) || stored.attribution || meta.value?.defaults.attribution || "last");

  const set = (patch: Record<string, string | number[] | undefined>) => {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries({ ...route.query, ...patch })) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        if (value.length) query[key] = value.join(",");
      } else query[key] = String(value);
    }
    const remember: Stored = { preset: query.preset as PeriodPreset, currency: query.currency as ReportCurrency, attribution: query.attribution as AttributionModel };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStored(), ...Object.fromEntries(Object.entries(remember).filter(([, v]) => v)) }));
    } catch {
      // storage blocked: the URL still holds the filters
    }
    router.replace({ query });
  };

  /** The query string the report endpoints read. */
  const params = computed(() => ({
    from: range.value.from,
    to: range.value.to,
    currency: currency.value,
    attribution: attribution.value,
    ...(channels.value.length ? { channels: channels.value.join(",") } : {}),
    ...(services.value.length ? { services: services.value.join(",") } : {}),
  }));

  return { preset, range, channels, services, currency, attribution, params, set };
}
