// 2FA setup, confirmed by the first code from the app.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../db/schema";
import { audit } from "../../utils/audit";
import { sessionUser } from "../../utils/auth";
import { decrypt } from "../../utils/crypto";
import { useDb } from "../../utils/db";
import { enforce } from "../../utils/rate-limit";
import { verifyTotp } from "../../utils/totp";

export default defineEventHandler(async (event) => {
  const user = await sessionUser(event);
  if (!user || user.stage !== "active") throw createError({ statusCode: 401, message: "Требуется вход" });
  enforce(`totp-setup:${user.id}`, 10, 10 * 60_000);
  const { code } = await readValidatedBody(event, z.object({ code: z.string().trim().max(12) }).parse);
  const [row] = await useDb().select().from(users).where(eq(users.id, user.id));
  if (!row?.totpSecret || !verifyTotp(decrypt(row.totpSecret), code)) {
    throw createError({ statusCode: 422, message: "Код не подошёл, попробуйте ещё раз" });
  }
  await useDb().update(users).set({ totpEnabled: true }).where(eq(users.id, user.id));
  await audit(event, "auth.2fa_enabled", "user", user.id);
  return { ok: true };
});
