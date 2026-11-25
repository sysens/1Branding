// Step one of the login: e-mail and password. With 2FA on, this opens a
// 10-minute pending session for the code (2fa.post.ts).
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../db/schema";
import { audit } from "../../utils/audit";
import { clientIp, createSession, destroySession } from "../../utils/auth";
import { hashPassword, verifyPassword } from "../../utils/crypto";
import { useDb } from "../../utils/db";
import { enforce } from "../../utils/rate-limit";

const schema = z.object({ email: z.string().trim().max(200), password: z.string().max(200) });
// Checked when the e-mail is unknown, so both answers take as long.
let dummyHash: Promise<string> | null = null;

export default defineEventHandler(async (event) => {
  const ip = clientIp(event);
  const body = await readValidatedBody(event, schema.parse);
  const email = body.email.toLowerCase();
  enforce(`login-ip:${ip}`, 20, 15 * 60_000);
  enforce(`login-email:${email}`, 8, 15 * 60_000);

  const [user] = await useDb().select().from(users).where(sql`lower(${users.email}) = ${email}`);
  dummyHash ??= hashPassword("not-a-real-password");
  let valid = false;
  if (user && user.isActive) valid = await verifyPassword(body.password, user.passwordHash);
  else await verifyPassword(body.password, await dummyHash);
  if (!user || !valid) {
    await audit(event, "auth.login_failed", "user", user?.id ?? null, { email });
    throw createError({ statusCode: 401, message: "Неверный e-mail или пароль" });
  }
  await destroySession(event);
  if (user.totpEnabled) {
    await createSession(event, user.id, "pending_2fa");
    return { next: "2fa" };
  }
  await createSession(event, user.id, "active");
  await useDb().update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await audit(event, "auth.login", "user", user.id);
  return { next: process.env.NUXT_AUTH_REQUIRE_2FA === "false" ? "app" : "2fa_setup" };
});
