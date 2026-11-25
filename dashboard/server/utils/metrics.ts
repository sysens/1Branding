// The numbers of spec section 7. Dates: a lead counts on the day it was
// created, revenue on the payment's date, spend on the expense's date.
// Revenue is money actually received minus marketplace commissions.
// Per-channel CAC / ROMI / ROI are cohort numbers: the period's spend
// against all revenue so far from the leads created in that period, so a
// channel with a long sales cycle does not look like a loss.
import { sql } from "drizzle-orm";
import { addDays, tashkentDay, workingMsBetween, type WorkSchedule } from "../../shared/utils/time";
import { one, rows } from "./db";
import {
  between,
  channelFilter,
  convertAt,
  dealChannel,
  dealFilter,
  median,
  percent,
  ratio,
  stored,
  tday,
  type ReportFilters,
} from "./report-sql";

// ---------------------------------------------------------------- building blocks

export async function countVisits(f: ReportFilters) {
  const row = await one<{ visits: number; visitors: number }>(sql`
    SELECT count(*)::int AS visits, count(DISTINCT v.visitor_id)::int AS visitors
    FROM visits v
    WHERE NOT v.is_bot AND v.interacted AND ${between(tday("v.started_at"), f.from, f.to)} ${channelFilter("v.channel_id", f)}`);
  return { visits: row?.visits ?? 0, visitors: row?.visitors ?? 0 };
}

export async function countLeads(f: ReportFilters) {
  const row = await one<{ leads: number; site: number }>(sql`
    SELECT count(*)::int AS leads,
           count(*) FILTER (WHERE d.origin = 'form' OR d.contact_code IS NOT NULL)::int AS site
    FROM deals d
    WHERE ${between(tday("d.created_at"), f.from, f.to)} ${dealFilter("d", f)}`);
  return { leads: row?.leads ?? 0, siteLeads: row?.site ?? 0 };
}

export async function sumExpenses(f: ReportFilters) {
  const row = await one<{ total: number; impressions: number; clicks: number }>(sql`
    SELECT coalesce(sum(${stored("e", f.currency)}), 0)::float8 AS total,
           coalesce(sum(e.impressions), 0)::int AS impressions,
           coalesce(sum(e.clicks), 0)::int AS clicks
    FROM expenses e
    WHERE ${between(sql.raw("e.spent_on"), f.from, f.to)} ${channelFilter("e.channel_id", f)}`);
  return { expenses: row?.total ?? 0, impressions: row?.impressions ?? 0, clicks: row?.clicks ?? 0 };
}

/** Money received in the period, without marketplace commissions. */
export async function sumRevenue(f: ReportFilters) {
  const row = await one<{ revenue: number; gross: number; repeat: number }>(sql`
    SELECT coalesce(sum(${stored("p", f.currency)} * (1 - p.commission_percent / 100)), 0)::float8 AS revenue,
           coalesce(sum(${stored("p", f.currency)}), 0)::float8 AS gross,
           coalesce(sum(${stored("p", f.currency)} * (1 - p.commission_percent / 100)) FILTER (WHERE d.is_repeat), 0)::float8 AS repeat
    FROM payments p JOIN deals d ON d.id = p.deal_id
    WHERE ${between(sql.raw("p.paid_on"), f.from, f.to)} ${dealFilter("d", f)}`);
  return { revenue: row?.revenue ?? 0, paymentsTotal: row?.gross ?? 0, repeatRevenue: row?.repeat ?? 0 };
}

export async function sumCosts(f: ReportFilters) {
  const row = await one<{ total: number }>(sql`
    SELECT coalesce(sum(${stored("c", f.currency)}), 0)::float8 AS total
    FROM deal_costs c JOIN deals d ON d.id = c.deal_id
    WHERE ${between(sql.raw("c.spent_on"), f.from, f.to)} ${dealFilter("d", f)}`);
  return row?.total ?? 0;
}

/** Clients whose first payment ever falls in the period (repeat deals are not new clients). */
export async function countNewClients(f: ReportFilters) {
  const row = await one<{ n: number }>(sql`
    WITH first_pay AS (
      SELECT DISTINCT ON (d.client_id) d.client_id, p.paid_on, d.first_channel_id, d.last_channel_id, d.service_ids
      FROM payments p JOIN deals d ON d.id = p.deal_id
      WHERE d.client_id IS NOT NULL
      ORDER BY d.client_id, p.paid_on, p.id
    )
    SELECT count(*)::int AS n FROM first_pay fp
    WHERE ${between(sql.raw("fp.paid_on"), f.from, f.to)} ${dealFilter("fp", f)}`);
  return row?.n ?? 0;
}

