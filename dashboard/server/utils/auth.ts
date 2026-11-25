// Sessions and roles. The cookie holds a random token; the database keeps
// only its sha256. A login is two steps: the password opens a 10-minute
// "pending" session, the authenticator code turns it into a full one (and a
// user without 2FA yet must set it up before anything else). Roles are
// checked here, on the server, for every API call.
import { and, eq, gt, lt } from "drizzle-orm";
import { createError, deleteCookie, getCookie, getHeader, setCookie, type H3Event } from "h3";
import type { Role } from "#shared/utils/constants";
import { sessions, users } from "../db/schema";
import { randomToken, sha256 } from "./crypto";
import { useDb } from "./db";

export const SESSION_COOKIE = "ob_session";
const ACTIVE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const PENDING_TTL_MS = 10 * 60 * 1000;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
  totpEnabled: boolean;
  sessionId: string;
  stage: "pending_2fa" | "active";
};

const secureCookies = () => process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true";

export function clientIp(event: H3Event): string {
  return String(
    getHeader(event, "cf-connecting-ip")
    || getHeader(event, "x-forwarded-for")?.split(",")[0]
    || event.node.req.socket?.remoteAddress
    || "",
  ).trim();
}

export async function createSession(event: H3Event, userId: number, stage: "pending_2fa" | "active") {
  const token = randomToken();
  const ttl = stage === "active" ? ACTIVE_TTL_MS : PENDING_TTL_MS;
  await useDb().insert(sessions).values({
    id: sha256(token),
    userId,
    stage,
    expiresAt: new Date(Date.now() + ttl),
    ip: clientIp(event),
    userAgent: String(getHeader(event, "user-agent") || "").slice(0, 300),
  });
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(ttl / 1000),
  });
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE);
  if (token) await useDb().delete(sessions).where(eq(sessions.id, sha256(token)));
  deleteCookie(event, SESSION_COOKIE, { path: "/" });
}

/** The signed-in user of the request (full or pending session), or null. */
export async function sessionUser(event: H3Event): Promise<SessionUser | null> {
  if (event.context.sessionUser !== undefined) return event.context.sessionUser as SessionUser | null;
  const token = getCookie(event, SESSION_COOKIE);
  let found: SessionUser | null = null;
  if (token) {
    const db = useDb();
    const id = sha256(token);
    const [row] = await db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date()), eq(users.isActive, true)));
    if (row) {
      found = {
        id: row.user.id,
        email: row.user.email,
        name: row.user.name,
        role: row.user.role,
        totpEnabled: row.user.totpEnabled,
        sessionId: id,
        stage: row.session.stage,
      };
      // Sliding expiry for full sessions, refreshed at most every hour.
      if (row.session.stage === "active" && Date.now() - +row.session.lastSeenAt > 60 * 60 * 1000) {
        await db.update(sessions).set({ lastSeenAt: new Date(), expiresAt: new Date(Date.now() + ACTIVE_TTL_MS) }).where(eq(sessions.id, id));
      }
    }
  }
  event.context.sessionUser = found;
  return found;
}

const requireTwoFactor = () => process.env.NUXT_AUTH_REQUIRE_2FA !== "false";

/**
 * The full user of the request, or a 401/403. With `roles`, only those roles
 * pass. A user who still has to set up 2FA gets 403 "2fa_setup_required".
 */
export async function requireUser(event: H3Event, roles?: Role[]): Promise<SessionUser> {
  const user = await sessionUser(event);
  if (!user || user.stage !== "active") throw createError({ statusCode: 401, message: "Требуется вход" });
  if (requireTwoFactor() && !user.totpEnabled) {
    throw createError({ statusCode: 403, message: "2fa_setup_required" });
  }
  if (roles && !roles.includes(user.role)) throw createError({ statusCode: 403, message: "Недостаточно прав" });
  return user;
}

/** Owners and managers change CRM data; viewers only read. */
export const requireEditor = (event: H3Event) => requireUser(event, ["owner", "manager"]);
export const requireOwner = (event: H3Event) => requireUser(event, ["owner"]);

export async function purgeExpiredSessions() {
  await useDb().delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
