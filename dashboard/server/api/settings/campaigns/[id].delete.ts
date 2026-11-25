import { eq } from "drizzle-orm";
import { campaigns } from "../../../db/schema";
import { audit } from "../../../utils/audit";
import { requireOwner } from "../../../utils/auth";
import { useDb } from "../../../utils/db";
import { idParam } from "../../../utils/http";

export default defineEventHandler(async (event) => {
  await requireOwner(event);
  const id = idParam(event);
  try {
    await useDb().delete(campaigns).where(eq(campaigns.id, id));
  } catch {
    throw createError({ statusCode: 409, message: "К кампании привязаны сделки или расходы, её нельзя удалить" });
  }
  await audit(event, "campaign.delete", "campaign", id);
  return { ok: true };
});
