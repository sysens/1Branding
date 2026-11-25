// Month plans: leads and revenue (spec 6.1, 6.7).
import { z } from "zod";
import { plans } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireOwner } from "../../utils/auth";
import { useDb } from "../../utils/db";

const schema = z.array(z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
  leads: z.number().int().nonnegative().max(1e6).nullable(),
  revenue: z.number().nonnegative().max(1e12).nullable(),
  currency: z.enum(["USD", "UZS"]),
})).max(36);

export default defineEventHandler(async (event) => {
  await requireOwner(event);
  const items = await readValidatedBody(event, schema.parse);
  const db = useDb();
  for (const item of items) {
    await db.insert(plans).values(item).onConflictDoUpdate({
      target: plans.month,
      set: { leads: item.leads, revenue: item.revenue, currency: item.currency },
    });
  }
  await audit(event, "plans.save", "plans", null, { months: items.map((i) => i.month) });
  return { ok: true };
});
