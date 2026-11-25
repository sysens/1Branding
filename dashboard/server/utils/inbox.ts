// Messages from Telegram (business bot on @Onebranding_contact, spec 8.2)
// and Instagram Direct (spec 8.3) become leads and the deal's conversation.
// A new conversation creates a deal in "New"; the contact code in its first
// message brings in the visitor's source. When the owner answers a deal
// still in "New", it moves to "Contacted" (that is the first response).
import { desc, eq } from "drizzle-orm";
import { deals, messages, stages } from "../db/schema";
import { useDb } from "./db";
import { moveDeal, stageByKey } from "./deals";
import { createLead, findContactCode } from "./leads";
import { notifyNewLead } from "./notify";

export type InboxMessage = {
  channel: "telegram" | "instagram";
  threadId: string;
  externalId: string;
  direction: "in" | "out";
  text: string | null;
  at: Date;
  senderName?: string | null;
  username?: string | null;
};

async function latestDeal(message: InboxMessage) {
  const column = message.channel === "telegram" ? deals.telegramChatId : deals.instagramThreadId;
  const [deal] = await useDb().select().from(deals).where(eq(column, message.threadId)).orderBy(desc(deals.createdAt)).limit(1);
  return deal ?? null;
}

export async function receiveInboxMessage(message: InboxMessage, wait?: (promise: Promise<unknown>) => void) {
  const db = useDb();
  let deal = await latestDeal(message);

  if (!deal) {
    // The owner writing first to someone is a personal chat, not a lead.
    if (message.direction === "out") return null;
    const code = findContactCode(message.text);
    const created = await createLead({
      origin: message.channel,
      name: message.senderName ?? null,
      telegram: message.channel === "telegram" ? message.username ?? null : null,
      telegramUserId: message.channel === "telegram" ? message.threadId : null,
      telegramChatId: message.channel === "telegram" ? message.threadId : null,
      instagram: message.channel === "instagram" ? message.username ?? message.threadId : null,
      instagramThreadId: message.channel === "instagram" ? message.threadId : null,
      method: message.channel === "telegram" ? "telegram" : null,
      code,
      // No code: "Telegram, source unknown" (spec 4.2); Instagram Direct: "Instagram".
      channelKey: message.channel === "instagram" ? "instagram" : "unknown",
    });
    deal = created.deal;
    const promise = notifyNewLead(deal.id).catch((error) => console.error("[inbox] notify", error));
    if (wait) wait(promise);
  }

  await db.insert(messages).values({
    dealId: deal.id,
    channel: message.channel,
    direction: message.direction,
    text: message.text?.slice(0, 8000) ?? null,
    senderName: message.senderName?.slice(0, 150) ?? null,
    externalId: message.externalId,
    at: message.at,
  }).onConflictDoUpdate({ target: messages.externalId, set: { text: message.text?.slice(0, 8000) ?? null } });

  if (message.direction === "out") {
    const [stage] = await db.select().from(stages).where(eq(stages.id, deal.stageId));
    if (stage?.key === "new") {
      const contacted = await stageByKey("contacted");
      await moveDeal(deal.id, contacted.id, null).catch(() => null);
    }
  }
  return deal;
}
