// Telegram Bot API webhook. Business updates (the bot connected to
// @Onebranding_contact through "Telegram for Business", read-only) feed the
// CRM; "/id" in any chat with the bot answers with the chat's id (to set up
// the owners' notification chat). The secret header proves it is Telegram.
import { telegramConnections } from "../../db/schema";
import { safeEqual } from "../../utils/crypto";
import { useDb } from "../../utils/db";
import { receiveInboxMessage } from "../../utils/inbox";
import { markIntegration } from "../../utils/integrations";
import { getSecret } from "../../utils/settings";
import { telegramCall } from "../../utils/telegram";

type TgUser = { id: number; first_name?: string; last_name?: string; username?: string };
type TgMessage = {
  message_id: number;
  date: number;
  chat: { id: number; type: string; first_name?: string; last_name?: string; username?: string; title?: string };
  from?: TgUser;
  text?: string;
  caption?: string;
  photo?: unknown;
  document?: unknown;
  voice?: unknown;
  video?: unknown;
  sticker?: { emoji?: string };
  business_connection_id?: string;
};
type Update = {
  message?: TgMessage;
  business_connection?: { id: string; user: TgUser; user_chat_id: number; date: number; is_enabled: boolean; can_reply?: boolean };
  business_message?: TgMessage;
  edited_business_message?: TgMessage;
};

const describe = (m: TgMessage) =>
  m.text ?? m.caption ?? (m.photo ? "[фото]" : m.document ? "[файл]" : m.voice ? "[голосовое]" : m.video ? "[видео]" : m.sticker ? `[стикер ${m.sticker.emoji ?? ""}]` : "[сообщение]");

export default defineEventHandler(async (event) => {
  const secret = await getSecret("telegram_webhook_secret");
  const given = String(getHeader(event, "x-telegram-bot-api-secret-token") || "");
  if (!secret || !given || !safeEqual(given, secret)) throw createError({ statusCode: 403, message: "forbidden" });
  const update = (await readBody<Update>(event)) ?? {};
  const db = useDb();

  if (update.business_connection) {
    const c = update.business_connection;
    await db.insert(telegramConnections).values({
      id: c.id, userId: String(c.user.id), userChatId: String(c.user_chat_id), username: c.user.username ?? null,
      isEnabled: c.is_enabled, canReply: !!c.can_reply,
    }).onConflictDoUpdate({
      target: telegramConnections.id,
      set: { isEnabled: c.is_enabled, canReply: !!c.can_reply, username: c.user.username ?? null, updatedAt: new Date() },
    });
    await markIntegration("telegram", { ok: true, details: { connection: c.is_enabled ? "on" : "off" } });
    return { ok: true };
  }

  const business = update.business_message ?? update.edited_business_message;
  if (business && business.chat.type === "private") {
    const [connection] = (await db.select().from(telegramConnections)).filter((c) => c.id === business.business_connection_id);
    const ownerId = connection?.userId;
    const fromOwner = !!ownerId && String(business.from?.id) === ownerId;
    const chat = business.chat;
    await receiveInboxMessage({
      channel: "telegram",
      threadId: String(chat.id),
      externalId: `tg:${chat.id}:${business.message_id}`,
      direction: fromOwner ? "out" : "in",
      text: describe(business),
      at: new Date(business.date * 1000),
      senderName: fromOwner ? "OneBranding" : [chat.first_name, chat.last_name].filter(Boolean).join(" ") || null,
      username: chat.username ?? null,
    }, (promise) => event.waitUntil(promise));
    await markIntegration("telegram", { ok: true });
    return { ok: true };
  }

  // "/id" to the bot (in a private chat or a group it was added to).
  const text = update.message?.text?.trim() ?? "";
  if (update.message && /^\/(id|start)(@\w+)?$/i.test(text)) {
    await telegramCall("sendMessage", {
      chat_id: update.message.chat.id,
      text: `ID этого чата: ${update.message.chat.id}\nУкажите его в дашборде: Настройки → Подключения → Telegram chat ID.`,
    }).catch(() => null);
  }
  return { ok: true };
});
