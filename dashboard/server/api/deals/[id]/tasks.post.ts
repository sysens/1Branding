// A task with a due date on a deal ("перезвонить 25.11").
import { z } from "zod";
import { tasks } from "../../../db/schema";
import { requireEditor } from "../../../utils/auth";
import { useDb } from "../../../utils/db";
import { idParam } from "../../../utils/http";

const schema = z.object({
  text: z.string().trim().min(1).max(500),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireEditor(event);
  const dealId = idParam(event);
  const body = await readValidatedBody(event, schema.parse);
  const [task] = await useDb().insert(tasks).values({
    dealId,
    text: body.text,
    dueOn: body.dueOn ?? null,
    assigneeId: body.assigneeId ?? user.id,
    createdBy: user.id,
  }).returning();
  return task;
});
