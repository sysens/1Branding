// Step two of the login: the authenticator code turns the pending session into a full one.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../db/schema";
import { audit } from "../../utils/audit";
import { createSession, destroySession, sessionUser } from "../../utils/auth";
import { decrypt } from "../../utils/crypto";
import { useDb } from "../../utils/db";
import { enforce } from "../../utils/rate-limit";
import { verifyTotp } from "../../utils/totp";

const schema = z.object({ code: z.string().trim().max(12) });

export default defineEventHandler(async (event) => {
  const pending = await sessionUser(event);
  if (!pending || pending.stage !== "pending_2fa") throw createError({ statusCode: 401, message: "Сначала введите пароль" });
  enforce(`2fa:${pending.id}`, 6, 10 * 60_000);
  const { code } = await readValidatedBody(event, schema.parse);
  const [user] = await useDb().select().from(users).where(eq(users.id, pending.id));
  if (!user?.totpSecret || !verifyTotp(decrypt(user.totpSecret), code)) {
    await audit(event, "auth.2fa_failed", "user", pending.id);
    throw createError({ statusCode: 401, message: "Неверный код" });
  }
  await destroySession(event);
  await createSession(event, user.id, "active");
  await useDb().update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await audit(event, "auth.login", "user", user.id);
  return { ok: true };
});
