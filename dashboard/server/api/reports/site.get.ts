// The site (spec 6.5): the site funnel of 3.3, visits by day / source /
// device / language, time and scroll depth by page, exit pages, CTA clicks,
// abandoned forms, messenger clicks against real conversations.
import { sql } from "drizzle-orm";
import { requireUser } from "../../utils/auth";
import { rows } from "../../utils/db";
import { requestFilters } from "../../utils/report-filters";
import { between, channelFilter, tday } from "../../utils/report-sql";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const f = await requestFilters(event);
  const visitWhere = sql`NOT v.is_bot AND v.interacted AND ${between(tday("v.started_at"), f.from, f.to)} ${channelFilter("v.channel_id", f)}`;

  // Each visit's furthest step: engaged (≥30 s or ≥50 % scroll) → services or prices
  // → CTA → form opened → started → sent (or wrote in a messenger).
  const steps = await rows<{ step: number; n: number }>(sql`
    WITH vs AS (SELECT v.id, v.active_seconds, v.max_scroll FROM visits v WHERE ${visitWhere}),
    ev AS (
      SELECT e.visit_id,
        bool_or(e.name = 'view_pricing' OR (e.name = 'page_view' AND (e.page LIKE '%/services%' OR e.page LIKE '%/pricing%'))) AS viewed,
        bool_or(e.name = 'cta_click') AS cta,
        bool_or(e.name = 'form_open') AS fopen,
        bool_or(e.name = 'form_start') AS fstart,
        bool_or(e.name IN ('form_submit', 'messenger_click')) AS done,
        bool_or(e.name LIKE 'engaged_%' OR e.name IN ('scroll_50', 'scroll_75', 'scroll_90')) AS engaged
      FROM events e WHERE e.visit_id IN (SELECT id FROM vs) GROUP BY e.visit_id
    )
    SELECT (CASE WHEN ev.done THEN 6 WHEN ev.fstart THEN 5 WHEN ev.fopen THEN 4 WHEN ev.cta THEN 3 WHEN ev.viewed THEN 2
                 WHEN ev.engaged OR vs.active_seconds >= 30 OR vs.max_scroll >= 50 THEN 1 ELSE 0 END) AS step,
           count(*)::int AS n
    FROM vs LEFT JOIN ev ON ev.visit_id = vs.id GROUP BY 1`);
  const names = ["Визиты", "Вовлечённые", "Услуги или цены", "Клик по CTA", "Открыли форму", "Начали заполнять", "Заявка или мессенджер"];
  const funnel = names.map((name, index) => ({ name, count: steps.filter((s) => s.step >= index).reduce((sum, s) => sum + s.n, 0) }));

  const [byDay, byChannel, byDevice, byLanguage, totals, pages, exits, cta, forms, messengers, dialogs] = await Promise.all([
    rows<{ day: string; visits: number; visitors: number }>(sql`
      SELECT ${tday("v.started_at")}::text AS day, count(*)::int AS visits, count(DISTINCT v.visitor_id)::int AS visitors
      FROM visits v WHERE ${visitWhere} GROUP BY 1 ORDER BY 1`),
    rows<{ channel_id: number | null; visits: number }>(sql`
      SELECT v.channel_id, count(*)::int AS visits FROM visits v WHERE ${visitWhere} GROUP BY 1 ORDER BY 2 DESC`),
    rows<{ device: string | null; visits: number }>(sql`
      SELECT v.device, count(*)::int AS visits FROM visits v WHERE ${visitWhere} GROUP BY 1 ORDER BY 2 DESC`),
    rows<{ language: string | null; visits: number }>(sql`
      SELECT v.language, count(*)::int AS visits FROM visits v WHERE ${visitWhere} GROUP BY 1 ORDER BY 2 DESC`),
    rows<{ visits: number; avg_active: number; avg_pages: number }>(sql`
      SELECT count(*)::int AS visits, coalesce(avg(v.active_seconds), 0)::float8 AS avg_active, coalesce(avg(v.page_views), 0)::float8 AS avg_pages
      FROM visits v WHERE ${visitWhere}`),
    rows<{ page: string; views: number; avg_active: number; scroll50: number; scroll90: number }>(sql`
      WITH vs AS (SELECT v.id FROM visits v WHERE ${visitWhere}),
      pv AS (SELECT e.visit_id, split_part(e.page, '?', 1) AS page, e.active_seconds FROM events e WHERE e.name = 'page_view' AND e.visit_id IN (SELECT id FROM vs)),
      sc AS (SELECT e.visit_id, split_part(e.page, '?', 1) AS page, max(substring(e.name FROM 8)::int) AS depth
             FROM events e WHERE e.name LIKE 'scroll\\_%' AND e.visit_id IN (SELECT id FROM vs) GROUP BY 1, 2)
      SELECT pv.page, count(*)::int AS views, coalesce(avg(pv.active_seconds), 0)::float8 AS avg_active,
             (count(DISTINCT pv.visit_id) FILTER (WHERE sc.depth >= 50))::int AS scroll50,
             (count(DISTINCT pv.visit_id) FILTER (WHERE sc.depth >= 90))::int AS scroll90
      FROM pv LEFT JOIN sc ON sc.visit_id = pv.visit_id AND sc.page = pv.page
      GROUP BY pv.page ORDER BY views DESC LIMIT 30`),
    rows<{ page: string; exits: number }>(sql`
      WITH vs AS (SELECT v.id FROM visits v WHERE ${visitWhere}),
      last_pv AS (SELECT DISTINCT ON (e.visit_id) e.visit_id, split_part(e.page, '?', 1) AS page FROM events e
                  WHERE e.name = 'page_view' AND e.visit_id IN (SELECT id FROM vs) ORDER BY e.visit_id, e.at DESC)
      SELECT page, count(*)::int AS exits FROM last_pv GROUP BY 1 ORDER BY 2 DESC LIMIT 15`),
    rows<{ button: string; page: string; clicks: number }>(sql`
      SELECT coalesce(e.params ->> 'button', '—') AS button, split_part(coalesce(e.params ->> 'page', e.page), '?', 1) AS page, count(*)::int AS clicks
      FROM events e JOIN visits v ON v.id = e.visit_id
      WHERE e.name = 'cta_click' AND ${visitWhere} GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 30`),
    rows<{ opened: number; started: number; sent: number }>(sql`
      SELECT count(DISTINCT e.visit_id) FILTER (WHERE e.name = 'form_open')::int AS opened,
             count(DISTINCT e.visit_id) FILTER (WHERE e.name = 'form_start')::int AS started,
             count(DISTINCT e.visit_id) FILTER (WHERE e.name = 'form_submit')::int AS sent
      FROM events e JOIN visits v ON v.id = e.visit_id WHERE ${visitWhere}`),
    rows<{ channel: string; clicks: number }>(sql`
      SELECT coalesce(e.params ->> 'channel', '—') AS channel, count(*)::int AS clicks
      FROM events e JOIN visits v ON v.id = e.visit_id WHERE e.name = 'messenger_click' AND ${visitWhere} GROUP BY 1`),
    rows<{ origin: string; n: number }>(sql`
      SELECT d.origin, count(*)::int AS n FROM deals d
      WHERE d.origin IN ('telegram', 'whatsapp', 'instagram') AND ${between(tday("d.created_at"), f.from, f.to)}
      GROUP BY 1`),
  ]);

  return {
    filters: f,
    funnel,
    totals: totals[0] ?? { visits: 0, avg_active: 0, avg_pages: 0 },
    byDay,
    byChannel,
    byDevice,
    byLanguage,
    pages,
    exits,
    cta,
    forms: forms[0] ?? { opened: 0, started: 0, sent: 0 },
    messengers: messengers.map((m) => ({ ...m, dialogs: dialogs.find((d) => d.origin === m.channel)?.n ?? 0 })),
  };
});