/** Deals that reached "Prepayment" in the period (their first payment): count and contract total. */
export async function salesInPeriod(f: ReportFilters) {
  const row = await one<{ n: number; total: number; cycle: number[] | null }>(sql`
    WITH fp AS (SELECT p.deal_id, min(p.paid_on) AS first_paid FROM payments p GROUP BY p.deal_id)
    SELECT count(*)::int AS n,
           coalesce(sum(${convertAt(sql.raw("d.amount"), sql.raw("d.currency"), sql.raw("fp.first_paid"), f.currency)}), 0)::float8 AS total,
           array_agg((fp.first_paid - ${tday("d.created_at")})::int) AS cycle
    FROM fp JOIN deals d ON d.id = fp.deal_id
    WHERE ${between(sql.raw("fp.first_paid"), f.from, f.to)} ${dealFilter("d", f)}`);
  const n = row?.n ?? 0;
  const total = row?.total ?? 0;
  return { salesCount: n, salesTotal: total, averageCheck: n ? total / n : null, cycleDays: median((row?.cycle ?? []).filter((v) => v !== null)) };
}

/** What clients still owe now: contract amounts of prepaid deals minus what they paid. */
export async function receivables(f: Pick<ReportFilters, "currency" | "channelIds" | "serviceIds" | "attribution">) {
  const today = tashkentDay();
  const list = await rows<{ id: number; title: string; client: string | null; currency: string; amount: number; paid: number; remaining: number; remaining_report: number; last_paid: string; expected: string | null }>(sql`
    SELECT d.id, coalesce(d.title, c.name, '') AS title, c.name AS client, d.currency, d.amount::float8 AS amount,
           sum(p.amount * p.uzs_per_unit / (CASE WHEN d.currency = 'UZS' THEN 1 WHEN d.currency = 'USD' THEN p.uzs_per_usd
                WHEN d.currency = p.currency THEN p.uzs_per_unit ELSE (SELECT r.uzs_per_unit FROM fx_rates r WHERE r.currency = d.currency AND r.day <= p.paid_on ORDER BY r.day DESC LIMIT 1) END))::float8 AS paid,
           0::float8 AS remaining, 0::float8 AS remaining_report,
           max(p.paid_on)::text AS last_paid, d.expected_close_on::text AS expected
    FROM deals d
    JOIN payments p ON p.deal_id = d.id
    JOIN stages s ON s.id = d.stage_id
    LEFT JOIN clients c ON c.id = d.client_id
    WHERE d.amount IS NOT NULL AND s.kind <> 'lost' ${dealFilter("d", { ...f, from: today, to: today })}
    GROUP BY d.id, c.name`);
  const usdRate = await one<{ rate: number }>(sql`SELECT uzs_per_unit::float8 AS rate FROM fx_rates WHERE currency = 'USD' ORDER BY day DESC LIMIT 1`);
  const rateRows = await rows<{ currency: string; rate: number }>(sql`
    SELECT DISTINCT ON (currency) currency, uzs_per_unit::float8 AS rate FROM fx_rates ORDER BY currency, day DESC`);
  const rate = (ccy: string) => (ccy === "UZS" ? 1 : rateRows.find((r) => r.currency === ccy)?.rate ?? 0);
  const toReport = (amount: number, ccy: string) =>
    f.currency === "UZS" ? amount * rate(ccy) : (usdRate?.rate ? (amount * rate(ccy)) / usdRate.rate : 0);
  const items = list
    .map((item) => {
      const remaining = Math.max(0, item.amount - (item.paid ?? 0));
      return { ...item, remaining, remaining_report: toReport(remaining, item.currency) };
    })
    .filter((item) => item.remaining > 0.009)
    .sort((a, b) => b.remaining_report - a.remaining_report);
  return { total: items.reduce((sum, item) => sum + item.remaining_report, 0), items };
}

