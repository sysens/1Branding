// The report filters of a request (?from&to&currency&attribution&channels&services),
// with the defaults of Settings.
import type { H3Event } from "h3";
import { getQuery } from "h3";
import type { AttributionModel, ReportCurrency } from "#shared/utils/constants";
import { parseFilters } from "./report-sql";
import { getSetting } from "./settings";

export async function requestFilters(event: H3Event) {
  const [currency, attribution] = await Promise.all([
    getSetting<ReportCurrency>("reportCurrency"),
    getSetting<AttributionModel>("attribution"),
  ]);
  return parseFilters(getQuery(event), { currency: currency ?? "USD", attribution: attribution ?? "last" });
}
