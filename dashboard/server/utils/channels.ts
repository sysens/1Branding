// Which channel a visit or a lead belongs to, from its touch (utm tags,
// click ids, referrer) and the editable "UTM → channel" rules of Settings.
import { asc } from "drizzle-orm";
import { channels, type ChannelRule, type Touch } from "../db/schema";
import { useDb } from "./db";

export type ChannelRow = typeof channels.$inferSelect;

let cache: { at: number; list: ChannelRow[] } | null = null;

export async function channelList(fresh = false): Promise<ChannelRow[]> {
  if (!fresh && cache && Date.now() - cache.at < 30_000) return cache.list;
  const list = await useDb().select().from(channels).orderBy(asc(channels.position), asc(channels.id));
  cache = { at: Date.now(), list };
  return list;
}

export const forgetChannels = () => { cache = null; };

const norm = (value?: string) => String(value ?? "").trim().toLowerCase();

const fieldMatches = (rule?: string, value?: string) => {
  if (rule === undefined || rule === "") return true;
  if (rule === "*") return norm(value) !== "";
  return norm(rule) === norm(value);
};

const host = (url?: string) => {
  try {
    return url ? new URL(url).hostname.toLowerCase() : "";
  } catch {
    return norm(url);
  }
};

function ruleMatches(rule: ChannelRule, touch: Touch, kind: "utm" | "click" | "referrer") {
  if (kind === "utm") {
    if (!rule.source && !rule.medium) return false;
    if (rule.clickId || rule.referrer) return false;
    return fieldMatches(rule.source, touch.src) && fieldMatches(rule.medium, touch.med);
  }
  if (kind === "click") return !!rule.clickId && !!touch[rule.clickId];
  return !!rule.referrer && host(touch.ref).includes(norm(rule.referrer));
}

/**
 * The channel key of a touch. utm tags decide first (they are what we put on
 * our own links), then an ads click id, then the referring site; a touch with
 * none of them is a direct visit.
 */
export function matchChannelKey(list: Pick<ChannelRow, "key" | "rules" | "isActive">[], touch: Touch | null | undefined): string {
  if (!touch) return "direct";
  const active = list.filter((channel) => channel.isActive);
  const find = (kind: "utm" | "click" | "referrer") =>
    active.find((channel) => (channel.rules ?? []).some((rule) => ruleMatches(rule, touch, kind)))?.key;
  if (touch.src || touch.med) return find("utm") ?? "other";
  const byClick = touch.gclid || touch.yclid || touch.fbclid ? find("click") : undefined;
  if (byClick) return byClick;
  if (touch.ref) return find("referrer") ?? "other";
  return "direct";
}

export async function channelIdForTouch(touch: Touch | null | undefined): Promise<number | null> {
  const list = await channelList();
  const key = matchChannelKey(list, touch);
  return list.find((channel) => channel.key === key)?.id ?? null;
}

export async function channelIdByKey(key: string): Promise<number | null> {
  return (await channelList()).find((channel) => channel.key === key)?.id ?? null;
}
