// Instagram Direct messages from Meta's webhook (spec 8.3): a new
// conversation becomes a deal in "New" with the source "Instagram", the
// messages are kept on the deal. The X-Hub-Signature-256 header (HMAC of the
// body with the app secret) proves the call is Meta's.
import { createHmac } from "node:crypto";
import { safeEqual } from "../../utils/crypto";
import { receiveInboxMessage } from "../../utils/inbox";
import { markIntegration } from "../../utils/integrations";
import { getSecret } from "../../utils/settings";

type Messaging = {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: { mid: string; text?: string; is_echo?: boolean; attachments?: unknown[] };
};
type Payload = { object?: string; entry?: Array<{ id: string; messaging?: Messaging[] }> };

async function usernameOf(igsid: string): Promise<string | null> {
  const token = await getSecret("instagram_access_token");
  if (!token) return null;
  const host = token.startsWith("IG") ? "graph.instagram.com" : "graph.facebook.com";
  try {
    const response = await fetch(`https://${host}/v21.0/${encodeURIComponent(igsid)}?fields=username,name&access_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { username?: string; name?: string };
    return body.username ?? body.name ?? null;
  } catch {
    return null;
  }
}

export default defineEventHandler(async (event) => {
  const raw = (await readRawBody(event, "utf8")) ?? "";
  const appSecret = await getSecret("meta_app_secret");
  const signature = String(getHeader(event, "x-hub-signature-256") || "");
  const expected = `sha256=${createHmac("sha256", appSecret || "missing").update(raw).digest("hex")}`;
  if (!appSecret || !safeEqual(signature, expected)) throw createError({ statusCode: 403, message: "forbidden" });

  const payload = JSON.parse(raw || "{}") as Payload;
  if (payload.object !== "instagram") return { ok: true };
  const account = await getSecret("instagram_account_id");
  for (const entry of payload.entry ?? []) {
    for (const item of entry.messaging ?? []) {
      if (!item.message?.mid) continue;
      const outgoing = !!item.message.is_echo || item.sender.id === account || item.sender.id === entry.id;
      const thread = outgoing ? item.recipient.id : item.sender.id;
      const username = outgoing ? null : await usernameOf(thread);
      await receiveInboxMessage({
        channel: "instagram",
        threadId: thread,
        externalId: `ig:${item.message.mid}`,
        direction: outgoing ? "out" : "in",
        text: item.message.text ?? (item.message.attachments?.length ? "[вложение]" : null),
        at: new Date(item.timestamp),
        senderName: outgoing ? "OneBranding" : username,
        username: username ? `@${username}` : null,
      }, (promise) => event.waitUntil(promise));
    }
  }
  await markIntegration("instagram", { ok: true });
  return { ok: true };
});
