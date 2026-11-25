import { eq } from "drizzle-orm";
import { tasks } from "../../db/schema";
import { requireEditor } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { idParam } from "../../utils/http";

export default defineEventHandler(async (event) => {
  await requireEditor(event);
  await useDb().delete(tasks).where(eq(tasks.id, idParam(event)));
  return { ok: true };
});
