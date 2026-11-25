// The user action log (spec 11), latest first.
import { desc, eq } from "drizzle-orm";
import { auditLog, users } from "../../db/schema";
import { requireOwner } from "../../utils/auth";
import { useDb } from "../../utils/db";

export default defineEventHandler(async (event) => {
  await requireOwner(event);
  const list = await useDb().select({ log: auditLog, user: users.name }).from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.userId)).orderBy(desc(auditLog.createdAt)).limit(300);
  return list.map((row) => ({ ...row.log, user: row.user }));
});
