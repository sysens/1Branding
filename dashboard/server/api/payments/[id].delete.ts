// Removes a payment typed in by mistake (owners only).
import { eq } from "drizzle-orm";
import { payments } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireOwner } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { idParam, notFound } from "../../utils/http";

export default defineEventHandler(async (event) => {
  await requireOwner(event);
  const id = idParam(event);
  const [removed] = await useDb().delete(payments).where(eq(payments.id, id)).returning();
  if (!removed) throw notFound("Платёж");
  await audit(event, "payment.delete", "payment", id, removed);
  return { ok: true };
});
