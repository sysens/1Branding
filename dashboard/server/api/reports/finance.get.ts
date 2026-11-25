// Finance (spec 6.7): the payments journal, revenue by month and by
// service / package, receivables, gross profit and the month plans.
import { sql } from "drizzle-orm";
import { addDays, monthStart } from "../../../shared/utils/time";
import { requireUser } from "../../utils/auth";
import { rows } from "../../utils/db";
import { receivables } from "../../utils/metrics";
import { requestFilters } from "../../utils/report-filters";
import { between, dealFilter, stored } from "../../utils/report-sql";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const f = await requestFilters(event);
  const fromMonth = monthStart(addDays(monthStart(f.to), -330));

  const [journal, monthly, byService, owed] = await Promise.all([
    rows(sql`
      SELECT p.id, p.paid_on::text AS paid_on, p.kind, p.amount::float8 AS amount, p.currency, p.method, p.note,
             p.commission_percent::float8 AS commission_percent,
             (${stored("p", f.currency)} * (1 - p.commission_percent / 100))::float8 AS amount_report,
             d.id AS deal_id, coalesce(d.title, c.name) AS deal_title, c.name AS client
      FROM payments p JOIN deals d ON d.id = p.deal_id LEFT JOIN clients c ON c.id = d.client_id
      WHERE ${between(sql.raw("p.paid_on"), f.from, f.to)} ${dealFilter("d", f)}
      ORDER BY p.paid_on DESC, p.id DESC`),
    rows<{ month: string; revenue: number; costs: number; expenses: number; plan: number | null; plan_currency: string | null }>(sql`
      WITH months AS (SELECT generate_series(${fromMonth}::date, ${monthStart(f.to)}::date, interval '1 month')::date AS month),
      rev AS (SELECT date_trunc('month', p.paid_on)::date AS month, sum(${stored("p", f.currency)} * (1 - p.commission_percent / 100))::float8 AS revenue
              FROM payments p JOIN deals d ON d.id = p.deal_id WHERE p.paid_on >= ${fromMonth}::date ${dealFilter("d", f)} GROUP BY 1),
      cst AS (SELECT date_trunc('month', c.spent_on)::date AS month, sum(${stored("c", f.currency)})::float8 AS costs
              FROM deal_costs c JOIN deals d ON d.id = c.deal_id WHERE c.spent_on >= ${fromMonth}::date ${dealFilter("d", f)} GROUP BY 1),
      exp AS (SELECT date_trunc('month', e.spent_on)::date AS month, sum(${stored("e", f.currency)})::float8 AS expenses
              FROM expenses e WHERE e.spent_on >= ${fromMonth}::date GROUP BY 1)
      SELECT m.month::text AS month, coalesce(rev.revenue, 0)::float8 AS revenue, coalesce(cst.costs, 0)::float8 AS costs,
             coalesce(exp.expenses, 0)::float8 AS expenses, pl.revenue::float8 AS plan, pl.currency AS plan_currency
      FROM months m LEFT JOIN rev ON rev.month = m.month LEFT JOIN cst ON cst.month = m.month
      LEFT JOIN exp ON exp.month = m.month LEFT JOIN plans pl ON pl.month = m.month
      ORDER BY m.month`),
    // A payment for a deal with several services is split between them evenly.
    rows<{ service_id: number | null; revenue: number }>(sql`
      WITH p AS (
        SELECT d.service_ids, (${stored("p", f.currency)} * (1 - p.commission_percent / 100))::float8 AS value
        FROM payments p JOIN deals d ON d.id = p.deal_id
        WHERE ${between(sql.raw("p.paid_on"), f.from, f.to)} ${dealFilter("d", f)}
      )
      SELECT s.value::int AS service_id, sum(p.value / greatest(jsonb_array_length(p.service_ids), 1))::float8 AS revenue
      FROM p LEFT JOIN LATERAL jsonb_array_elements_text(CASE WHEN jsonb_array_length(p.service_ids) > 0 THEN p.service_ids ELSE '[null]'::jsonb END) s(value) ON true
      GROUP BY 1 ORDER BY 2 DESC`),
    receivables(f),
  ]);

  return { filters: f, journal, monthly, byService, receivables: owed };
});
