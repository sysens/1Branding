// How numbers, money, dates and durations read in the interface (Russian).
const nf = (digits = 0) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export function formatMoney(value: number | null | undefined, currency = "USD", options: { compact?: boolean } = {}): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (options.compact && abs >= 1_000_000) {
    const text = nf(1).format(value / 1_000_000);
    return currency === "USD" ? `$${text} млн` : `${text} млн ${currency === "UZS" ? "сум" : currency}`;
  }
  const digits = currency === "UZS" ? 0 : abs < 100 && abs % 1 !== 0 ? 2 : 0;
  const text = nf(digits).format(value);
  if (currency === "USD") return value < 0 ? `−$${text.replace("-", "").replace("−", "")}` : `$${text}`;
  return `${text} ${currency === "UZS" ? "сум" : currency}`;
}

export const formatNumber = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined || !Number.isFinite(value) ? "—" : nf(digits).format(value);

export const formatPercent = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined || !Number.isFinite(value) ? "—" : `${nf(digits).format(value)}%`;

/** "2026-11-25" → "25.11.2026" (or "25 нояб." short). */
export function formatDay(day: string | null | undefined, short = false): string {
  if (!day) return "—";
  const [y, m, d] = day.slice(0, 10).split("-");
  if (short) return new Date(Date.UTC(+y!, +m! - 1, +d!)).toLocaleDateString("ru-RU", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${d}.${m}.${y}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("ru-RU", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" });
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин ${s % 60 ? `${s % 60} с` : ""}`.trim();
  return `${Math.floor(m / 60)} ч ${m % 60} мин`;
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "—";
  if (minutes < 60) return `${Math.round(minutes)} мин`;
  const hours = Math.floor(minutes / 60);
  return `${hours} ч ${Math.round(minutes % 60)} мин`;
}

/** Change against the previous period in %, or null when there is nothing to compare. */
export function delta(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current === null || current === undefined || previous === null || previous === undefined) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export const plural = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

/** A plain deep copy of reference data for an editable form. */
export const deepCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
