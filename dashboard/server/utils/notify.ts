// Messages to the owners' Telegram chat (spec 9). Each kind can be switched
// off in Settings → Notifications.
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { CONTACT_METHOD_LABELS, PAYMENT_KIND_LABELS } from "../../shared/utils/constants";
import { tashkentDay } from "../../shared/utils/time";
import { campaigns, channels, clients, deals, payments, services, tasks } from "../db/schema";
import { phoneDigits } from "./contacts";
import { one, rows, useDb } from "./db";
import { getSetting } from "./settings";
import { escapeHtml as h, sendToOwners, type InlineButton } from "./telegram";

export type NotificationKind = "newLead" | "unanswered" | "payment" | "dailyTasks" | "daySummary" | "weekSummary" | "integrationFailure";

const appUrl = () => String(useRuntimeConfig().public.appUrl || "").replace(/\/$/, "");

async function enabled(kind: NotificationKind) {
  const value = await getSetting<Record<string, boolean>>("notifications");
  return value?.[kind] !== false;
}

export const money = (amount: number | null | undefined, currency: string) => {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return "—";
  const digits = currency === "UZS" ? 0 : Math.abs(amount) < 100 ? 2 : 0;
  const text = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(amount);
  return currency === "USD" ? `$${text}` : `${text} ${currency === "UZS" ? "сум" : currency}`;
};

function contactButtons(client: { phone: string | null; telegram: string | null; whatsapp: string | null } | null, dealId: number): InlineButton[][] {
  const row: InlineButton[] = [];
  const phone = client?.phone || client?.whatsapp;
  if (phone) row.push({ text: "Позвонить", url: `${appUrl()}/r/call?to=${encodeURIComponent(phone)}` });
  if (client?.telegram) row.push({ text: "Telegram", url: `https://t.me/${client.telegram}` });
  else if (phone) row.push({ text: "Telegram", url: `https://t.me/+${phoneDigits(phone)}` });
  if (client?.whatsapp || client?.phone) row.push({ text: "WhatsApp", url: `https://wa.me/${phoneDigits(client.whatsapp || client.phone)}` });
  return [row, [{ text: "Открыть в дашборде", url: `${appUrl()}/deals/${dealId}` }]];
}

export async function notifyNewLead(dealId: number) {
  if (!(await enabled("newLead"))) return;
  const db = useDb();
  const [row] = await db.select({ deal: deals, client: clients, channel: channels.name, campaign: campaigns.name })
    .from(deals)
    .leftJoin(clients, eq(clients.id, deals.clientId))
    .leftJoin(channels, eq(channels.id, deals.lastChannelId))
    .leftJoin(campaigns, eq(campaigns.id, deals.campaignId))
    .where(eq(deals.id, dealId));
  if (!row) return;
  const serviceNames = row.deal.serviceIds.length
    ? (await db.select({ name: services.name }).from(services).where(inArray(services.id, row.deal.serviceIds))).map((s) => s.name)
    : [];
  const contact = row.client?.telegram ? `@${row.client.telegram}` : row.client?.phone || row.client?.whatsapp || "—";
  const lines = [
    `🆕 <b>Новая заявка #${row.deal.id}</b>${row.deal.isRepeat ? " · повторное обращение" : ""}`,
    `${h(row.deal.contactName || "Без имени")}${row.client?.name && row.client.name !== row.deal.contactName ? ` · ${h(row.client.name)}` : ""}`,
    serviceNames.length ? `Услуга: ${h(serviceNames.join(", "))}` : "",
    `Связь: ${h(CONTACT_METHOD_LABELS[row.deal.contactMethod ?? ""] ?? row.deal.origin)} · ${h(contact)}`,
    `Канал: ${h(row.channel || "—")}${row.campaign ? ` · ${h(row.campaign)}` : ""}`,
  ].filter(Boolean);
  await sendToOwners(lines.join("\n"), contactButtons(row.client, row.deal.id));
}

export async function notifyPayment(paymentId: number) {
  if (!(await enabled("payment"))) return;
  const db = useDb();
  const [row] = await db.select({ payment: payments, deal: deals, client: clients })
    .from(payments).innerJoin(deals, eq(deals.id, payments.dealId)).leftJoin(clients, eq(clients.id, deals.clientId))
    .where(eq(payments.id, paymentId));
  if (!row) return;
  const paid = await one<{ paid: number }>(sql`
    SELECT coalesce(sum(p.amount * p.uzs_per_unit / (CASE WHEN ${row.deal.currency} = 'UZS' THEN 1 WHEN ${row.deal.currency} = 'USD' THEN p.uzs_per_usd ELSE p.uzs_per_unit END)), 0)::float8 AS paid
    FROM payments p WHERE p.deal_id = ${row.deal.id}`);
  const remaining = row.deal.amount !== null ? Math.max(0, row.deal.amount - (paid?.paid ?? 0)) : null;
  await sendToOwners([
    `💰 <b>Платёж внесён</b> · ${h(PAYMENT_KIND_LABELS[row.payment.kind])}`,
    `${h(row.client?.name || row.deal.title || `Сделка #${row.deal.id}`)}`,
    `Сумма: <b>${h(money(row.payment.amount, row.payment.currency))}</b>`,
    `Остаток: ${remaining === null ? "сумма сделки не указана" : h(money(remaining, row.deal.currency))}`,
  ].join("\n"), [[{ text: "Открыть сделку", url: `${appUrl()}/deals/${row.deal.id}` }]]);
}

