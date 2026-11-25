// Deletes a deal (owners only): payments, notes, tasks and history go with it.
import { eq } from "drizzle-orm";
import { deals } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireOwner } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { idParam } from "../../utils/http";

export default defineEventHandler(async (event) => {
  await requireOwner(event);
  const id = idParam(event);
  await useDb().delete(deals).where(eq(deals.id, id));
  await audit(event, "deal.delete", "deal", id);
  return { ok: true };
});
