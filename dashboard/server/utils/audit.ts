// The log of what each user did (spec 11: "журнал действий пользователей").
import type { H3Event } from "h3";
import { auditLog } from "../db/schema";
import { clientIp, sessionUser } from "./auth";
import { useDb } from "./db";

export async function audit(event: H3Event | null, action: string, entity?: string | null, entityId?: string | number | null, details?: unknown) {
  try {
    const user = event ? await sessionUser(event) : null;
    await useDb().insert(auditLog).values({
      userId: user?.id ?? null,
      action,
      entity: entity ?? null,
      entityId: entityId == null ? null : String(entityId),
      details: details === undefined ? null : details,
      ip: event ? clientIp(event) : null,
    });
  } catch (error) {
    console.error("[audit] failed", error);
  }
}
