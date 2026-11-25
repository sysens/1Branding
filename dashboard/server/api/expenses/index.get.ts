// Marketing spend (spec 6.8): the journal and the state of each ads API.
import { sql } from "drizzle-orm";
import { integrationStatus } from "../../db/schema";
import { requireUser } from "../../utils/auth";
import { rows, useDb } from "../../utils/db";
import { INTEGRATION_LABELS } from "../../utils/integrations";
import { requestFilters } from "../../utils/report-filters";
import { between, channelFilter, stored } from "../../utils/report-sql";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const f = await requestFilters(event);
  const [journal, statuses] = await Promise.all([
    rows(sql`
      SELECT e.id, e.spent_on::text AS spent_on, e.channel_id, e.campaign_id, cp.name AS campaign, cp.placement,
             e.amount::float8 AS amount, e.currency, e.source, e.impressions, e.clicks, e.comment,
             ${stored("e", f.currency)}::float8 AS amount_report, u.name AS author
      FROM expenses e
      LEFT JOIN campaigns cp ON cp.id = e.campaign_id
      LEFT JOIN users u ON u.id = e.created_by
      WHERE ${between(sql.raw("e.spent_on"), f.from, f.to)} ${channelFilter("e.channel_id", f)}
      ORDER BY e.spent_on DESC, e.id DESC
      LIMIT 3000`),
    useDb().select().from(integrationStatus),
  ]);
  return {
    filters: f,
    journal,
    integrations: Object.entries(INTEGRATION_LABELS).map(([provider, label]) => {
      const status = statuses.find((s) => s.provider === provider);
      return { provider, label, lastSuccessAt: status?.lastSuccessAt ?? null, lastAttemptAt: status?.lastAttemptAt ?? null, lastError: status?.lastError ?? null };
    }),
  };
});
