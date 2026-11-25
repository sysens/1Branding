import { eq } from "drizzle-orm";
import { z } from "zod";
import { tasks } from "../../db/schema";
import { requireEditor } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { idParam, notFound } from "../../utils/http";

const schema = z.object({
  done: z.boolean().optional(),
  text: z.string().trim().min(1).max(500).optional(),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requireEditor(event);
  const id = idParam(event);
  const body = await readValidatedBody(event, schema.parse);
  const [task] = await useDb().update(tasks).set({
    ...body,
    ...(body.done !== undefined ? { doneAt: body.done ? new Date() : null } : {}),
  }).where(eq(tasks.id, id)).returning();
  if (!task) throw notFound("Задача");
  return task;
});
