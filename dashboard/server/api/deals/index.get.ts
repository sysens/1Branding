// The funnel's deals, for the board and the list view (spec 6.2). Open deals
// always; won and lost ones closed within the last `closedDays` (30) days.
import { sql } from "drizzle-orm";
import { workingMsBetween, type WorkSchedule } from "../../../shared/utils/time";
import { requireUser } from "../../utils/auth";
import { rows } from "../../utils/db";
import { isDay } from "../../utils/http";
import { idList, tday } from "../../utils/report-sql";
import { getSetting } from "../../utils/settings";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const query = getQuery(event);
  const ids = (value: unknown) => String(value ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const channelIds = ids(query.channels);
  const serviceIds = ids(query.services);
  const stageIds = ids(query.stages);
  const ownerId = Number(query.owner) || null;
  const closedDays = Math.min(Math.max(Number(query.closedDays) || 30, 1), 3650);
  const search = String(query.q ?? "").trim().slice(0, 100);
  const attribution = query.attribution === "first" ? "first_channel_id" : "last_channel_id";

  const where = [sql`(s.kind = 'open' OR d.closed_at > now() - make_interval(days => ${closedDays}))`];
  if (channelIds.length) where.push(sql`${sql.raw(`d.${attribution}`)} IN (${idList(channelIds)})`);
  if (serviceIds.length) where.push(sql`(${sql.join(serviceIds.map((id) => sql`d.service_ids @> ${JSON.stringify([id])}::jsonb`), sql` OR `)})`);
  if (stageIds.length) where.push(sql`d.stage_id IN (${idList(stageIds)})`);
  if (ownerId) where.push(sql`d.owner_id = ${ownerId}`);
  if (query.origin) where.push(sql`d.origin = ${String(query.origin)}`);
  if (query.repeat === "1") where.push(sql`d.is_repeat`);
  if (isDay(query.from) && isDay(query.to)) where.push(sql`${tday("d.created_at")} BETWEEN ${query.from}::date AND ${query.to}::date`);
  if (search) {
    const like = `%${search.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    const digits = search.replace(/\D/g, "");
    where.push(sql`(d.title ILIKE ${like} OR d.contact_name ILIKE ${like} OR c.name ILIKE ${like} OR c.telegram ILIKE ${like}
      OR d.contact_code ILIKE ${like} OR d.id::text = ${search}
      ${digits.length >= 5 ? sql`OR regexp_replace(coalesce(c.phone, '') || coalesce(c.whatsapp, ''), '\\D', '', 'g') LIKE ${`%${digits}%`}` : sql``})`);
  }

  const list = await rows<{
    id: number; title: string | null; contact_name: string | null; client_id: number | null; client: string | null;
    stage_id: number; stage_key: string; stage_kind: string; amount: number | null; currency: string; service_ids: number[];
    channel_id: number | null; origin: string; is_repeat: boolean; created_at: string; stage_changed_at: string;
    first_response_at: string | null; owner_id: number | null; paid: number; open_tasks: number; phone: string | null; telegram: string | null;
  }>(sql`
    SELECT d.id, d.title, d.contact_name, d.client_id, c.name AS client, d.stage_id, s.key AS stage_key, s.kind AS stage_kind,
           d.amount::float8 AS amount, d.currency, d.service_ids, ${sql.raw(`d.${attribution}`)} AS channel_id, d.origin, d.is_repeat,
           d.created_at, d.stage_changed_at, d.first_response_at, d.owner_id, c.phone, c.telegram,
           coalesce((SELECT sum(p.amount * p.uzs_per_unit / (CASE WHEN d.currency = 'UZS' THEN 1 WHEN d.currency = 'USD' THEN p.uzs_per_usd ELSE p.uzs_per_unit END))
                     FROM payments p WHERE p.deal_id = d.id), 0)::float8 AS paid,
           (SELECT count(*)::int FROM tasks t WHERE t.deal_id = d.id AND NOT t.done) AS open_tasks
    FROM deals d
    JOIN stages s ON s.id = d.stage_id
    LEFT JOIN clients c ON c.id = d.client_id
    WHERE ${sql.join(where, sql` AND `)}
    ORDER BY d.stage_changed_at DESC
    LIMIT 2000`);

  // Flags of spec 6.2: "New" without contact for 15 working minutes, any deal idle for N days.
  const schedule = await getSetting<WorkSchedule>("workSchedule");
  const target = (Number(await getSetting<number>("responseTargetMinutes")) || 15) * 60_000;
  const staleMs = (Number(await getSetting<number>("staleDays")) || 5) * 86_400_000;
  const now = Date.now();
  return list.map((deal) => {
    const created = Date.parse(String(deal.created_at));
    const changed = Date.parse(String(deal.stage_changed_at));
    return {
      ...deal,
      days_on_stage: Math.max(0, Math.floor((now - changed) / 86_400_000)),
      overdue: deal.stage_key === "new" && !deal.first_response_at && workingMsBetween(created, now, schedule) > target,
      stale: deal.stage_kind === "open" && now - changed > staleMs,
    };
  });
});
