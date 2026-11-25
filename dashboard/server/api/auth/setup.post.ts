// The first owner, once: only while there are no users, and only with
// NUXT_SETUP_TOKEN (so nobody else can claim a fresh deployment).
import { count } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../db/schema";
import { audit } from "../../utils/audit";
import { clientIp, createSession } from "../../utils/auth";
import { hashPassword, safeEqual } from "../../utils/crypto";
import { useDb } from "../../utils/db";
import { enforce } from "../../utils/rate-limit";

const schema = z.object({
  token: z.string().min(1).max(200),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  password: z.string().min(10).max(200),
});

export default defineEventHandler(async (event) => {
  enforce(`setup:${clientIp(event)}`, 5, 15 * 60_000);
  const body = await readValidatedBody(event, schema.parse);
  const setupToken = String(useRuntimeConfig(event).setupToken || "");
  if (!setupToken || !safeEqual(body.token, setupToken)) throw createError({ statusCode: 403, message: "Неверный ключ установки" });
  const db = useDb();
  const [{ value } = { value: 0 }] = await db.select({ value: count() }).from(users);
  if (value > 0) throw createError({ statusCode: 409, message: "Владелец уже создан" });
  const [user] = await db.insert(users).values({
    email: body.email.toLowerCase(),
    name: body.name,
    role: "owner",
    passwordHash: await hashPassword(body.password),
  }).returning();
  await createSession(event, user!.id, "active");
  await audit(event, "user.setup", "user", user!.id);
  return { ok: true };
});
