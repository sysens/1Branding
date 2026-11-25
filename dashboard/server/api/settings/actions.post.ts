// Buttons of Settings → Connections and the Expenses page: refresh ads
// spend now, load CBU rates, connect the Telegram webhook, send a test
// notification, refresh Instagram statistics, re-apply the channel rules.
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { visitors, visits } from "../../db/schema";
import { syncAds } from "../../utils/ads";
import { audit } from "../../utils/audit";
import { requireEditor, requireOwner } from "../../utils/auth";
import { channelIdForTouch, forgetChannels } from "../../utils/channels";
import { randomToken } from "../../utils/crypto";
import { rows, useDb } from "../../utils/db";
import { fetchCbuRates } from "../../utils/fx";
import { syncInstagramStats } from "../../utils/instagram";
import { markIntegration } from "../../utils/integrations";
import { getSecret, setSecret } from "../../utils/settings";
import { sendToOwners, telegramCall } from "../../utils/telegram";

const schema = z.object({
  action: z.enum(["sync_ads", "fx_refresh", "telegram_webhook", "telegram_test", "instagram_stats", "recompute_channels"]),
  days: z.number().int().min(1).max(90).optional(),
});

export default defineEventHandler(async (event) => {
  const { action, days } = await readValidatedBody(event, schema.parse);
  if (action === "sync_ads") {
    await requireEditor(event);
    const report = await syncAds(days ?? 3);
    await audit(event, "ads.sync", null, null, report);
    return { ok: true, report };
  }
  await requireOwner(event);

  if (action === "fx_refresh") {
    const count = await fetchCbuRates();
    await markIntegration("cbu", { ok: true });
    return { ok: true, message: `Курсы ЦБ загружены: ${count}` };
  }
  if (action === "telegram_webhook") {
    const url = `${String(useRuntimeConfig(event).public.appUrl).replace(/\/$/, "")}/api/telegram/webhook`;
    let secret = await getSecret("telegram_webhook_secret");
    if (!secret) {
      secret = randomToken(24);
      await setSecret("telegram_webhook_secret", secret);
    }
    await telegramCall("setWebhook", {
      url,
      secret_token: secret,
      allowed_updates: ["message", "business_connection", "business_message", "edited_business_message"],
      drop_pending_updates: false,
    });
    await markIntegration("telegram", { ok: true });
    await audit(event, "telegram.webhook", null, null, { url });
    return { ok: true, message: `Вебхук подключён: ${url}` };
  }
  if (action === "telegram_test") {
    const sent = await sendToOwners("✅ Тестовое уведомление из дашборда OneBranding");
    if (!sent) throw createError({ statusCode: 422, message: "Укажите токен бота и chat ID" });
    return { ok: true, message: "Отправлено" };
  }
  if (action === "instagram_stats") {
    return { ok: true, message: await syncInstagramStats() };
  }
  // Re-applies the "UTM → channel" rules to visitors and visits (after the rules were edited).
  forgetChannels();
  const db = useDb();
  const list = await rows<{ id: string; first_touch: unknown; last_touch: unknown }>(sql`SELECT id, first_touch, last_touch FROM visitors`);
  for (const visitor of list) {
    const first = await channelIdForTouch(visitor.first_touch as never);
    const last = await channelIdForTouch((visitor.last_touch ?? visitor.first_touch) as never);
    await db.update(visitors).set({ firstChannelId: first, lastChannelId: last }).where(eq(visitors.id, visitor.id));
  }
  const visitList = await rows<{ id: string; touch: unknown }>(sql`SELECT id, touch FROM visits`);
  for (const visit of visitList) {
    await db.update(visits).set({ channelId: await channelIdForTouch(visit.touch as never) }).where(eq(visits.id, visit.id));
  }
  await audit(event, "channels.recompute", null, null, { visitors: list.length, visits: visitList.length });
  return { ok: true, message: `Пересчитано: ${list.length} посетителей, ${visitList.length} визитов` };
});