export async function notifyUnanswered(list: Array<{ id: number; name: string; minutes: number }>) {
  if (!list.length || !(await enabled("unanswered"))) return;
  const lines = list.map((item) => `• #${item.id} ${h(item.name)} — ждёт ${Math.round(item.minutes)} мин`);
  await sendToOwners([`⏰ <b>Заявки без ответа</b>`, ...lines].join("\n"),
    list.slice(0, 3).map((item) => [{ text: `Открыть #${item.id}`, url: `${appUrl()}/deals/${item.id}` }]));
}

export async function notifyDailyTasks() {
  if (!(await enabled("dailyTasks"))) return;
  const today = tashkentDay();
  const list = await useDb().select({ task: tasks, title: deals.title }).from(tasks)
    .leftJoin(deals, eq(deals.id, tasks.dealId))
    .where(and(eq(tasks.done, false), lte(tasks.dueOn, today)))
    .orderBy(tasks.dueOn);
  if (!list.length) return;
  const overdue = list.filter((item) => item.task.dueOn! < today);
  const due = list.filter((item) => item.task.dueOn === today);
  const line = (item: (typeof list)[number]) => `• ${h(item.task.text)}${item.title ? ` — ${h(item.title)}` : ""}${item.task.dueOn! < today ? ` (срок ${item.task.dueOn!.split("-").reverse().join(".")})` : ""}`;
  await sendToOwners([
    `📋 <b>Задачи на сегодня</b>`,
    ...due.map(line),
    ...(overdue.length ? ["", `<b>Просрочено: ${overdue.length}</b>`, ...overdue.map(line)] : []),
  ].join("\n"), [[{ text: "Открыть задачи", url: `${appUrl()}/tasks` }]]);
}

/** Leads, spend, CPL, payments and stuck deals of a day. */
export async function notifyDaySummary(day = tashkentDay()) {
  if (!(await enabled("daySummary"))) return;
  const currency = (await getSetting<string>("reportCurrency")) === "UZS" ? "UZS" : "USD";
  const conv = currency === "USD" ? sql.raw("x.uzs_per_usd") : sql.raw("1");
  const stats = await one<{ leads: number; spend: number; paid: number; payments: number }>(sql`
    SELECT
      (SELECT count(*)::int FROM deals d WHERE ((d.created_at + interval '5 hours')::date) = ${day}::date) AS leads,
      (SELECT coalesce(sum(x.amount * x.uzs_per_unit / ${conv}), 0)::float8 FROM expenses x WHERE x.spent_on = ${day}::date) AS spend,
      (SELECT coalesce(sum(x.amount * x.uzs_per_unit / ${conv} * (1 - x.commission_percent / 100)), 0)::float8 FROM payments x WHERE x.paid_on = ${day}::date) AS paid,
      (SELECT count(*)::int FROM payments x WHERE x.paid_on = ${day}::date) AS payments`);
  const staleDays = Number(await getSetting<number>("staleDays")) || 5;
  const stale = await rows<{ id: number; title: string; days: number }>(sql`
    SELECT d.id, coalesce(d.title, '') AS title, floor(extract(epoch FROM now() - d.stage_changed_at) / 86400)::int AS days
    FROM deals d JOIN stages s ON s.id = d.stage_id
    WHERE s.kind = 'open' AND d.stage_changed_at < now() - make_interval(days => ${staleDays})
    ORDER BY d.stage_changed_at LIMIT 10`);
  const leads = stats?.leads ?? 0;
  const spend = stats?.spend ?? 0;
  await sendToOwners([
    `📊 <b>Итоги дня · ${day.split("-").reverse().join(".")}</b>`,
    `Лиды: <b>${leads}</b>`,
    `Расходы: ${h(money(spend, currency))} · CPL: ${leads ? h(money(spend / leads, currency)) : "—"}`,
    `Платежи: ${stats?.payments ?? 0} на ${h(money(stats?.paid ?? 0, currency))}`,
    stale.length ? `\n<b>Без движения больше ${staleDays} дн.:</b>\n${stale.map((d) => `• #${d.id} ${h(d.title)} — ${d.days} дн.`).join("\n")}` : "",
  ].filter(Boolean).join("\n"), [[{ text: "Открыть дашборд", url: appUrl() }]]);
}

export async function notifyWeekSummary(lines: string[]) {
  if (!(await enabled("weekSummary"))) return;
  await sendToOwners([`🗓 <b>Итоги недели</b>`, ...lines].join("\n"), [[{ text: "Открыть дашборд", url: appUrl() }]]);
}

export async function notifyIntegrationFailure(items: Array<{ label: string; since: string; error: string | null }>) {
  if (!items.length || !(await enabled("integrationFailure"))) return;
  await sendToOwners([
    `⚠️ <b>Сбой интеграции</b>`,
    ...items.map((item) => `• ${h(item.label)}: нет данных с ${h(item.since)}${item.error ? `\n  ${h(item.error.slice(0, 200))}` : ""}`),
  ].join("\n"), [[{ text: "Открыть расходы", url: `${appUrl()}/expenses` }]]);
}

