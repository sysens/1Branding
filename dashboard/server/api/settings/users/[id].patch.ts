// Edits a user: name, role, Telegram id, switched off; or resets their
// password (a new one-time password is returned) or their 2FA.
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { ROLES } from "../../../../shared/utils/constants";
import { sessions, users } from "../../../db/schema";
import { audit } from "../../../utils/audit";
import { requireOwner } from "../../../utils/auth";
import { hashPassword, randomToken } from "../../../utils/crypto";
import { useDb } from "../../../utils/db";
import { idParam, notFound } from "../../../utils/http";

const schema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
  telegramId: z.string().trim().max(40).nullable().optional(),
  resetPassword: z.boolean().optional(),
  reset2fa: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const me = await requireOwner(event);
  const id = idParam(event);
  const body = await readValidatedBody(event, schema.parse);
  const db = useDb();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw notFound("Пользователь");

  // There is always at least one active owner.
  if ((body.role && body.role !== "owner") || body.isActive === false) {
    const [{ value } = { value: 0 }] = await db.select({ value: count() }).from(users)
      .where(and(eq(users.role, "owner"), eq(users.isActive, true), ne(users.id, id)));
    if (user.role === "owner" && value === 0) throw createError({ statusCode: 422, message: "Нужен хотя бы один активный владелец" });
  }

  const patch: Partial<typeof users.$inferInsert> = {};
  if (body.name) patch.name = body.name;
  if (body.role) patch.role = body.role;
  if (body.isActive !== undefined) patch.isActive = body.isActive;
  if (body.telegramId !== undefined) patch.telegramId = body.telegramId || null;
  let password: string | null = null;
  if (body.resetPassword) {
    password = randomToken(12);
    patch.passwordHash = await hashPassword(password);
  }
  if (body.reset2fa) {
    patch.totpEnabled = false;
    patch.totpSecret = null;
  }
  if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, id));
  // A switched-off user, a new password or a reset 2FA: their sessions end.
  if (body.isActive === false || body.resetPassword || body.reset2fa || body.role) {
    if (id !== me.id) await db.delete(sessions).where(eq(sessions.userId, id));
  }
  await audit(event, "user.update", "user", id, { ...body, resetPassword: !!body.resetPassword });
  return { ok: true, password };
});
