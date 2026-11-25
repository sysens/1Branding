// The deal card (spec 6.3): contacts, terms, costs, the client's path on the
// site, payments and balance, stage history, notes, tasks, conversation, and
// the client's other deals.
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  campaigns, channels, clients, contactCodes, dealCosts, deals, events, industries, lossReasons, messages, notes, payments,
  stageHistory, stages, tasks, users, visitors, visits,
} from "../../db/schema";
import { requireUser } from "../../utils/auth";
import { one, useDb } from "../../utils/db";
import { idParam, notFound } from "../../utils/http";
import { getSetting } from "../../utils/settings";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const id = idParam(event);
  const db = useDb();
  const [deal] = await db.select().from(deals).where(eq(deals.id, id));
  if (!deal) throw notFound("Сделка");

  const [client] = deal.clientId ? await db.select().from(clients).where(eq(clients.id, deal.clientId)) : [];
  const [industry] = client?.industryId ? await db.select().from(industries).where(eq(industries.id, client.industryId)) : [];
  const [campaign] = deal.campaignId ? await db.select().from(campaigns).where(eq(campaigns.id, deal.campaignId)) : [];
  const [reason] = deal.lossReasonId ? await db.select().from(lossReasons).where(eq(lossReasons.id, deal.lossReasonId)) : [];

  const [paymentRows, costRows, noteRows, taskRows, historyRows, messageRows, otherDeals] = await Promise.all([
    db.select().from(payments).where(eq(payments.dealId, id)).orderBy(asc(payments.paidOn), asc(payments.id)),
    db.select().from(dealCosts).where(eq(dealCosts.dealId, id)).orderBy(asc(dealCosts.spentOn)),
    db.select({ note: notes, author: users.name }).from(notes).leftJoin(users, eq(users.id, notes.createdBy))
      .where(eq(notes.dealId, id)).orderBy(desc(notes.createdAt)),
    db.select().from(tasks).where(eq(tasks.dealId, id)).orderBy(asc(tasks.done), asc(tasks.dueOn)),
    db.select({ h: stageHistory, user: users.name, to: stages.name })
      .from(stageHistory).leftJoin(users, eq(users.id, stageHistory.userId)).leftJoin(stages, eq(stages.id, stageHistory.toStageId))
      .where(eq(stageHistory.dealId, id)).orderBy(asc(stageHistory.at)),
    db.select().from(messages).where(eq(messages.dealId, id)).orderBy(asc(messages.at)).limit(500),
    deal.clientId
      ? db.select({ id: deals.id, title: deals.title, amount: deals.amount, currency: deals.currency, stageId: deals.stageId, createdAt: deals.createdAt })
        .from(deals).where(and(eq(deals.clientId, deal.clientId), ne(deals.id, id))).orderBy(desc(deals.createdAt))
      : Promise.resolve([]),
  ]);
  const stageNames = new Map((await db.select().from(stages)).map((s) => [s.id, s.name]));

  // What has been paid, in the deal's currency (each payment at its own day's rate).
  const paid = paymentRows.reduce((sum, p) => {
    const inUzs = p.amount * p.uzsPerUnit;
    const value = deal.currency === "UZS" ? inUzs : deal.currency === "USD" ? inUzs / p.uzsPerUsd : deal.currency === p.currency ? p.amount : inUzs / p.uzsPerUnit;
    return sum + value;
  }, 0);

  // The client's path on the site, from the visitor id (form or contact code).
  let journey = null;
  if (deal.visitorId) {
    const [visitor] = await db.select().from(visitors).where(eq(visitors.id, deal.visitorId));
    const visitRows = await db.select().from(visits).where(eq(visits.visitorId, deal.visitorId)).orderBy(asc(visits.startedAt)).limit(100);
    const eventRows = await db.select().from(events).where(eq(events.visitorId, deal.visitorId)).orderBy(asc(events.at)).limit(400);
    const before = visitRows.filter((v) => v.startedAt <= deal.createdAt);
    const channelNames = new Map((await db.select({ id: channels.id, name: channels.name }).from(channels)).map((c) => [c.id, c.name]));
    const links = await getSetting<Record<string, string>>("links");
    const counter = String(links?.metrikaCounterId ?? "").trim();
    journey = {
      visitor,
      visits: visitRows.map((v) => ({ ...v, channel: v.channelId ? channelNames.get(v.channelId) ?? null : null })),
      events: eventRows,
      visitsBeforeLead: before.length,
      activeSecondsBeforeLead: before.reduce((sum, v) => sum + v.activeSeconds, 0),
      pagesBeforeLead: [...new Set(eventRows.filter((e) => e.name === "page_view" && e.at <= deal.createdAt).map((e) => e.page))],
      // Webvisor of this visitor in Metrika, by its ClientID.
      webvisorUrl: counter && visitor?.ymClientId
        ? `https://metrika.yandex.ru/stat/visor?id=${encodeURIComponent(counter)}&period=year&filter=${encodeURIComponent(`(ym:s:clientID=='${visitor.ymClientId}')`)}`
        : null,
    };
  }
  const code = deal.contactCode
    ? (await db.select().from(contactCodes).where(eq(contactCodes.code, deal.contactCode)))[0] ?? null
    : null;
  const services = deal.serviceIds.length
    ? await one<{ names: string[] }>(sql`SELECT array_agg(name ORDER BY position) AS names FROM services WHERE id IN (${sql.join(deal.serviceIds.map((s) => sql`${s}`), sql`, `)})`)
    : null;
  const taskUsers = taskRows.length
    ? new Map((await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, taskRows.map((t) => t.assigneeId ?? 0)))).map((u) => [u.id, u.name]))
    : new Map();

  return {
    deal,
    client: client ?? null,
    industry: industry ?? null,
    campaign: campaign ?? null,
    lossReason: reason ?? null,
    serviceNames: services?.names ?? [],
    payments: paymentRows,
    paid,
    remaining: deal.amount !== null ? Math.max(0, deal.amount - paid) : null,
    costs: costRows,
    notes: noteRows.map((n) => ({ ...n.note, author: n.author })),
    tasks: taskRows.map((t) => ({ ...t, assignee: t.assigneeId ? taskUsers.get(t.assigneeId) ?? null : null })),
    history: historyRows.map((row) => ({
      ...row.h,
      user: row.user,
      to: row.to,
      from: row.h.fromStageId ? stageNames.get(row.h.fromStageId) ?? null : null,
    })),
    messages: messageRows,
    otherDeals: otherDeals.map((d) => ({ ...d, stage: stageNames.get(d.stageId) ?? null })),
    contactCode: code,
    journey,
  };
});
