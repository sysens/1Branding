// The dashboard's database: the site's visitors and their events, the CRM
// (clients, deals and their stages, payments, tasks), marketing spend and
// the settings. Money is always stored in the currency it happened in, with
// the Central Bank of Uzbekistan's rates of that day next to it
// (uzs_per_unit: UZS for one unit of the currency; uzs_per_usd: UZS for one
// dollar), so a report in USD or UZS converts at the operation's date.
import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgSequence,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const money = (name: string) => numeric(name, { precision: 16, scale: 2, mode: "number" });
const rate = (name: string) => numeric(name, { precision: 18, scale: 6, mode: "number" });

/** A visit's source, as the tracker sends it (utm_*, click ids, referrer, landing). */
export type Touch = {
  src?: string;
  med?: string;
  cmp?: string;
  cnt?: string;
  trm?: string;
  gclid?: string;
  yclid?: string;
  fbclid?: string;
  ref?: string;
  land?: string;
  at?: number;
};

/**
 * One way to recognise a channel. Every given field must match: `source` and
 * `medium` the utm tags (case-insensitive, "*" for any value), `clickId` an
 * ads click id in the URL (gclid, yclid, fbclid), `referrer` a part of the
 * referring site's host ("instagram.com").
 */
export type ChannelRule = { source?: string; medium?: string; clickId?: "gclid" | "yclid" | "fbclid"; referrer?: string };

// ---------------------------------------------------------------- people

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["owner", "manager", "viewer"] }).notNull().default("owner"),
  passwordHash: text("password_hash").notNull(),
  // AES-GCM encrypted base32 secret (server/utils/crypto.ts).
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  telegramId: text("telegram_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
}, (t) => [uniqueIndex("users_email_idx").on(sql`lower(${t.email})`)]);

export const sessions = pgTable("sessions", {
  // sha256 of the cookie's token: a database leak gives no usable session.
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // "pending_2fa": the password was right, the code is still to come.
  stage: text("stage", { enum: ["pending_2fa", "active"] }).notNull(),
  createdAt: createdAt(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  ip: text("ip"),
  userAgent: text("user_agent"),
});

export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: text("entity_id"),
  details: jsonb("details"),
  ip: text("ip"),
  createdAt: createdAt(),
}, (t) => [index("audit_log_created_idx").on(t.createdAt)]);

// ---------------------------------------------------------------- reference data

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  // Where its spend comes from: an ads API, typed in by hand, or none.
  costMode: text("cost_mode", { enum: ["api", "manual", "none"] }).notNull().default("manual"),
  // A marketplace's cut (Fiverr: 20 %): revenue is counted without it.
  commissionPercent: numeric("commission_percent", { precision: 5, scale: 2, mode: "number" }).notNull().default(0),
  // "UTM → channel" (server/utils/channels.ts): [{ source: "meta", medium: "paid_social" }, ...].
  rules: jsonb("rules").$type<ChannelRule[]>().notNull().default([]),
  color: text("color"),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => channels.id),
  utmCampaign: text("utm_campaign").notNull().unique(),
  name: text("name").notNull(),
  // A blogger's name, a Telegram channel of a placement, a marketplace.
  placement: text("placement"),
  // The ads API's own id ("meta:120200...", "google:123", "yandex:456").
  externalId: text("external_id").unique(),
  startsOn: date("starts_on"),
  endsOn: date("ends_on"),
  createdAt: createdAt(),
});

export const stages = pgTable("stages", {
  id: serial("id").primaryKey(),
  // The logic relies on these keys: new, contacted, prepaid, paid, lost.
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  kind: text("kind", { enum: ["open", "won", "lost"] }).notNull().default("open"),
  requiresPayment: boolean("requires_payment").notNull().default(false),
  isSystem: boolean("is_system").notNull().default(false),
});

