// Spend typed in by hand: bloggers, Telegram placements, marketplaces'
// paid promotion (spec 5, 6.8).
import { z } from "zod";
import { expenses } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireEditor } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { ratesFor } from "../../utils/fx";

const expenseSchema = z.object({
  spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  channelId: z.number().int().positive(),
  campaignId: z.number().int().positive().nullable().optional(),
  amount: z.number().positive().max(1e12),
  currency: z.string().length(3),
  impressions: z.number().int().nonnegative().nullable().optional(),
  clicks: z.number().int().nonnegative().nullable().optional(),
  comment: z.string().trim().max(500).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireEditor(event);
  const body = await readValidatedBody(event, expenseSchema.parse);
  const currency = body.currency.toUpperCase();
  const [row] = await useDb().insert(expenses).values({
    spentOn: body.spentOn,
    channelId: body.channelId,
    campaignId: body.campaignId ?? null,
    amount: body.amount,
    currency,
    ...(await ratesFor(body.spentOn, currency)),
    source: "manual",
    impressions: body.impressions ?? null,
    clicks: body.clicks ?? null,
    comment: body.comment || null,
    createdBy: user.id,
  }).returning();
  await audit(event, "expense.create", "expense", row!.id, { amount: body.amount, currency });
  return row;
});
