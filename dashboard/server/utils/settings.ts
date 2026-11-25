// Settings (plain JSON rows) and secrets (API tokens and keys, encrypted).
// A secret typed in Settings → Connections wins over the environment
// variable of the same name in capitals (META_ACCESS_TOKEN, ...), so either
// way of configuring works.
import { eq } from "drizzle-orm";
import { secrets, settings } from "../db/schema";
import { decrypt, encrypt } from "./crypto";
import { useDb } from "./db";
import { DEFAULT_SETTINGS } from "./seed";

export const SECRET_KEYS = [
  "meta_access_token",
  "meta_ad_account_id",
  "meta_pixel_id",
  "meta_capi_token",
  "meta_app_secret",
  "instagram_account_id",
  "instagram_access_token",
  "instagram_verify_token",
  "google_ads_developer_token",
  "google_ads_client_id",
  "google_ads_client_secret",
  "google_ads_refresh_token",
  "google_ads_customer_id",
  "google_ads_login_customer_id",
  "yandex_direct_token",
  "yandex_direct_client_login",
  "telegram_bot_token",
  "telegram_chat_id",
  "telegram_webhook_secret",
  "turnstile_secret",
] as const;
export type SecretKey = (typeof SECRET_KEYS)[number];

const cache = new Map<string, { at: number; value: unknown }>();
const TTL = 15_000;

export async function getSetting<T>(key: string): Promise<T> {
  const hit = cache.get(`s:${key}`);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const [row] = await useDb().select().from(settings).where(eq(settings.key, key));
  const value = (row?.value ?? DEFAULT_SETTINGS[key]) as T;
  cache.set(`s:${key}`, { at: Date.now(), value });
  return value;
}

export async function setSetting(key: string, value: unknown) {
  await useDb().insert(settings).values({ key, value }).onConflictDoUpdate({
    target: settings.key,
    set: { value, updatedAt: new Date() },
  });
  cache.delete(`s:${key}`);
}

export async function getSecret(key: SecretKey): Promise<string> {
  const hit = cache.get(`x:${key}`);
  if (hit && Date.now() - hit.at < TTL) return hit.value as string;
  const [row] = await useDb().select().from(secrets).where(eq(secrets.key, key));
  let value = "";
  if (row) {
    try {
      value = decrypt(row.value);
    } catch {
      value = "";
    }
  }
  if (!value) value = String(process.env[key.toUpperCase()] || "").trim();
  cache.set(`x:${key}`, { at: Date.now(), value });
  return value;
}

/** Saves (or, with an empty value, removes) a secret. */
export async function setSecret(key: SecretKey, value: string) {
  const db = useDb();
  const clean = value.trim();
  if (!clean) await db.delete(secrets).where(eq(secrets.key, key));
  else {
    const stored = encrypt(clean);
    await db.insert(secrets).values({ key, value: stored }).onConflictDoUpdate({
      target: secrets.key,
      set: { value: stored, updatedAt: new Date() },
    });
  }
  cache.delete(`x:${key}`);
}

/** Which secrets are set (from the database or the environment), never their values. */
export async function secretPresence(): Promise<Record<SecretKey, "db" | "env" | null>> {
  const stored = new Set((await useDb().select({ key: secrets.key }).from(secrets)).map((row) => row.key));
  return Object.fromEntries(SECRET_KEYS.map((key) => [
    key,
    stored.has(key) ? "db" : process.env[key.toUpperCase()] ? "env" : null,
  ])) as Record<SecretKey, "db" | "env" | null>;
}

export const clearSettingsCache = () => cache.clear();