/** Median working minutes to the first response, and the share answered within the target. */
export async function responseSpeed(f: ReportFilters, schedule: WorkSchedule, targetMinutes: number) {
  const list = await rows<{ created_at: string; first_response_at: string | null }>(sql`
    SELECT d.created_at, d.first_response_at FROM deals d
    WHERE d.origin <> 'manual' AND ${between(tday("d.created_at"), f.from, f.to)} ${dealFilter("d", f)}`);
  const now = Date.now();
  const answered: number[] = [];
  let late = 0;
  for (const deal of list) {
    const created = Date.parse(String(deal.created_at));
    if (deal.first_response_at) answered.push(workingMsBetween(created, Date.parse(String(deal.first_response_at)), schedule) / 60_000);
    else if (workingMsBetween(created, now, schedule) / 60_000 > targetMinutes) late += 1;
  }
  const fast = answered.filter((minutes) => minutes <= targetMinutes).length;
  return {
    medianMinutes: median(answered),
    fastShare: percent(fast, answered.length + late),
    answered: answered.length,
    waiting: late,
  };
}

// ---------------------------------------------------------------- cohort funnel

type StageRef = { id: number; key: string; name: string; position: number; kind: string };

/** For the leads created in the period: how many reached each stage (by their stage history). */
export async function funnelByStages(f: ReportFilters, stageRows: StageRef[]) {
  const reached = await rows<{ max_pos: number | null }>(sql`
    SELECT max(s.position) FILTER (WHERE s.kind <> 'lost') AS max_pos
    FROM deals d
    JOIN stage_history h ON h.deal_id = d.id
    JOIN stages s ON s.id = h.to_stage_id
    WHERE ${between(tday("d.created_at"), f.from, f.to)} ${dealFilter("d", f)}
    GROUP BY d.id`);
  return stageRows
    .filter((stage) => stage.kind !== "lost")
    .map((stage) => ({
      key: stage.key,
      name: stage.name,
      count: reached.filter((row) => (row.max_pos ?? -1) >= stage.position).length,
    }));
}

// ---------------------------------------------------------------- summary (6.1)

export async function kpis(f: ReportFilters, options: { schedule: WorkSchedule; targetMinutes: number }) {
  const [visits, leads, spend, revenue, costs, newClients, sales, speed] = await Promise.all([
    countVisits(f),
    countLeads(f),
    sumExpenses(f),
    sumRevenue(f),
    sumCosts(f),
    countNewClients(f),
    salesInPeriod(f),
    responseSpeed(f, options.schedule, options.targetMinutes),
  ]);
  const grossProfit = revenue.revenue - costs;
  return {
    visits: visits.visits,
    visitors: visits.visitors,
    leads: leads.leads,
    siteLeads: leads.siteLeads,
    siteCr: percent(leads.siteLeads, visits.visits),
    expenses: spend.expenses,
    cpl: spend.expenses ? ratio(spend.expenses, leads.leads) : null,
    newClients,
    cac: spend.expenses ? ratio(spend.expenses, newClients) : null,
    revenue: revenue.revenue,
    repeatShare: percent(revenue.repeatRevenue, revenue.revenue),
    salesTotal: sales.salesTotal,
    salesCount: sales.salesCount,
    averageCheck: sales.averageCheck,
    cycleDays: sales.cycleDays,
    costs,
    grossProfit,
    romi: spend.expenses ? ((revenue.revenue - spend.expenses) / spend.expenses) * 100 : null,
    roi: spend.expenses ? ((grossProfit - spend.expenses) / spend.expenses) * 100 : null,
    responseMedianMinutes: speed.medianMinutes,
    responseFastShare: speed.fastShare,
  };
}

export async function leadsByDay(f: ReportFilters) {
  return rows<{ day: string; channel_id: number | null; n: number }>(sql`
    SELECT ${tday("d.created_at")}::text AS day, ${dealChannel("d", f.attribution)} AS channel_id, count(*)::int AS n
    FROM deals d
    WHERE ${between(tday("d.created_at"), f.from, f.to)} ${dealFilter("d", f)}
    GROUP BY 1, 2 ORDER BY 1`);
}

