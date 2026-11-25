// A new lead, whichever way it came (the site's form, a Telegram or
// Instagram message, typed in by hand): its visit history is joined by the
// visitor id or the contact code, its channel and campaign are resolved, and
// a second request from a known phone or username goes to the same client,
// marked as a repeat (spec 4.1, 4.2).
import { and, count, eq, or, sql } from "drizzle-orm";
import type { DealOrigin } from "#shared/utils/constants";
import { campaigns, clients, contactCodes, deals, industries, services, visitors, type Touch } from "../db/schema";
import { channelIdByKey, channelIdForTouch } from "./channels";
import { normalizePhone, normalizeUsername } from "./contacts";
import { useDb } from "./db";
import { insertDeal, stageByKey } from "./deals";

export type LeadInput = {
  origin: DealOrigin;
  name?: string | null;
  company?: string | null;
  industryKey?: string | null;
  industryOther?: string | null;
  serviceKeys?: string[];
  serviceIds?: number[];
  method?: string | null;
  phone?: string | null;
  telegram?: string | null;
  telegramUserId?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  visitorId?: string | null;
  firstTouch?: Touch | null;
  lastTouch?: Touch | null;
  code?: string | null;
  /** A channel to use when the lead brings no source of its own ("instagram", "unknown", "fiverr"). */
  channelKey?: string | null;
  /** Manual deals: the channel picked in the form wins over everything else. */
  forceChannelId?: number | null;
  campaignId?: number | null;
  language?: string | null;
  page?: string | null;
  device?: string | null;
  telegramChatId?: string | null;
  instagramThreadId?: string | null;
  amount?: number | null;
  currency?: string | null;
  ownerId?: number | null;
  clientId?: number | null;
  notes?: string | null;
};

const CODE_PATTERN = /\bOB-?(\d{4,8})\b/i;

/** The contact code in a message, normalised ("ob 1042" is not one; "OB-1042" and "ob1042" are). */
export function findContactCode(text: string | null | undefined): string | null {
  const match = CODE_PATTERN.exec(String(text ?? ""));
  return match ? `OB-${match[1]}` : null;
}

async function campaignIdFor(touch: Touch | null | undefined, channelId: number | null) {
  const utm = String(touch?.cmp ?? "").trim().slice(0, 200);
  if (!utm || !channelId) return null;
  const db = useDb();
  const [found] = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.utmCampaign, utm));
  if (found) return found.id;
  // A campaign tag no link builder made (an old link, a partner's): kept, so spend can be matched later.
  const [created] = await db.insert(campaigns).values({ channelId, utmCampaign: utm, name: utm, placement: touch?.cnt ?? null })
    .onConflictDoNothing({ target: campaigns.utmCampaign }).returning({ id: campaigns.id });
  if (created) return created.id;
  const [again] = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.utmCampaign, utm));
  return again?.id ?? null;
}

export async function findClient(contact: { phone?: string | null; whatsapp?: string | null; telegram?: string | null; telegramUserId?: string | null }) {
  const db = useDb();
  const phone = normalizePhone(contact.phone);
  const whatsapp = normalizePhone(contact.whatsapp);
  const username = normalizeUsername(contact.telegram);
  const conditions = [
    phone ? or(eq(clients.phone, phone), eq(clients.whatsapp, phone)) : undefined,
    whatsapp ? or(eq(clients.phone, whatsapp), eq(clients.whatsapp, whatsapp)) : undefined,
    username ? sql`lower(${clients.telegram}) = ${username}` : undefined,
    contact.telegramUserId ? eq(clients.telegramUserId, contact.telegramUserId) : undefined,
  ].filter(Boolean);
  if (!conditions.length) return null;
  const [client] = await db.select().from(clients).where(or(...conditions)).orderBy(clients.id).limit(1);
  return client ?? null;
}

