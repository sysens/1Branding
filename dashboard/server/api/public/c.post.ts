// The site's tracker (frontend/app/plugins/ob-tracker.client.ts): a batch of
// a visitor's events. Records the visitor (first and last significant touch,
// GA / Metrika / Meta ids), the visit and its events, and answers with the
// visitor's contact code for the messenger buttons (spec 3.2, 4.2).
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { contactCodes, events, visitors, visits, type Touch } from "../../db/schema";
import { channelIdForTouch } from "../../utils/channels";
import { one, useDb } from "../../utils/db";
import { markIntegration } from "../../utils/integrations";
import { isBotUserAgent, publicClient, readJsonBody } from "../../utils/public-request";
import { allow } from "../../utils/rate-limit";

const text = (max: number) => z.string().max(2000).transform((value) => value.slice(0, max)).optional();
const touchSchema = z.object({
  src: text(150), med: text(150), cmp: text(200), cnt: text(200), trm: text(200),
  gclid: text(300), yclid: text(300), fbclid: text(300), ref: text(500), land: text(500),
  at: z.number().optional(),
}).partial().nullable().optional();

const payloadSchema = z.object({
  v: z.number().optional(),
  vid: z.uuid(),
  sid: z.uuid(),
  first: touchSchema,
  last: touchSchema,
  ids: z.object({ ga: text(100), ym: text(100), fbp: text(200), fbc: text(400) }).partial().optional(),
  ctx: z.object({ lang: text(8), device: z.enum(["mobile", "tablet", "desktop"]).optional(), sw: z.number().optional() }).partial().optional(),
  ev: z.array(z.object({
    id: z.uuid(),
    n: z.string().regex(/^[a-z0-9_]{2,40}$/),
    t: z.number(),
    p: text(500),
    q: z.record(z.string(), z.unknown()).optional(),
  })).max(100),
});

const SCROLL = /^scroll_(\d{2})$/;
let lastMarked = 0;

const cleanTouch = (touch: z.infer<typeof touchSchema>): Touch | null => {
  if (!touch) return null;
  const entries = Object.entries(touch).filter(([, value]) => value !== undefined && value !== "");
  return entries.length ? (Object.fromEntries(entries) as Touch) : null;
};

const cleanParams = (params?: Record<string, unknown>) => {
  if (!params) return null;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params).slice(0, 12)) {
    if (typeof value === "string") out[key.slice(0, 40)] = value.slice(0, 300);
    else if (typeof value === "number" && Number.isFinite(value)) out[key.slice(0, 40)] = value;
    else if (typeof value === "boolean") out[key.slice(0, 40)] = value;
  }
  return out;
};

async function contactCodeFor(visitorId: string): Promise<string> {
  const db = useDb();
  const [existing] = await db.select({ code: contactCodes.code }).from(contactCodes)
    .where(eq(contactCodes.visitorId, visitorId)).orderBy(contactCodes.createdAt).limit(1);
  if (existing) return existing.code;
  const row = await one<{ next: number }>(sql`SELECT nextval('contact_code_seq')::int AS next`);
  const code = `OB-${row?.next}`;
  await db.insert(contactCodes).values({ code, visitorId }).onConflictDoNothing();
  return code;
}

