// Local development only (404 in a built server): fills an empty database
// with two months of made-up visits, leads, payments and spend, so every
// screen can be looked at. Sign in with the demo owner from README.md.
import { count, eq, sql } from "drizzle-orm";
import { addDays, tashkentDay } from "../../../shared/utils/time";
import {
  dealCosts, deals, events, expenses, fxRates, lossReasons, messages, notes, payments, plans, stageHistory, tasks, users, visitors, visits,
} from "../../db/schema";
import { channelIdByKey, channelIdForTouch } from "../../utils/channels";
import { hashPassword } from "../../utils/crypto";
import { useDb } from "../../utils/db";
import { moveDeal, stageByKey } from "../../utils/deals";
import { createLead } from "../../utils/leads";

const NAMES = ["Азиз", "Дилноза", "Тимур", "Камила", "Рустам", "Мадина", "Жасур", "Нилуфар", "Шерзод", "Севара", "Бекзод", "Гульнора", "Отабек", "Малика", "Фаррух"];
const COMPANIES = ["Samarqand Non", "Tashkent Coffee", "Asl Mebel", "Nur Pharm", "Orzu Textile", "Grand Build", "Sweet Bakery", "EcoFarm", "Lazzat Food", "City Clinic", "Smart Edu", "Atlas Logistics", "Bahor Beauty", "Silk Road Tea", "Mega Auto", "Oltin Gold", "Uzum Kids", "Prime Realty", "Fresh Juice", "Navo Music"];
const PAGES = ["/ru", "/ru/services/brending", "/ru/services/razrabotka-logotipa", "/ru/pricing", "/ru/projects", "/ru/projects/ertex", "/ru/contact", "/uz", "/uz/services/brending", "/", "/services/branding", "/pricing"];
const SOURCES = [
  { weight: 30, touch: { src: "meta", med: "paid_social", cmp: "202611_meta_branding_tas" } },
  { weight: 18, touch: { src: "google", med: "cpc", cmp: "202611_google_logo_tas", gclid: "x" } },
  { weight: 10, touch: { src: "yandex", med: "cpc", cmp: "202611_yandex_branding_tas", yclid: "y" } },
  { weight: 8, touch: { src: "telegram", med: "posev", cmp: "202611_tg_posev_biznes", cnt: "biznes_uz" } },
  { weight: 6, touch: { src: "blogger", med: "influencer", cmp: "202611_blogger_branding", cnt: "anna_design" } },
  { weight: 9, touch: { src: "instagram", med: "organic_social" } },
  { weight: 12, touch: { ref: "https://www.google.com/" } },
  { weight: 14, touch: {} },
];

let seed = 42;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)]!;
const weighted = () => {
  const total = SOURCES.reduce((s, x) => s + x.weight, 0);
  let r = random() * total;
  for (const source of SOURCES) {
    r -= source.weight;
    if (r <= 0) return source.touch;
  }
  return SOURCES[0]!.touch;
};
const at = (day: string, hour: number) => new Date(Math.min(Date.now() - 60_000, Date.parse(`${day}T${String(hour).padStart(2, "0")}:${String(Math.floor(random() * 60)).padStart(2, "0")}:00+05:00`)));

