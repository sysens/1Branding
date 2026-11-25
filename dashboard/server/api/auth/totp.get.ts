// 2FA setup: a new secret (kept encrypted until confirmed) and its QR code.
import { eq } from "drizzle-orm";
import { renderSVG } from "uqr";
import { users } from "../../db/schema";
import { sessionUser } from "../../utils/auth";
import { encrypt } from "../../utils/crypto";
import { useDb } from "../../utils/db";
import { newTotpSecret, totpUri } from "../../utils/totp";

export default defineEventHandler(async (event) => {
  const user = await sessionUser(event);
  if (!user || user.stage !== "active") throw createError({ statusCode: 401, message: "Требуется вход" });
  if (user.totpEnabled) throw createError({ statusCode: 409, message: "Двухфакторная защита уже включена" });
  const secret = newTotpSecret();
  await useDb().update(users).set({ totpSecret: encrypt(secret) }).where(eq(users.id, user.id));
  const uri = totpUri(secret, user.email);
  return { secret, uri, svg: renderSVG(uri, { border: 1 }) };
});
