// Edits a deal's terms and contacts. A contact code added later brings in
// the visitor's source, as it does when a deal is created.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { clients, contactCodes, deals, visitors } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireEditor } from "../../utils/auth";
import { channelIdForTouch } from "../../utils/channels";
import { normalizePhone, normalizeUsername } from "../../utils/contacts";
import { useDb } from "../../utils/db";
import { idParam, notFound } from "../../utils/http";
import { findContactCode } from "../../utils/leads";

const schema = z.object({
  title: z.string().trim().max(200).optional(),
  contactName: z.string().trim().max(150).nullable().optional(),
  amount: z.number().nonnegative().max(1e12).nullable().optional(),
  currency: z.string().length(3).optional(),
  serviceIds: z.array(z.number().int().positive()).max(30).optional(),
  expectedCloseOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  ownerId: z.number().int().positive().nullable().optional(),
  isRepeat: z.boolean().optional(),
  firstChannelId: z.number().int().positive().nullable().optional(),
  lastChannelId: z.number().int().positive().nullable().optional(),
  campaignId: z.number().int().positive().nullable().optional(),
  contactCode: z.string().trim().max(20).nullable().optional(),
  client: z.object({
    name: z.string().trim().min(1).max(200).optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    telegram: z.string().trim().max(60).nullable().optional(),
    whatsapp: z.string().trim().max(40).nullable().optional(),
    instagram: z.string().trim().max(80).nullable().optional(),
    email: z.string().trim().max(200).nullable().optional(),
    industryId: z.number().int().positive().nullable().optional(),
  }).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireEditor(event);
  const id = idParam(event);
  const body = await readValidatedBody(event, schema.parse);
  const db = useDb();
  const [deal] = await db.select().from(deals).where(eq(deals.id, id));
  if (!deal) throw notFound("Сделка");

  const { client, contactCode, ...fields } = body;
  const patch: Partial<typeof deals.$inferInsert> = { ...fields, ...(fields.currency ? { currency: fields.currency.toUpperCase() } : {}) };

  if (contactCode !== undefined) {
    const code = contactCode ? findContactCode(contactCode) : null;
    if (contactCode && !code) throw createError({ statusCode: 422, message: "Код обращения выглядит как OB-1234" });
    patch.contactCode = code;
    if (code) {
      const [row] = await db.select().from(contactCodes).where(eq(contactCodes.code, code));
      if (!row?.visitorId) throw createError({ statusCode: 422, message: "Такой код не найден: посетитель не нажимал кнопку мессенджера с ним" });
      const [visitor] = await db.select().from(visitors).where(eq(visitors.id, row.visitorId));
      patch.visitorId = row.visitorId;
      patch.firstTouch = visitor?.firstTouch ?? null;
      patch.lastTouch = visitor?.lastTouch ?? null;
      patch.firstChannelId = await channelIdForTouch(visitor?.firstTouch ?? visitor?.lastTouch);
      patch.lastChannelId = await channelIdForTouch(visitor?.lastTouch ?? visitor?.firstTouch);
      await db.update(contactCodes).set({ usedAt: new Date(), dealId: id }).where(eq(contactCodes.code, code));
    }
  }

  const [updated] = await db.update(deals).set(patch).where(eq(deals.id, id)).returning();

  if (client && deal.clientId) {
    const clientPatch: Partial<typeof clients.$inferInsert> = { ...client };
    if (client.phone !== undefined) clientPatch.phone = client.phone ? normalizePhone(client.phone) : null;
    if (client.whatsapp !== undefined) clientPatch.whatsapp = client.whatsapp ? normalizePhone(client.whatsapp) : null;
    if (client.telegram !== undefined) clientPatch.telegram = client.telegram ? normalizeUsername(client.telegram) : null;
    await db.update(clients).set(clientPatch).where(eq(clients.id, deal.clientId));
  }
  await audit(event, "deal.update", "deal", id, { fields: Object.keys(body), by: user.id });
  return updated;
});