export default defineEventHandler(async () => {
  if (!import.meta.dev) throw createError({ statusCode: 404 });
  const db = useDb();
  const [{ value: existing } = { value: 0 }] = await db.select({ value: count() }).from(deals);
  if (existing > 0) return { ok: false, message: "already seeded" };

  const today = tashkentDay();
  const days = Array.from({ length: 62 }, (_, i) => addDays(today, i - 61));

  // An owner to sign in with (local only).
  const [{ value: userCount } = { value: 0 }] = await db.select({ value: count() }).from(users);
  if (!userCount) {
    await db.insert(users).values({ email: "demo@onebranding.local", name: "Улугбек Мирзо", role: "owner", passwordHash: await hashPassword("demo-password-123") });
    await db.insert(users).values({ email: "partner@onebranding.local", name: "Второй владелец", role: "owner", passwordHash: await hashPassword("demo-password-123") });
  }

  // CBU-like rates.
  await db.insert(fxRates).values(days.flatMap((day, i) => [
    { day, currency: "USD", uzsPerUnit: 11950 + Math.round(Math.sin(i / 6) * 60 + i * 2) },
    { day, currency: "EUR", uzsPerUnit: 13100 + Math.round(Math.cos(i / 5) * 80) },
    { day, currency: "RUB", uzsPerUnit: 148 + Math.round(Math.sin(i / 4) * 3) },
  ])).onConflictDoNothing();
  const usdOn = (day: string) => 11950 + Math.round(Math.sin(days.indexOf(day) / 6) * 60 + days.indexOf(day) * 2);

  // Visits and events.
  const visitorIds: Array<{ id: string; day: string; touch: Record<string, string> }> = [];
  for (const day of days) {
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    const n = Math.round((weekday === 0 || weekday === 6 ? 14 : 24) * (0.7 + random() * 0.6) * (1 + days.indexOf(day) / 120));
    for (let i = 0; i < n; i += 1) {
      const id = crypto.randomUUID();
      const touch = { ...weighted(), land: pick(PAGES), at: Date.now() } as unknown as Record<string, string>;
      const started = at(day, 8 + Math.floor(random() * 14));
      const channelId = await channelIdForTouch(touch);
      const device = random() < 0.68 ? "mobile" : random() < 0.1 ? "tablet" : "desktop";
      const language = random() < 0.62 ? "ru" : random() < 0.6 ? "uz" : "en";
      await db.insert(visitors).values({ id, createdAt: started, lastSeenAt: started, firstTouch: touch, lastTouch: touch, firstChannelId: channelId, lastChannelId: channelId, device, language, ymClientId: String(Math.floor(random() * 1e10)) });
      const visitId = crypto.randomUUID();
      const engaged = random() < 0.55;
      const pagesSeen = engaged ? 1 + Math.floor(random() * 5) : 1;
      const active = engaged ? 30 + Math.floor(random() * 300) : Math.floor(random() * 25);
      const scroll = engaged ? pick([50, 75, 90]) : pick([0, 25]);
      await db.insert(visits).values({ id: visitId, visitorId: id, startedAt: started, endedAt: new Date(+started + active * 1000), touch, channelId, campaign: touch.cmp ?? null, landing: touch.land, device, language, pageViews: pagesSeen, activeSeconds: active, maxScroll: scroll, interacted: random() < 0.93 });
      const list: Array<typeof events.$inferInsert> = [];
      let t = +started;
      for (let p = 0; p < pagesSeen; p += 1) {
        const page = p === 0 ? touch.land! : pick(PAGES);
        list.push({ id: crypto.randomUUID(), visitorId: id, visitId, at: new Date(t), name: "page_view", page, activeSeconds: Math.round(active / pagesSeen) });
        if (scroll >= 50) list.push({ id: crypto.randomUUID(), visitorId: id, visitId, at: new Date(t + 5000), name: "scroll_50", page });
        if (scroll >= 90 && p === 0) list.push({ id: crypto.randomUUID(), visitorId: id, visitId, at: new Date(t + 9000), name: "scroll_90", page });
        if (/pricing|services/.test(page) && random() < 0.6) list.push({ id: crypto.randomUUID(), visitorId: id, visitId, at: new Date(t + 7000), name: "view_pricing", page });
        t += 20000;
      }
      if (engaged && random() < 0.35) {
        list.push({ id: crypto.randomUUID(), visitorId: id, visitId, at: new Date(t), name: "cta_click", page: touch.land, params: { button: pick(["Start your project", "Обсудить проект", "Let's go!"]), page: touch.land! } });
        if (random() < 0.7) list.push({ id: crypto.randomUUID(), visitorId: id, visitId, at: new Date(t + 1000), name: "form_open", page: touch.land });
        if (random() < 0.5) list.push({ id: crypto.randomUUID(), visitorId: id, visitId, at: new Date(t + 4000), name: "form_start", page: touch.land });
        if (random() < 0.3) list.push({ id: crypto.randomUUID(), visitorId: id, visitId, at: new Date(t + 9000), name: "messenger_click", page: touch.land, params: { channel: pick(["telegram", "telegram", "whatsapp"]), code: `OB-${1000 + visitorIds.length}` } });
      }
      await db.insert(events).values(list);
      visitorIds.push({ id, day, touch });
    }
  }

  // Leads from a share of the visitors, a few manual ones (Fiverr, referral).
  const reasons = await db.select().from(lossReasons);
  const stage = async (key: string) => (await stageByKey(key)).id;
  const candidates = visitorIds.filter(() => random() < 0.045);
  let index = 0;
  for (const visitor of candidates) {
    index += 1;
    const created = at(visitor.day, 10 + Math.floor(random() * 9));
    const company = pick(COMPANIES);
    const method = pick(["phone", "telegram", "whatsapp"]);
    const serviceKey = pick(["logo", "branding", "packaging", "identity", "launch_base", "one_pro", "web", "presentation"]);
    const { deal } = await createLead({
      origin: random() < 0.7 ? "form" : "telegram",
      name: pick(NAMES),
      company,
      industryKey: pick(["retail", "horeca", "food", "construction", "it", "health", "services"]),
      serviceKeys: [serviceKey],
      method,
      phone: method !== "telegram" ? `+99890${String(1000000 + index * 7919).slice(-7)}` : null,
      telegram: method === "telegram" ? `client_${index}_uz` : null,
      visitorId: visitor.id,
      language: "ru",
      device: "mobile",
    });
    const amountUsd = { logo: 900, branding: 3500, packaging: 700, identity: 1500, launch_base: 1900, one_pro: 2900, web: 2400, presentation: 350 }[serviceKey] ?? 1000;
    const inUzs = random() < 0.3;
    await db.update(deals).set({
      createdAt: created,
      amount: inUzs ? amountUsd * 12000 : amountUsd,
      currency: inUzs ? "UZS" : "USD",
      stageChangedAt: created,
    }).where(eq(deals.id, deal.id));
    await db.update(stageHistory).set({ at: created }).where(eq(stageHistory.dealId, deal.id));

    const ageDays = days.length - 1 - days.indexOf(visitor.day);
    const roll = random();
    const path: string[] = [];
    if (ageDays < 1 && roll < 0.5) {
      // fresh lead, still new
    } else if (roll < 0.16) path.push("lost");
    else {
      path.push("contacted");
      if (roll > 0.35) path.push("meeting");
      if (roll > 0.5) path.push("proposal");
      if (roll > 0.6 && ageDays > 4) path.push("prepaid");
      if (roll > 0.72 && ageDays > 10) path.push("in_work");
      if (roll > 0.82 && ageDays > 16) path.push("paid");
      if (roll > 0.4 && roll < 0.47) path.push("lost");
    }
    let moment = +created;
    for (const key of path) {
      moment += (key === "contacted" ? 0.2 + random() * 3 : 24 * (1 + random() * 4)) * 3600_000;
      if (moment > Date.now()) break;
      const day = tashkentDay(moment);
      if (key === "prepaid" || key === "paid") {
        const kind = key === "prepaid" ? "prepayment" : "balance";
        const usd = usdOn(day) || 12000;
        const half = (inUzs ? amountUsd * 12000 : amountUsd) / 2;
        await db.insert(payments).values({ dealId: deal.id, kind, amount: half, currency: inUzs ? "UZS" : "USD", uzsPerUnit: inUzs ? 1 : usd, uzsPerUsd: usd, paidOn: day, method: pick(["transfer", "card", "payme", "click", "cash"]) });
        if (key === "prepaid") await db.insert(dealCosts).values({ dealId: deal.id, category: "contractor", amount: Math.round(amountUsd * 0.15), currency: "USD", uzsPerUnit: usd, uzsPerUsd: usd, spentOn: day });
      }
      const reason = key === "lost" ? pick(reasons).id : undefined;
      await moveDeal(deal.id, await stage(key), null, { lossReasonId: reason });
      await db.execute(sql`UPDATE stage_history SET at = ${new Date(moment)} WHERE id = (SELECT max(id) FROM stage_history WHERE deal_id = ${deal.id})`);
      await db.update(deals).set({
        stageChangedAt: new Date(moment),
        ...(key === "contacted" ? { firstResponseAt: new Date(moment) } : {}),
        ...(key === "lost" || key === "paid" ? { closedAt: new Date(moment) } : {}),
      }).where(eq(deals.id, deal.id));
    }
    if (random() < 0.3) {
      await db.insert(tasks).values({ dealId: deal.id, text: pick(["Перезвонить", "Отправить КП", "Согласовать бриф", "Напомнить об оплате"]), dueOn: addDays(today, Math.floor(random() * 6) - 2) });
    }
    if (random() < 0.25) await db.insert(notes).values({ dealId: deal.id, text: "Клиент хочет обновить логотип и упаковку к весне. Бюджет обсуждаем." });
    if (index % 7 === 0) {
      await db.update(deals).set({ telegramChatId: String(500000 + index), origin: "telegram" }).where(eq(deals.id, deal.id));
      await db.insert(messages).values([
        { dealId: deal.id, channel: "telegram", direction: "in", text: `Здравствуйте! Хочу обсудить проект (OB-${1000 + index})`, externalId: `seed:${deal.id}:1`, at: created },
        { dealId: deal.id, channel: "telegram", direction: "out", text: "Здравствуйте! Спасибо за обращение. Расскажите, пожалуйста, о компании и задаче.", externalId: `seed:${deal.id}:2`, at: new Date(+created + 9 * 60000) },
      ]);
    }
  }
  // Manual: Fiverr and recommendations.
  for (let i = 0; i < 6; i += 1) {
    const day = pick(days.slice(5));
    const fiverr = i % 2 === 0;
    const { deal } = await createLead({ origin: "manual", company: fiverr ? `Fiverr buyer ${i + 1}` : pick(COMPANIES), name: pick(NAMES), forceChannelId: await channelIdByKey(fiverr ? "fiverr" : "referral"), amount: fiverr ? 600 : 2900, currency: "USD", phone: `+99893${String(2000000 + i * 104729).slice(-7)}` });
    await db.update(deals).set({ createdAt: at(day, 12) }).where(eq(deals.id, deal.id));
    await db.insert(payments).values({ dealId: deal.id, kind: "prepayment", amount: fiverr ? 600 : 1450, currency: "USD", uzsPerUnit: 12000, uzsPerUsd: 12000, paidOn: day, method: fiverr ? "fiverr" : "transfer", commissionPercent: fiverr ? 20 : 0 });
    await moveDeal(deal.id, await stage("contacted"), null);
    await moveDeal(deal.id, await stage("prepaid"), null);
    if (fiverr) await moveDeal(deal.id, await stage("paid"), null);
  }

  // Spend: API channels daily, manual placements weekly.
  for (const day of days) {
    const usd = usdOn(day);
    for (const [key, base, ccy] of [["meta", 22, "USD"], ["google", 14, "USD"], ["yandex", 1200, "RUB"]] as const) {
      const amount = Math.round(base * (0.7 + random() * 0.6) * 100) / 100;
      const unit = ccy === "RUB" ? 148 : usd;
      const impressions = Math.round((ccy === "RUB" ? amount / 2 : amount * 90) * (0.8 + random() * 0.4));
      await db.insert(expenses).values({ spentOn: day, channelId: (await channelIdByKey(key))!, amount, currency: ccy, uzsPerUnit: unit, uzsPerUsd: usd, source: "api", externalKey: `${key}:seed:${day}`, impressions, clicks: Math.round(impressions * (0.012 + random() * 0.02)) });
    }
    if (new Date(`${day}T12:00:00Z`).getUTCDay() === 1) {
      await db.insert(expenses).values({ spentOn: day, channelId: (await channelIdByKey("tg_posev"))!, amount: 1_200_000, currency: "UZS", uzsPerUnit: 1, uzsPerUsd: usd, source: "manual", comment: "Посев в @biznes_uz" });
      await db.insert(expenses).values({ spentOn: day, channelId: (await channelIdByKey("blogger"))!, amount: 150, currency: "USD", uzsPerUnit: usd, uzsPerUsd: usd, source: "manual", comment: "Сторис у блогера" });
    }
  }
  await db.insert(plans).values([
    { month: `${today.slice(0, 7)}-01`, leads: 45, revenue: 30000, currency: "USD" },
    { month: `${addDays(`${today.slice(0, 7)}-01`, -1).slice(0, 7)}-01`, leads: 40, revenue: 25000, currency: "USD" },
  ]).onConflictDoNothing();
  return { ok: true, visitors: visitorIds.length, leads: candidates.length + 6 };
});