export async function planFact(month: string, f: ReportFilters) {
  const monthEndDay = addDays(`${month.slice(0, 7)}-01`, 40).slice(0, 7) + "-01";
  const end = addDays(monthEndDay, -1);
  const monthFilters = { ...f, from: `${month.slice(0, 7)}-01`, to: end };
  const plan = await one<{ leads: number | null; revenue: number | null; currency: string }>(sql`
    SELECT leads, revenue::float8 AS revenue, currency FROM plans WHERE month = ${monthFilters.from}::date`);
  const [leads, revenue] = await Promise.all([countLeads(monthFilters), sumRevenue(monthFilters)]);
  let planRevenue = plan?.revenue ?? null;
  // A plan typed in the other currency is converted at today's rate.
  if (planRevenue !== null && plan && plan.currency !== f.currency) {
    const usd = await one<{ rate: number }>(sql`SELECT uzs_per_unit::float8 AS rate FROM fx_rates WHERE currency = 'USD' ORDER BY day DESC LIMIT 1`);
    planRevenue = usd?.rate ? (plan.currency === "USD" ? planRevenue * usd.rate : planRevenue / usd.rate) : null;
  }
  return {
    month: monthFilters.from,
    leadsPlan: plan?.leads ?? null,
    leadsFact: leads.leads,
    revenuePlan: planRevenue,
    revenueFact: revenue.revenue,
  };
}

// ---------------------------------------------------------------- channels (6.4)

type Group = "channel" | "campaign";

export async function channelReport(f: ReportFilters, group: Group = "channel") {
  const key = group === "channel" ? dealChannel("d", f.attribution) : sql.raw("d.campaign_id");
  const expenseKey = sql.raw(group === "channel" ? "e.channel_id" : "e.campaign_id");

  const dealsRows = await rows<{
    key: number | null; leads: number; qualified: number; meetings: number; clients: number;
    revenue: number; contract: number; paying: number; costs: number;
  }>(sql`
    WITH cohort AS (
      SELECT d.* FROM deals d
      WHERE ${between(tday("d.created_at"), f.from, f.to)} ${dealFilter("d", f)}
    ),
    reach AS (
      SELECT h.deal_id, max(s.position) FILTER (WHERE s.kind <> 'lost') AS max_pos
      FROM stage_history h JOIN stages s ON s.id = h.to_stage_id
      WHERE h.deal_id IN (SELECT id FROM cohort) GROUP BY h.deal_id
    ),
    paid AS (
      SELECT p.deal_id,
             sum(${stored("p", f.currency)} * (1 - p.commission_percent / 100))::float8 AS revenue,
             min(p.paid_on) AS first_paid
      FROM payments p WHERE p.deal_id IN (SELECT id FROM cohort) GROUP BY p.deal_id
    ),
    cost AS (
      SELECT c.deal_id, sum(${stored("c", f.currency)})::float8 AS costs
      FROM deal_costs c WHERE c.deal_id IN (SELECT id FROM cohort) GROUP BY c.deal_id
    )
    SELECT ${key} AS key,
      count(*)::int AS leads,
      count(*) FILTER (WHERE coalesce(r.max_pos, -1) >= (SELECT position FROM stages WHERE key = 'contacted')
                       AND (lr.key IS NULL OR lr.key NOT IN ('spam', 'not_target')))::int AS qualified,
      count(*) FILTER (WHERE coalesce(r.max_pos, -1) >= (SELECT position FROM stages WHERE key = 'meeting'))::int AS meetings,
      count(DISTINCT d.client_id) FILTER (WHERE pd.deal_id IS NOT NULL)::int AS clients,
      coalesce(sum(pd.revenue), 0)::float8 AS revenue,
      coalesce(sum(${convertAt(sql.raw("d.amount"), sql.raw("d.currency"), sql.raw("pd.first_paid"), f.currency)}) FILTER (WHERE pd.deal_id IS NOT NULL), 0)::float8 AS contract,
      count(*) FILTER (WHERE pd.deal_id IS NOT NULL AND d.amount IS NOT NULL)::int AS paying,
      coalesce(sum(co.costs), 0)::float8 AS costs
    FROM cohort d
    LEFT JOIN reach r ON r.deal_id = d.id
    LEFT JOIN paid pd ON pd.deal_id = d.id
    LEFT JOIN cost co ON co.deal_id = d.id
    LEFT JOIN loss_reasons lr ON lr.id = d.loss_reason_id
    GROUP BY 1`);

  const spendRows = await rows<{ key: number | null; expenses: number; impressions: number; clicks: number }>(sql`
    SELECT ${expenseKey} AS key, sum(${stored("e", f.currency)})::float8 AS expenses,
           coalesce(sum(e.impressions), 0)::int AS impressions, coalesce(sum(e.clicks), 0)::int AS clicks
    FROM expenses e
    WHERE ${between(sql.raw("e.spent_on"), f.from, f.to)} ${channelFilter("e.channel_id", f)}
    GROUP BY 1`);

  const visitRows = group === "channel"
    ? await rows<{ key: number | null; visits: number }>(sql`
        SELECT v.channel_id AS key, count(*)::int AS visits FROM visits v
        WHERE NOT v.is_bot AND v.interacted AND ${between(tday("v.started_at"), f.from, f.to)} ${channelFilter("v.channel_id", f)}
        GROUP BY 1`)
    : await rows<{ key: number | null; visits: number }>(sql`
        SELECT cp.id AS key, count(*)::int AS visits FROM visits v JOIN campaigns cp ON cp.utm_campaign = v.campaign
        WHERE NOT v.is_bot AND v.interacted AND ${between(tday("v.started_at"), f.from, f.to)} ${channelFilter("v.channel_id", f)}
        GROUP BY 1`);

  const keys = new Set<number | null>([...dealsRows.map((r) => r.key), ...spendRows.map((r) => r.key), ...visitRows.map((r) => r.key)]);
  return [...keys].map((k) => {
    const d = dealsRows.find((r) => r.key === k);
    const s = spendRows.find((r) => r.key === k);
    const v = visitRows.find((r) => r.key === k);
    const expenses = s?.expenses ?? 0;
    const leads = d?.leads ?? 0;
    const clients = d?.clients ?? 0;
    const revenue = d?.revenue ?? 0;
    const costs = d?.costs ?? 0;
    const impressions = s?.impressions ?? 0;
    const clicks = s?.clicks ?? 0;
    return {
      key: k,
      expenses,
      impressions,
      clicks,
      ctr: percent(clicks, impressions),
      cpc: expenses ? ratio(expenses, clicks) : null,
      visits: v?.visits ?? 0,
      leads,
      // A channel without spend (organic, referrals) has no CPL or CAC, not a zero one.
      cpl: expenses ? ratio(expenses, leads) : null,
      qualified: d?.qualified ?? 0,
      meetings: d?.meetings ?? 0,
      clients,
      leadToClient: percent(clients, leads),
      revenue,
      cac: expenses ? ratio(expenses, clients) : null,
      romi: expenses ? ((revenue - expenses) / expenses) * 100 : null,
      roi: expenses ? ((revenue - costs - expenses) / expenses) * 100 : null,
      averageCheck: d?.paying ? d.contract / d.paying : null,
    };
  });
}

