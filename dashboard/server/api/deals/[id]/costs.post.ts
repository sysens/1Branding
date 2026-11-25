// A cost of a deal (contractors, print, a shoot): it lowers gross profit and ROI.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { COST_CATEGORIES } from "../../../../shared/utils/constants";
import { dealCosts, deals } from "../../../db/schema";
import { audit } from "../../../utils/audit";
import { requireEditor } from "../../../utils/auth";
import { useDb } from "../../../utils/db";
import { ratesFor } from "../../../utils/fx";
import { idParam, notFound } from "../../../utils/http";

const schema = z.object({
  category: z.enum(COST_CATEGORIES),
  amount: z.number().positive().max(1e12),
  currency: z.string().length(3),
  spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(500).optional().nullable(),
});

export default defineEventHandler(async (event) => {
  await requireEditor(event);
  const dealId = idParam(event);
  const body = await readValidatedBody(event, schema.parse);
  const db = useDb();
  const [deal] = await db.select({ id: deals.id }).from(deals).where(eq(deals.id, dealId));
  if (!deal) throw notFound("Сделка");
  const currency = body.currency.toUpperCase();
  const [cost] = await db.insert(dealCosts).values({
    dealId,
    category: body.category,
    amount: body.amount,
    currency,
    ...(await ratesFor(body.spentOn, currency)),
    spentOn: body.spentOn,
    note: body.note || null,
  }).returning();
  await audit(event, "cost.create", "deal", dealId, { amount: body.amount, currency });
  return cost;
});