export const lossReasons = pgTable("loss_reasons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // "spam" and "not_target" leads are not qualified (section 7).
  key: text("key"),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  // The site's service key (servicePages.ts), "package", "unsure", or a package key.
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["service", "package"] }).notNull().default("service"),
  basePrice: money("base_price"),
  currency: text("currency").notNull().default("USD"),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const industries = pgTable("industries", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// ---------------------------------------------------------------- site analytics

export const visitors = pgTable("visitors", {
  id: uuid("id").primaryKey(),
  createdAt: createdAt(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  firstTouch: jsonb("first_touch").$type<Touch>(),
  lastTouch: jsonb("last_touch").$type<Touch>(),
  firstChannelId: integer("first_channel_id").references(() => channels.id),
  lastChannelId: integer("last_channel_id").references(() => channels.id),
  gaClientId: text("ga_client_id"),
  ymClientId: text("ym_client_id"),
  fbp: text("fbp"),
  fbc: text("fbc"),
  device: text("device"),
  language: text("language"),
  isBot: boolean("is_bot").notNull().default(false),
}, (t) => [index("visitors_created_idx").on(t.createdAt)]);

export const visits = pgTable("visits", {
  id: uuid("id").primaryKey(),
  visitorId: uuid("visitor_id").notNull().references(() => visitors.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
  touch: jsonb("touch").$type<Touch>(),
  channelId: integer("channel_id").references(() => channels.id),
  campaign: text("campaign"),
  landing: text("landing"),
  device: text("device"),
  language: text("language"),
  userAgent: text("user_agent"),
  isBot: boolean("is_bot").notNull().default(false),
  pageViews: integer("page_views").notNull().default(0),
  activeSeconds: integer("active_seconds").notNull().default(0),
  maxScroll: integer("max_scroll").notNull().default(0),
  // Any event besides page_view: a scroll, a click, active time (bots do none).
  interacted: boolean("interacted").notNull().default(false),
}, (t) => [
  index("visits_started_idx").on(t.startedAt),
  index("visits_visitor_idx").on(t.visitorId),
]);

export const events = pgTable("events", {
  // The tracker's own id, so a re-sent batch is not counted twice.
  id: uuid("id").primaryKey(),
  visitorId: uuid("visitor_id").notNull(),
  visitId: uuid("visit_id"),
  at: timestamp("at", { withTimezone: true }).notNull(),
  name: text("name").notNull(),
  page: text("page"),
  params: jsonb("params").$type<Record<string, unknown>>(),
  // page_view only: seconds the page was actually looked at.
  activeSeconds: integer("active_seconds"),
}, (t) => [
  index("events_at_idx").on(t.at),
  index("events_visitor_idx").on(t.visitorId),
  index("events_name_at_idx").on(t.name, t.at),
]);

/** OB-1001, OB-1002, ...: short codes, one per visitor (spec 4.2). */
export const contactCodeSeq = pgSequence("contact_code_seq", { startWith: 1001 });

export const contactCodes = pgTable("contact_codes", {
  code: text("code").primaryKey(),
  visitorId: uuid("visitor_id"),
  channel: text("channel"),
  createdAt: createdAt(),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  usedAt: timestamp("used_at", { withTimezone: true }),
  dealId: integer("deal_id"),
}, (t) => [index("contact_codes_visitor_idx").on(t.visitorId)]);

// ---------------------------------------------------------------- CRM

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industryId: integer("industry_id").references(() => industries.id),
  contactName: text("contact_name"),
  phone: text("phone"),
  telegram: text("telegram"),
  telegramUserId: text("telegram_user_id"),
  whatsapp: text("whatsapp"),
  instagram: text("instagram"),
  email: text("email"),
  firstChannelId: integer("first_channel_id").references(() => channels.id),
  notes: text("notes"),
  createdAt: createdAt(),
}, (t) => [
  index("clients_phone_idx").on(t.phone),
  index("clients_telegram_idx").on(sql`lower(${t.telegram})`),
]);

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  visitorId: uuid("visitor_id"),
  title: text("title"),
  contactName: text("contact_name"),
  stageId: integer("stage_id").notNull().references(() => stages.id),
  amount: money("amount"),
  currency: text("currency").notNull().default("USD"),
  serviceIds: jsonb("service_ids").$type<number[]>().notNull().default([]),
  expectedCloseOn: date("expected_close_on"),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
  lossReasonId: integer("loss_reason_id").references(() => lossReasons.id),
  lossComment: text("loss_comment"),
  isRepeat: boolean("is_repeat").notNull().default(false),
  // How the lead arrived: form, telegram, whatsapp, instagram, phone, manual.
  origin: text("origin").notNull().default("manual"),
  contactMethod: text("contact_method"),
  firstChannelId: integer("first_channel_id").references(() => channels.id),
  lastChannelId: integer("last_channel_id").references(() => channels.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  firstTouch: jsonb("first_touch").$type<Touch>(),
  lastTouch: jsonb("last_touch").$type<Touch>(),
  contactCode: text("contact_code"),
  language: text("language"),
  page: text("page"),
  device: text("device"),
  telegramChatId: text("telegram_chat_id"),
  instagramThreadId: text("instagram_thread_id"),
  createdAt: createdAt(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
  stageChangedAt: timestamp("stage_changed_at", { withTimezone: true }).notNull().defaultNow(),
  firstPrepaymentAt: timestamp("first_prepayment_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  unansweredNotifiedAt: timestamp("unanswered_notified_at", { withTimezone: true }),
}, (t) => [
  index("deals_created_idx").on(t.createdAt),
  index("deals_stage_idx").on(t.stageId),
  index("deals_client_idx").on(t.clientId),
  index("deals_tg_chat_idx").on(t.telegramChatId),
]);

export const stageHistory = pgTable("stage_history", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  fromStageId: integer("from_stage_id").references(() => stages.id),
  toStageId: integer("to_stage_id").notNull().references(() => stages.id),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("stage_history_deal_idx").on(t.dealId)]);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["prepayment", "balance", "extra"] }).notNull(),
  amount: money("amount").notNull(),
  currency: text("currency").notNull(),
  uzsPerUnit: rate("uzs_per_unit").notNull(),
  uzsPerUsd: rate("uzs_per_usd").notNull(),
  paidOn: date("paid_on").notNull(),
  method: text("method").notNull(),
  // The channel's marketplace commission when the payment was entered.
  commissionPercent: numeric("commission_percent", { precision: 5, scale: 2, mode: "number" }).notNull().default(0),
  note: text("note"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [index("payments_paid_idx").on(t.paidOn), index("payments_deal_idx").on(t.dealId)]);

