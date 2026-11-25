// What a new database starts with: the channels of the UTM standard (spec 5),
// the funnel's stages (6.2), refusal reasons, the services and packages, the
// industries of the site's form, and default settings. Rows are only added
// when their key is missing: anything edited in Settings stays as it is.
import { sql } from "drizzle-orm";
import { channels, industries, lossReasons, services, settings, stages, type ChannelRule } from "../db/schema";
import { useDb } from "./db";

type ChannelSeed = {
  key: string;
  name: string;
  costMode: "api" | "manual" | "none";
  commissionPercent?: number;
  color: string;
  rules: ChannelRule[];
};

export const DEFAULT_CHANNELS: ChannelSeed[] = [
  { key: "meta", name: "Реклама Meta", costMode: "api", color: "#2563eb", rules: [
    { source: "meta", medium: "paid_social" }, { source: "facebook", medium: "paid_social" }, { source: "instagram", medium: "paid_social" }, { source: "meta" },
  ] },
  { key: "google", name: "Google Ads", costMode: "api", color: "#16a34a", rules: [{ source: "google", medium: "cpc" }, { clickId: "gclid" }] },
  { key: "yandex", name: "Яндекс Директ", costMode: "api", color: "#dc2626", rules: [{ source: "yandex", medium: "cpc" }, { clickId: "yclid" }] },
  { key: "tg_posev", name: "Посевы в Telegram", costMode: "manual", color: "#0ea5e9", rules: [{ source: "telegram", medium: "posev" }] },
  { key: "blogger", name: "Блогеры", costMode: "manual", color: "#a855f7", rules: [{ source: "blogger" }, { medium: "influencer" }] },
  { key: "instagram", name: "Instagram бесплатно", costMode: "none", color: "#db2777", rules: [
    { source: "instagram", medium: "organic_social" }, { source: "instagram" }, { referrer: "instagram.com" },
  ] },
  { key: "telegram", name: "Telegram бесплатно", costMode: "none", color: "#0284c7", rules: [
    { source: "telegram", medium: "organic_social" }, { source: "telegram" }, { referrer: "t.me" }, { referrer: "telegram.org" },
  ] },
  { key: "fiverr", name: "Fiverr", costMode: "manual", commissionPercent: 20, color: "#22c55e", rules: [{ source: "fiverr" }, { referrer: "fiverr.com" }] },
  { key: "upwork", name: "Upwork", costMode: "manual", commissionPercent: 10, color: "#65a30d", rules: [{ source: "upwork" }, { referrer: "upwork.com" }] },
  { key: "behance", name: "Behance", costMode: "manual", color: "#1d4ed8", rules: [{ source: "behance" }, { referrer: "behance.net" }] },
  { key: "referral", name: "Рекомендация", costMode: "none", color: "#f59e0b", rules: [{ medium: "referral" }] },
  { key: "organic_search", name: "Поиск без рекламы", costMode: "none", color: "#64748b", rules: [
    { referrer: "google." }, { referrer: "yandex." }, { referrer: "bing.com" }, { referrer: "duckduckgo.com" }, { referrer: "ya.ru" },
  ] },
  { key: "other", name: "Другие сайты", costMode: "none", color: "#94a3b8", rules: [] },
  { key: "direct", name: "Прямой заход", costMode: "none", color: "#525252", rules: [] },
  { key: "unknown", name: "Источник неизвестен", costMode: "none", color: "#a3a3a3", rules: [] },
];

const DEFAULT_STAGES = [
  { key: "new", name: "Новая", kind: "open" },
  { key: "contacted", name: "Связались", kind: "open" },
  { key: "meeting", name: "Встреча / бриф", kind: "open" },
  { key: "proposal", name: "КП отправлено", kind: "open" },
  { key: "thinking", name: "Думает", kind: "open" },
  { key: "prepaid", name: "Предоплата", kind: "open", requiresPayment: true },
  { key: "in_work", name: "В работе", kind: "open" },
  { key: "paid", name: "Оплачен полностью", kind: "won", requiresPayment: true },
  { key: "lost", name: "Отказ", kind: "lost" },
] as const;

const DEFAULT_LOSS_REASONS = [
  { name: "Дорого" },
  { name: "Пропал, не отвечает" },
  { name: "Выбрал другое агентство" },
  { name: "Не целевой", key: "not_target" },
  { name: "Спам", key: "spam" },
  { name: "Отложил" },
  { name: "Другое" },
];

