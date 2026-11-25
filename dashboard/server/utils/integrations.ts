// The state of every outside connection (ads APIs, the CBU rates, the site's
// tracker, Telegram, Instagram): when it last worked, its last error. The
// Expenses page shows it and the hourly check alerts after 24 h of silence.
import { integrationStatus } from "../db/schema";
import { useDb } from "./db";

export const INTEGRATION_LABELS: Record<string, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  yandex: "Яндекс Директ",
  cbu: "Курсы ЦБ (cbu.uz)",
  tracker: "Трекер сайта",
  telegram: "Telegram-бот",
  instagram: "Instagram",
  meta_capi: "Meta Conversions API",
};

export async function markIntegration(provider: string, result: { ok: boolean; error?: string; details?: unknown }) {
  const now = new Date();
  const values = {
    provider,
    lastAttemptAt: now,
    ...(result.ok ? { lastSuccessAt: now, lastError: null, alertedAt: null } : { lastError: (result.error || "Ошибка").slice(0, 500) }),
    ...(result.details !== undefined ? { details: result.details } : {}),
  };
  await useDb().insert(integrationStatus).values(values).onConflictDoUpdate({
    target: integrationStatus.provider,
    set: values,
  });
}
