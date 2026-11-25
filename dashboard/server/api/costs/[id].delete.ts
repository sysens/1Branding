import { eq } from "drizzle-orm";
import { dealCosts } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireEditor } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { idParam } from "../../utils/http";

export default defineEventHandler(async (event) => {
  await requireEditor(event);
  const id = idParam(event);
  await useDb().delete(dealCosts).where(eq(dealCosts.id, id));
  await audit(event, "cost.delete", "cost", id);
  return { ok: true };
});