// ---------------------------------------------------------------- loss reasons, LTV

export async function lossReasonsReport(f: ReportFilters) {
  return rows<{ reason: string | null; stage: string | null; n: number }>(sql`
    SELECT lr.name AS reason, fs.name AS stage, count(*)::int AS n
    FROM deals d
    JOIN stages s ON s.id = d.stage_id AND s.kind = 'lost'
    LEFT JOIN loss_reasons lr ON lr.id = d.loss_reason_id
    LEFT JOIN LATERAL (
      SELECT h.from_stage_id FROM stage_history h WHERE h.deal_id = d.id AND h.to_stage_id = d.stage_id ORDER BY h.at DESC LIMIT 1
    ) last_move ON true
    LEFT JOIN stages fs ON fs.id = last_move.from_stage_id
    WHERE ${between(tday("d.closed_at"), f.from, f.to)} ${dealFilter("d", f)}
    GROUP BY 1, 2 ORDER BY 3 DESC`);
}

/** Average lifetime revenue per paying client, by the client's first channel. */
export async function ltvByChannel(currency: ReportFilters["currency"]) {
  return rows<{ channel_id: number | null; clients: number; ltv: number }>(sql`
    WITH per_client AS (
      SELECT c.id, c.first_channel_id, sum(${stored("p", currency)} * (1 - p.commission_percent / 100))::float8 AS revenue
      FROM clients c JOIN deals d ON d.client_id = c.id JOIN payments p ON p.deal_id = d.id
      GROUP BY c.id
    )
    SELECT first_channel_id AS channel_id, count(*)::int AS clients, avg(revenue)::float8 AS ltv
    FROM per_client GROUP BY 1`);
}

