// The Telegram bot: Bot API calls, and messages to the owners' shared chat
// (spec 9). The same bot can be the business bot of @Onebranding_contact
// (spec 8.2, server/api/telegram/webhook.post.ts).
import { getSecret } from "./settings";

export type InlineButton = { text: string; url: string };

export const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export async function telegramCall<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T> {
  const token = await getSecret("telegram_bot_token");
  if (!/^\d+:[\w-]+$/.test(token)) throw new Error("Токен Telegram-бота не задан");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
  // The error text may quote the request, never the token: Telegram does not echo the URL.
  if (!response.ok || !body?.ok) throw new Error(`Telegram ${method}: ${body?.description || `HTTP ${response.status}`}`);
  return body.result as T;
}

/** Sends to the owners' chat; `buttons` are rows of URL buttons. Returns false when not configured. */
export async function sendToOwners(html: string, buttons: InlineButton[][] = []): Promise<boolean> {
  const chatId = await getSecret("telegram_chat_id");
  const token = await getSecret("telegram_bot_token");
  if (!chatId || !token) return false;
  // Telegram refuses non-https URL buttons (and the whole message with them).
  const rows = buttons.map((row) => row.filter((b) => /^https:\/\//.test(b.url))).filter((row) => row.length);
  await telegramCall("sendMessage", {
    chat_id: chatId,
    text: html.slice(0, 4000),
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(rows.length ? { reply_markup: { inline_keyboard: rows } } : {}),
  });
  return true;
}
