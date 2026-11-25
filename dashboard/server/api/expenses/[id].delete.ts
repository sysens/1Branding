// Removes a hand-typed expense; API rows come back on the next sync, so they stay.
import { and, eq } from "drizzle-orm";
import { expenses } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireEditor } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { idParam, notFound } from "../../utils/http";

export default defineEventHandler(async (event) => {
  await requireEditor(event);
  const id = idParam(event);
  const [removed] = await useDb().delete(expenses).where(and(eq(expenses.id, id), eq(expenses.source, "manual"))).returning();
  if (!removed) throw notFound("Ручной расход");
  await audit(event, "expense.delete", "expense", id, removed);
  return { ok: true };
});
