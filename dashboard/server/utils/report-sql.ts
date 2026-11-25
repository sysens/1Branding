// SQL pieces the reports share: Tashkent days, currency conversion, the
// period/channel/service filters. Every timestamp is stored in UTC and the
// session runs in UTC, so "+ 5 hours" then ::date is the day in Tashkent.
import { sql, type SQL } from "drizzle-orm";
import type { AttributionModel, ReportCurrency } from "#shared/utils/constants";
import { monthStart, tashkentDay } from "../../shared/utils/time";

export type ReportFilters = {
  from: string;
  to: string;
  currency: ReportCurrency;
  attribution: AttributionModel;
  channelIds: number[];
  serviceIds: number[];
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const tday = (column: string) => sql.raw(`((${column} + interval '5 hours')::date)`);

/** UZS for one unit of `currency` on `day` (both SQL expressions), from fx_rates. */
export const fxAt = (currency: SQL, day: SQL) =>
  sql`(CASE WHEN ${currency} = 'UZS' THEN 1::numeric ELSE (SELECT r.uzs_per_unit FROM fx_rates r WHERE r.currency = ${currency} AND r.day <= ${day} ORDER BY r.day DESC LIMIT 1) END)`;

/**
 * A stored amount (with its own rates) in the report currency:
 * USD = amount × uzs_per_unit ÷ uzs_per_usd, UZS = amount × uzs_per_unit.
 */
export const stored = (alias: string, currency: ReportCurrency) =>
  currency === "USD"
    ? sql.raw(`(${alias}.amount * ${alias}.uzs_per_unit / NULLIF(${alias}.uzs_per_usd, 0))`)
    : sql.raw(`(${alias}.amount * ${alias}.uzs_per_unit)`);

/** Any amount in `currencyCol` on `day`, converted with the rates of that day. */
export const convertAt = (amount: SQL, currencyCol: SQL, day: SQL, currency: ReportCurrency) =>
  currency === "USD"
    ? sql`(${amount} * ${fxAt(currencyCol, day)} / NULLIF(${fxAt(sql`'USD'`, day)}, 0))`
    : sql`(${amount} * ${fxAt(currencyCol, day)})`;

export const between = (expr: SQL, from: string, to: string) => sql`${expr} BETWEEN ${from}::date AND ${to}::date`;

export const idList = (ids: number[]) => sql.join(ids.map((id) => sql`${id}`), sql`, `);

/** The deal's channel column under the attribution model. */
export const dealChannel = (alias: string, attribution: AttributionModel) =>
  sql.raw(`${alias}.${attribution === "first" ? "first_channel_id" : "last_channel_id"}`);

/** " AND <deal alias> matches the channel and service filters" (or nothing). */
export function dealFilter(alias: string, f: ReportFilters): SQL {
  const parts: SQL[] = [];
  if (f.channelIds.length) parts.push(sql`${dealChannel(alias, f.attribution)} IN (${idList(f.channelIds)})`);
  if (f.serviceIds.length) {
    parts.push(sql`(${sql.join(f.serviceIds.map((id) => sql`${sql.raw(`${alias}.service_ids`)} @> ${JSON.stringify([id])}::jsonb`), sql` OR `)})`);
  }
  return parts.length ? sql` AND ${sql.join(parts, sql` AND `)}` : sql``;
}

export const channelFilter = (column: string, f: ReportFilters): SQL =>
  f.channelIds.length ? sql` AND ${sql.raw(column)} IN (${idList(f.channelIds)})` : sql``;

export function parseFilters(query: Record<string, unknown>, defaults: { currency: ReportCurrency; attribution: AttributionModel }): ReportFilters {
  const today = tashkentDay();
  const from = DAY.test(String(query.from ?? "")) ? String(query.from) : monthStart(today);
  let to = DAY.test(String(query.to ?? "")) ? String(query.to) : today;
  if (to < from) to = from;
  const ids = (value: unknown) => String(value ?? "")
    .split(",")
    .map((part) => Number(part))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 50);
  const currency = query.currency === "UZS" || query.currency === "USD" ? query.currency : defaults.currency;
  const attribution = query.attribution === "first" || query.attribution === "last" ? query.attribution : defaults.attribution;
  return { from, to, currency, attribution, channelIds: ids(query.channels), serviceIds: ids(query.services) };
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export const ratio = (part: number, whole: number) => (whole ? part / whole : null);
export const percent = (part: number, whole: number) => (whole ? (part / whole) * 100 : null);