export default defineEventHandler(async (event) => {
  const client = publicClient(event);
  if (!allow(`collect:${client.ip}`, 120, 60_000)) {
    setResponseStatus(event, 429);
    return { ok: false };
  }
  const parsed = payloadSchema.safeParse(await readJsonBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, message: "invalid payload" });
  const body = parsed.data;
  const db = useDb();
  const now = Date.now();
  const isBot = isBotUserAgent(client.userAgent);

  const first = cleanTouch(body.first);
  const last = cleanTouch(body.last);
  const ids = body.ids ?? {};
  const [firstChannelId, lastChannelId] = await Promise.all([channelIdForTouch(first), channelIdForTouch(last ?? first)]);

  // The visitor: created on the first batch, its last touch and ids kept up to date.
  await db.insert(visitors).values({
    id: body.vid,
    firstTouch: first,
    lastTouch: last ?? first,
    firstChannelId,
    lastChannelId,
    gaClientId: ids.ga || null,
    ymClientId: ids.ym || null,
    fbp: ids.fbp || null,
    fbc: ids.fbc || null,
    device: body.ctx?.device ?? null,
    language: body.ctx?.lang ?? null,
    isBot,
  }).onConflictDoUpdate({
    target: visitors.id,
    set: {
      lastSeenAt: new Date(),
      ...(last ? { lastTouch: last, lastChannelId } : {}),
      ...(ids.ga ? { gaClientId: ids.ga } : {}),
      ...(ids.ym ? { ymClientId: ids.ym } : {}),
      ...(ids.fbp ? { fbp: ids.fbp } : {}),
      ...(ids.fbc ? { fbc: ids.fbc } : {}),
      ...(body.ctx?.device ? { device: body.ctx.device } : {}),
      ...(body.ctx?.lang ? { language: body.ctx.lang } : {}),
    },
  });

  // Events: times outside "a day ago … 5 minutes ahead" are taken as now.
  const list = body.ev.map((e) => ({ ...e, t: e.t > now - 86_400_000 && e.t < now + 300_000 ? e.t : now }));
  const real = list.filter((e) => e.n !== "page_time");
  const pageTimes = list.filter((e) => e.n === "page_time");
  const times = list.map((e) => e.t);
  const start = new Date(times.length ? Math.min(...times) : now);
  const end = new Date(times.length ? Math.max(...times) : now);
  const pageViews = real.filter((e) => e.n === "page_view").length;
  const scroll = Math.max(0, ...real.map((e) => Number(SCROLL.exec(e.n)?.[1] ?? 0)));
  const interacted = real.some((e) => e.n !== "page_view") || pageTimes.some((e) => Number(e.q?.s) > 0);
  const landing = real.find((e) => e.n === "page_view")?.p ?? null;

  await db.insert(visits).values({
    id: body.sid,
    visitorId: body.vid,
    startedAt: start,
    endedAt: end,
    touch: last ?? first,
    channelId: lastChannelId,
    campaign: (last ?? first)?.cmp ?? null,
    landing,
    device: body.ctx?.device ?? null,
    language: body.ctx?.lang ?? null,
    userAgent: client.userAgent,
    isBot,
    pageViews,
    activeSeconds: 0,
    maxScroll: scroll,
    interacted,
  }).onConflictDoUpdate({
    target: visits.id,
    set: {
      endedAt: sql`greatest(${visits.endedAt}, ${end})`,
      startedAt: sql`least(${visits.startedAt}, ${start})`,
      pageViews: sql`${visits.pageViews} + ${pageViews}`,
      maxScroll: sql`greatest(${visits.maxScroll}, ${scroll})`,
      interacted: sql`${visits.interacted} OR ${interacted}`,
      ...(landing ? { landing: sql`coalesce(${visits.landing}, ${landing})` } : {}),
    },
  });

  if (real.length) {
    await db.insert(events).values(real.map((e) => ({
      id: e.id,
      visitorId: body.vid,
      visitId: body.sid,
      at: new Date(e.t),
      name: e.n,
      page: e.p ?? null,
      params: cleanParams(e.q),
    }))).onConflictDoNothing({ target: events.id });
  }

  // Time on a page: the tracker sends the page view's total active seconds so
  // far (again on every hide), so the page_view keeps the largest value and
  // its visit gains only the difference.
  for (const e of pageTimes) {
    const pv = typeof e.q?.pv === "string" ? e.q.pv : "";
    const seconds = Math.max(0, Math.min(3600, Math.round(Number(e.q?.s) || 0)));
    if (!/^[0-9a-f-]{36}$/i.test(pv) || !seconds) continue;
    const [view] = await db.select({ activeSeconds: events.activeSeconds, visitId: events.visitId }).from(events)
      .where(and(eq(events.id, pv), eq(events.visitorId, body.vid)));
    if (!view) continue;
    const gained = seconds - (view.activeSeconds ?? 0);
    if (gained <= 0) continue;
    await db.update(events).set({ activeSeconds: seconds }).where(eq(events.id, pv));
    await db.update(visits).set({ activeSeconds: sql`${visits.activeSeconds} + ${gained}`, interacted: true })
      .where(eq(visits.id, view.visitId ?? body.sid));
  }

  // A messenger button with its code: remember the click on the code.
  for (const e of real.filter((item) => item.n === "messenger_click")) {
    const code = String(e.q?.code ?? "").toUpperCase();
    const channel = String(e.q?.channel ?? "").slice(0, 20) || null;
    if (!/^OB-\d{4,8}$/.test(code)) continue;
    await db.insert(contactCodes).values({ code, visitorId: body.vid, channel, clickedAt: new Date(e.t) })
      .onConflictDoUpdate({ target: contactCodes.code, set: { channel, clickedAt: new Date(e.t) }, where: eq(contactCodes.visitorId, body.vid) });
  }

  if (now - lastMarked > 60_000) {
    lastMarked = now;
    await markIntegration("tracker", { ok: true });
  }
  if (isBot) return { ok: true };
  return { ok: true, code: await contactCodeFor(body.vid) };
});
