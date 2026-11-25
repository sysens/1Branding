// Merges a duplicate into this client: its deals move here, its contacts
// fill the empty fields, and the duplicate is removed (spec 6.6).
import { eq } from "drizzle-orm";
import { z } from "zod";
import { clients, deals } from "../../../db/schema";
import { audit } from "../../../utils/audit";
import { requireEditor } from "../../../utils/auth";
import { useDb } from "../../../utils/db";
import { idParam, notFound } from "../../../utils/http";

export default defineEventHandler(async (event) => {
  await requireEditor(event);
  const id = idParam(event);
  const { duplicateId } = await readValidatedBody(event, z.object({ duplicateId: z.number().int().positive() }).parse);
  if (duplicateId === id) throw createError({ statusCode: 422, message: "Нельзя объединить клиента с самим собой" });
  const db = useDb();
  const merged = await db.transaction(async (tx) => {
    const [target] = await tx.select().from(clients).where(eq(clients.id, id));
    const [duplicate] = await tx.select().from(clients).where(eq(clients.id, duplicateId));
    if (!target || !duplicate) throw notFound("Клиент");
    const fill: Partial<typeof clients.$inferInsert> = {};
    for (const key of ["contactName", "industryId", "phone", "telegram", "telegramUserId", "whatsapp", "instagram", "email", "firstChannelId"] as const) {
      if (!target[key] && duplicate[key]) (fill as Record<string, unknown>)[key] = duplicate[key];
    }
    if (duplicate.notes) fill.notes = [target.notes, duplicate.notes].filter(Boolean).join("\n\n");
    await tx.update(deals).set({ clientId: id }).where(eq(deals.clientId, duplicateId));
    await tx.delete(clients).where(eq(clients.id, duplicateId));
    const [updated] = Object.keys(fill).length
      ? await tx.update(clients).set(fill).where(eq(clients.id, id)).returning()
      : [target];
    return updated;
  });
  await audit(event, "client.merge", "client", id, { duplicateId });
  return merged;
});