export const dealCosts = pgTable("deal_costs", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  // contractor, print, shoot, other
  category: text("category").notNull(),
  amount: money("amount").notNull(),
  currency: text("currency").notNull(),
  uzsPerUnit: rate("uzs_per_unit").notNull(),
  uzsPerUsd: rate("uzs_per_usd").notNull(),
  spentOn: date("spent_on").notNull(),
  note: text("note"),
  createdAt: createdAt(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => deals.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  dueOn: date("due_on"),
  done: boolean("done").notNull().default(false),
  doneAt: timestamp("done_at", { withTimezone: true }),
  assigneeId: integer("assignee_id").references(() => users.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [index("tasks_due_idx").on(t.dueOn)]);

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const messages = pgTable("messages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  dealId: integer("deal_id").references(() => deals.id, { onDelete: "cascade" }),
  channel: text("channel", { enum: ["telegram", "instagram"] }).notNull(),
  direction: text("direction", { enum: ["in", "out"] }).notNull(),
  text: text("text"),
  senderName: text("sender_name"),
  // "<chat id>:<message id>": an edited or re-delivered message is not stored twice.
  externalId: text("external_id").notNull().unique(),
  at: timestamp("at", { withTimezone: true }).notNull(),
}, (t) => [index("messages_deal_idx").on(t.dealId)]);

// ---------------------------------------------------------------- money and plans

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  spentOn: date("spent_on").notNull(),
  channelId: integer("channel_id").notNull().references(() => channels.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  amount: money("amount").notNull(),
  currency: text("currency").notNull(),
  uzsPerUnit: rate("uzs_per_unit").notNull(),
  uzsPerUsd: rate("uzs_per_usd").notNull(),
  source: text("source", { enum: ["api", "manual"] }).notNull().default("manual"),
  // "meta:<campaign>:<date>": an API day is replaced, not added twice.
  externalKey: text("external_key").unique(),
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  comment: text("comment"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
}, (t) => [index("expenses_spent_idx").on(t.spentOn)]);

export const plans = pgTable("plans", {
  // The first day of the month.
  month: date("month").primaryKey(),
  leads: integer("leads"),
  revenue: money("revenue"),
  currency: text("currency").notNull().default("USD"),
});

export const fxRates = pgTable("fx_rates", {
  day: date("day").notNull(),
  currency: text("currency").notNull(),
  uzsPerUnit: rate("uzs_per_unit").notNull(),
}, (t) => [primaryKey({ columns: [t.day, t.currency] })]);

// ---------------------------------------------------------------- settings and integrations

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** API tokens and keys, AES-GCM encrypted with ENCRYPTION_KEY. */
export const secrets = pgTable("secrets", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const integrationStatus = pgTable("integration_status", {
  provider: text("provider").primaryKey(),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  lastError: text("last_error"),
  details: jsonb("details"),
  alertedAt: timestamp("alerted_at", { withTimezone: true }),
});

export const jobRuns = pgTable("job_runs", {
  key: text("key").primaryKey(),
  ranAt: timestamp("ran_at", { withTimezone: true }).notNull().defaultNow(),
});

export const telegramConnections = pgTable("telegram_connections", {
  id: text("id").primaryKey(),
  userChatId: text("user_chat_id"),
  userId: text("user_id"),
  username: text("username"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  canReply: boolean("can_reply").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const instagramStats = pgTable("instagram_stats", {
  day: date("day").primaryKey(),
  followers: integer("followers"),
  reach: integer("reach"),
  linkClicks: integer("link_clicks"),
});
