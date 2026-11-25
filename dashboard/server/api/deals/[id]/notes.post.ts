import { z } from "zod";
import { notes } from "../../../db/schema";
import { requireEditor } from "../../../utils/auth";
import { useDb } from "../../../utils/db";
import { idParam } from "../../../utils/http";

export default defineEventHandler(async (event) => {
  const user = await requireEditor(event);
  const dealId = idParam(event);
  const { text } = await readValidatedBody(event, z.object({ text: z.string().trim().min(1).max(4000) }).parse);
  const [note] = await useDb().insert(notes).values({ dealId, text, createdBy: user.id }).returning();
  return { ...note, author: user.name };
});