// The site's services (frontend/app/utils/servicePages.ts keys) and the packages on /pricing.
const DEFAULT_SERVICES = [
  { key: "branding", name: "Брендинг и ребрендинг" },
  { key: "logo", name: "Разработка логотипа", basePrice: 900 },
  { key: "identity", name: "Фирменный стиль" },
  { key: "brandbook", name: "Разработка брендбука" },
  { key: "strategy", name: "Бренд-стратегия и нейминг" },
  { key: "packaging", name: "Дизайн упаковки", basePrice: 500 },
  { key: "print", name: "Графический дизайн и полиграфия" },
  { key: "social", name: "SMM и рекламные кампании" },
  { key: "photo", name: "Предметная съёмка и ретушь" },
  { key: "motion", name: "Видео, 3D и моушн-дизайн" },
  { key: "presentation", name: "Дизайн презентаций" },
  { key: "web", name: "Разработка сайтов" },
  { key: "uiux", name: "UI/UX и дизайн приложений" },
  { key: "crm", name: "Внедрение CRM, ERP и Odoo" },
  { key: "signage", name: "Вывески и выставочный дизайн" },
  { key: "package", name: "Пакет брендинга", kind: "package" },
  { key: "launch_base", name: "Launch Base", kind: "package", basePrice: 1900 },
  { key: "one_pro", name: "One Pro", kind: "package", basePrice: 2900 },
  { key: "global", name: "Global", kind: "package", basePrice: 5900 },
  { key: "unsure", name: "Пока не знаю" },
] as const;

const DEFAULT_INDUSTRIES = [
  { key: "retail", name: "Розничная торговля" },
  { key: "horeca", name: "HoReCa: рестораны, кафе, отели" },
  { key: "food", name: "Продукты питания и FMCG" },
  { key: "construction", name: "Строительство и недвижимость" },
  { key: "it", name: "IT и технологии" },
  { key: "education", name: "Образование" },
  { key: "health", name: "Медицина и красота" },
  { key: "finance", name: "Финансы" },
  { key: "manufacturing", name: "Производство" },
  { key: "logistics", name: "Логистика" },
  { key: "services", name: "Услуги" },
  { key: "other", name: "Другое" },
];

export const DEFAULT_SETTINGS: Record<string, unknown> = {
  workSchedule: { days: [1, 2, 3, 4, 5], start: "10:00", end: "19:00" },
  responseTargetMinutes: 15,
  staleDays: 5,
  reportCurrency: "USD",
  attribution: "last",
  notifications: {
    newLead: true,
    unanswered: true,
    payment: true,
    dailyTasks: true,
    daySummary: true,
    weekSummary: true,
    integrationFailure: true,
  },
};

export async function seedDefaults() {
  const db = useDb();
  await db.insert(channels).values(DEFAULT_CHANNELS.map((channel, index) => ({
    key: channel.key,
    name: channel.name,
    costMode: channel.costMode,
    commissionPercent: channel.commissionPercent ?? 0,
    color: channel.color,
    rules: channel.rules,
    position: index,
  }))).onConflictDoNothing({ target: channels.key });

  await db.insert(stages).values(DEFAULT_STAGES.map((stage, index) => ({
    key: stage.key,
    name: stage.name,
    kind: stage.kind,
    position: index,
    requiresPayment: "requiresPayment" in stage ? stage.requiresPayment : false,
    isSystem: true,
  }))).onConflictDoNothing({ target: stages.key });

  const [{ count } = { count: 0 }] = await db.select({ count: sql<number>`count(*)::int` }).from(lossReasons);
  if (!count) {
    await db.insert(lossReasons).values(DEFAULT_LOSS_REASONS.map((reason, index) => ({ ...reason, position: index })));
  }

  await db.insert(services).values(DEFAULT_SERVICES.map((service, index) => ({
    key: service.key,
    name: service.name,
    kind: ("kind" in service ? service.kind : "service") as "service" | "package",
    basePrice: "basePrice" in service ? service.basePrice : null,
    position: index,
  }))).onConflictDoNothing({ target: services.key });

  await db.insert(industries).values(DEFAULT_INDUSTRIES.map((industry, index) => ({ ...industry, position: index })))
    .onConflictDoNothing({ target: industries.key });

  await db.insert(settings).values(Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value: value as object })))
    .onConflictDoNothing({ target: settings.key });
}