export async function createLead(input: LeadInput, userId: number | null = null) {
  const db = useDb();

  // 1. Visit history: by the contact code, else by the visitor id the form sent.
  let visitorId = input.visitorId ?? null;
  const code = input.code ? input.code.toUpperCase() : null;
  if (code) {
    const [row] = await db.select().from(contactCodes).where(eq(contactCodes.code, code));
    if (row?.visitorId) visitorId = row.visitorId;
  }
  let firstTouch = input.firstTouch ?? null;
  let lastTouch = input.lastTouch ?? null;
  if (visitorId) {
    const [visitor] = await db.select().from(visitors).where(eq(visitors.id, visitorId));
    if (visitor) {
      firstTouch = visitor.firstTouch ?? firstTouch;
      lastTouch = visitor.lastTouch ?? lastTouch;
    } else if (!input.visitorId) {
      visitorId = null;
    }
  }

  // 2. Channels: forced (manual), else from the touches, else the given fallback.
  // A message without a code (or a lead typed in) has no visit to look at:
  // it gets the fallback ("Источник неизвестен", "Instagram", ...).
  const fallback = input.channelKey ? await channelIdByKey(input.channelKey) : null;
  const hasTouch = !!(firstTouch || lastTouch);
  const fromTouch = async (touch: Touch | null) => (hasTouch ? channelIdForTouch(touch) : fallback);
  const firstChannelId = input.forceChannelId ?? await fromTouch(firstTouch ?? lastTouch);
  const lastChannelId = input.forceChannelId ?? await fromTouch(lastTouch ?? firstTouch);
  const campaignId = input.campaignId ?? await campaignIdFor(lastTouch, lastChannelId);

  // 3. The client: an existing one with the same phone or username, else a new one.
  let industryId: number | null = null;
  if (input.industryKey) {
    const [industry] = await db.select({ id: industries.id }).from(industries).where(eq(industries.key, input.industryKey));
    industryId = industry?.id ?? null;
  }
  const phone = normalizePhone(input.phone);
  const whatsapp = normalizePhone(input.whatsapp);
  const telegram = normalizeUsername(input.telegram);
  let client: typeof clients.$inferSelect | null = input.clientId
    ? (await db.select().from(clients).where(eq(clients.id, input.clientId)))[0] ?? null
    : await findClient({ phone, whatsapp, telegram, telegramUserId: input.telegramUserId });
  let isRepeat = false;
  if (client) {
    const [{ value } = { value: 0 }] = await db.select({ value: count() }).from(deals).where(eq(deals.clientId, client.id));
    isRepeat = value > 0;
    const patch: Partial<typeof clients.$inferInsert> = {};
    if (phone && !client.phone) patch.phone = phone;
    if (whatsapp && !client.whatsapp) patch.whatsapp = whatsapp;
    if (telegram && !client.telegram) patch.telegram = telegram;
    if (input.telegramUserId && !client.telegramUserId) patch.telegramUserId = input.telegramUserId;
    if (input.instagram && !client.instagram) patch.instagram = input.instagram;
    if (industryId && !client.industryId) patch.industryId = industryId;
    if (Object.keys(patch).length) client = (await db.update(clients).set(patch).where(eq(clients.id, client.id)).returning())[0] ?? client;
  } else {
    const notes = input.industryKey === "other" && input.industryOther ? `Отрасль: ${input.industryOther.trim().slice(0, 200)}` : null;
    client = (await db.insert(clients).values({
      name: (input.company || input.name || (telegram ? `@${telegram}` : null) || phone || whatsapp || input.instagram || "Без названия").trim().slice(0, 200),
      contactName: input.name?.trim().slice(0, 150) || null,
      industryId,
      phone,
      whatsapp,
      telegram,
      telegramUserId: input.telegramUserId ?? null,
      instagram: input.instagram ?? null,
      firstChannelId,
      notes,
    }).returning())[0] ?? null;
  }

  // 4. Services by the site's keys (or ids from the dashboard's own form).
  let serviceIds = input.serviceIds ?? [];
  if (!serviceIds.length && input.serviceKeys?.length) {
    const rows = await db.select({ id: services.id, key: services.key }).from(services);
    serviceIds = input.serviceKeys.map((key) => rows.find((row) => row.key === key)?.id).filter((id): id is number => !!id);
  }

  const stage = await stageByKey("new");
  const deal = await insertDeal({
    clientId: client!.id,
    visitorId,
    title: (input.company || client!.name).slice(0, 200),
    contactName: input.name?.trim().slice(0, 150) || client!.contactName,
    stageId: stage.id,
    amount: input.amount ?? null,
    currency: input.currency || "USD",
    serviceIds,
    ownerId: input.ownerId ?? null,
    isRepeat,
    origin: input.origin,
    contactMethod: input.method ?? null,
    firstChannelId,
    lastChannelId,
    campaignId,
    firstTouch,
    lastTouch,
    contactCode: code,
    language: input.language ?? null,
    page: input.page?.slice(0, 500) ?? null,
    device: input.device ?? null,
    telegramChatId: input.telegramChatId ?? null,
    instagramThreadId: input.instagramThreadId ?? null,
  }, userId);

  if (code) {
    await db.update(contactCodes).set({ usedAt: new Date(), dealId: deal.id })
      .where(and(eq(contactCodes.code, code), sql`${contactCodes.usedAt} IS NULL`));
  }
  return { deal, client: client!, isRepeat };
}
