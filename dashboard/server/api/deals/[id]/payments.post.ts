// A payment on a deal: stored with the CBU rates of its date and the
// commission of the deal's marketplace (Fiverr), then reported to Telegram.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { PAYMENT_KINDS, PAYMENT_METHODS } from "../../../../shared/utils/constants";
import { tashkentDay } from "../../../../shared/utils/time";
import { channels, deals, payments } from "../../../db/schema";
import { audit } from "../../../utils/audit";
import { requireEditor } from "../../../utils/auth";
import { useDb } from "../../../utils/db";
import { ratesFor } from "../../../utils/fx";
import { idParam, notFound } from "../../../utils/http";
import { notifyPayment } from "../../../utils/notify";

const schema = z.object({
  kind: z.enum(PAYMENT_KINDS),
  amount: z.number().positive().max(1e12),
  currency: z.string().length(3),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  method: z.enum(PAYMENT_METHODS),
  note: z.string().trim().max(500).optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const user = await requireEditor(event);
  const dealId = idParam(event);
  const body = await readValidatedBody(event, schema.parse);
  if (body.paidOn > tashkentDay()) throw createError({ statusCode: 422, message: "Дата платежа ещё не наступила" });
  const db = useDb();
  const [deal] = await db.select().from(deals).where(eq(deals.id, dealId));
  if (!deal) throw notFound("Сделка");
  const currency = body.currency.toUpperCase();
  const rates = await ratesFor(body.paidOn, currency);
  const channelId = deal.lastChannelId ?? deal.firstChannelId;
  const [channel] = channelId ? await db.select().from(channels).where(eq(channels.id, channelId)) : [];
  const [payment] = await db.insert(payments).values({
    dealId,
    kind: body.kind,
    amount: body.amount,
    currency,
    ...rates,
    paidOn: body.paidOn,
    method: body.method,
    commissionPercent: channel?.commissionPercent ?? 0,
    note: body.note || null,
    createdBy: user.id,
  }).returning();
  if (!deal.firstPrepaymentAt) await db.update(deals).set({ firstPrepaymentAt: new Date() }).where(eq(deals.id, dealId));
  await audit(event, "payment.create", "payment", payment!.id, { dealId, amount: body.amount, currency });
  event.waitUntil(notifyPayment(payment!.id).catch((error) => console.error("[payment] telegram", error)));
  return payment;
});
