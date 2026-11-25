// A user changes their own password; their other sessions are closed.
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { sessions, users } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireUser } from "../../utils/auth";
import { hashPassword, verifyPassword } from "../../utils/crypto";
import { useDb } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await readValidatedBody(event, z.object({ current: z.string().max(200), next: z.string().min(10).max(200) }).parse);
  const db = useDb();
  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  if (!row || !(await verifyPassword(body.current, row.passwordHash))) {
    throw createError({ statusCode: 422, message: "Текущий пароль неверен" });
  }
  await db.update(users).set({ passwordHash: await hashPassword(body.next) }).where(eq(users.id, user.id));
  await db.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.id, user.sessionId)));
  await audit(event, "auth.password_changed", "user", user.id);
  return { ok: true };
});
