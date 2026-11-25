import { eq } from "drizzle-orm";
import { z } from "zod";
import { clients } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireEditor } from "../../utils/auth";
import { normalizePhone, normalizeUsername } from "../../utils/contacts";
import { useDb } from "../../utils/db";
import { idParam, notFound } from "../../utils/http";

const schema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  contactName: z.string().trim().max(150).nullable().optional(),
  industryId: z.number().int().positive().nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  telegram: z.string().trim().max(60).nullable().optional(),
  whatsapp: z.string().trim().max(40).nullable().optional(),
  instagram: z.string().trim().max(80).nullable().optional(),
  email: z.string().trim().max(200).nullable().optional(),
  firstChannelId: z.number().int().positive().nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requireEditor(event);
  const id = idParam(event);
  const body = await readValidatedBody(event, schema.parse);
  const patch: Partial<typeof clients.$inferInsert> = { ...body };
  if (body.phone !== undefined) patch.phone = body.phone ? normalizePhone(body.phone) : null;
  if (body.whatsapp !== undefined) patch.whatsapp = body.whatsapp ? normalizePhone(body.whatsapp) : null;
  if (body.telegram !== undefined) patch.telegram = body.telegram ? normalizeUsername(body.telegram) : null;
  const [client] = await useDb().update(clients).set(patch).where(eq(clients.id, id)).returning();
  if (!client) throw notFound("Клиент");
  await audit(event, "client.update", "client", id);
  return client;
});
