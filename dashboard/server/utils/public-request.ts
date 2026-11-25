// Requests from the public site arrive through its server-side proxy
// (frontend/server/routes/api/ob/[...path].ts), which adds a shared secret
// and the visitor's real IP. Without the secret configured (local
// development) the request's own address is used.
import { createError, getHeader, readRawBody, type H3Event } from "h3";
import { clientIp } from "./auth";
import { safeEqual } from "./crypto";

const BOT_UA = /bot|crawler|spider|crawling|headless|lighthouse|pagespeed|preview|facebookexternalhit|slurp|bingpreview|yandex(?:bot|metrika|direct)|petalbot|ahrefs|semrush|mj12|python-requests|curl|wget|httpclient|phantomjs|puppeteer|playwright/i;

export const isBotUserAgent = (ua: string) => !ua || BOT_UA.test(ua);

export function publicClient(event: H3Event) {
  const secret = String(useRuntimeConfig(event).proxySecret || "");
  const given = String(getHeader(event, "x-ob-proxy-secret") || "");
  if (secret) {
    if (!given || !safeEqual(given, secret)) throw createError({ statusCode: 403, message: "forbidden" });
    return {
      ip: String(getHeader(event, "x-ob-client-ip") || "").trim() || clientIp(event),
      userAgent: String(getHeader(event, "user-agent") || "").slice(0, 400),
    };
  }
  if (process.env.NODE_ENV === "production") throw createError({ statusCode: 503, message: "proxy secret is not configured" });
  return { ip: clientIp(event), userAgent: String(getHeader(event, "user-agent") || "").slice(0, 400) };
}

/** The body as JSON (the tracker sends text/plain so sendBeacon needs no preflight), max 64 KB. */
export async function readJsonBody(event: H3Event, limit = 64 * 1024): Promise<unknown> {
  const raw = (await readRawBody(event, "utf8")) || "";
  if (raw.length > limit) throw createError({ statusCode: 413, message: "too large" });
  try {
    return JSON.parse(raw);
  } catch {
    throw createError({ statusCode: 400, message: "invalid json" });
  }
}
