// Clients (spec 6.6): deals, lifetime revenue (LTV), first and last
// purchase, the channel of the first contact, "repeat client".
import { sql } from "drizzle-orm";
import type { ReportCurrency } from "#shared/utils/constants";
import { requireUser } from "../../utils/auth";
import { rows } from "../../utils/db";
import { stored } from "../../utils/report-sql";
import { getSetting } from "../../utils/settings";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const query = getQuery(event);
  const currency: ReportCurrency = query.currency === "UZS" || query.currency === "USD"
    ? query.currency
    : (await getSetting<ReportCurrency>("reportCurrency")) ?? "USD";
  const search = String(query.q ?? "").trim().slice(0, 100);
  const like = `%${search.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  return rows(sql`
    SELECT c.id, c.name, c.contact_name, c.phone, c.telegram, c.whatsapp, c.instagram, c.first_channel_id, c.created_at,
           i.name AS industry,
           count(DISTINCT d.id)::int AS deals,
           count(DISTINCT d.id) FILTER (WHERE EXISTS (SELECT 1 FROM payments px WHERE px.deal_id = d.id))::int AS paid_deals,
           coalesce(sum(${stored("p", currency)} * (1 - p.commission_percent / 100)), 0)::float8 AS ltv,
           min(p.paid_on)::text AS first_purchase, max(p.paid_on)::text AS last_purchase
    FROM clients c
    LEFT JOIN industries i ON i.id = c.industry_id
    LEFT JOIN deals d ON d.client_id = c.id
    LEFT JOIN payments p ON p.deal_id = d.id
    ${search ? sql`WHERE c.name ILIKE ${like} OR c.contact_name ILIKE ${like} OR c.phone ILIKE ${like} OR c.telegram ILIKE ${like}` : sql``}
    GROUP BY c.id, i.name
    ORDER BY ltv DESC, c.created_at DESC
    LIMIT 2000`);
});
