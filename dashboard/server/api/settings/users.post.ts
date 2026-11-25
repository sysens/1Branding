// A new user with a one-time password shown once; they set up 2FA on first login.
import { sql } from "drizzle-orm";
import { z } from "zod";
import { ROLES } from "../../../shared/utils/constants";
import { users } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireOwner } from "../../utils/auth";
import { hashPassword, randomToken } from "../../utils/crypto";
import { useDb } from "../../utils/db";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  role: z.enum(ROLES),
  telegramId: z.string().trim().max(40).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requireOwner(event);
  const body = await readValidatedBody(event, schema.parse);
  const db = useDb();
  const [exists] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${body.email.toLowerCase()}`);
  if (exists) throw createError({ statusCode: 409, message: "Пользователь с таким e-mail уже есть" });
  const password = randomToken(12);
  const [user] = await db.insert(users).values({
    name: body.name,
    email: body.email.toLowerCase(),
    role: body.role,
    telegramId: body.telegramId || null,
    passwordHash: await hashPassword(password),
  }).returning({ id: users.id });
  await audit(event, "user.create", "user", user!.id, { role: body.role });
  return { id: user!.id, password };
});
