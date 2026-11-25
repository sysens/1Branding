/**
 * /api/ob/<path>: the site's one door to the CRM and analytics dashboard
 * (admin.onebrandingworld.com), which listens only on Railway's private
 * network. The browser posts here, on the site's own origin (the CSP's
 * connect-src 'self'), and the request goes on to
 * NUXT_DASHBOARD_INTERNAL_URL/api/public/<path> with the shared secret
 * (NUXT_DASHBOARD_PROXY_SECRET) and the visitor's real IP address.
 *
 * Two paths: `c` (the visitor tracker's batches, plugins/ob-tracker.client.ts)
 * and `lead` (the request form, composables/useLeadForm.ts). POST only, 64 KB
 * at most, 8 s at most. When the dashboard is not configured, cannot be
 * reached or fails (5xx), the answer is 503 {error: {message: "unavailable"}}:
 * the form then sends the request to Strapi instead, and the tracker stops for
 * that page. The dashboard's own answers (200, 400, 429) pass through as they
 * are. Never cached.
 */
import type { H3Event } from "h3";

const PATHS = new Set(["c", "lead"]);
const MAX_BODY = 64 * 1024;
const TIMEOUT_MS = 8_000;
const FORWARDED = ["user-agent", "content-type", "accept-language", "referer"];

const fail = (event: H3Event, status: number, message: string) => {
  setResponseStatus(event, status);
  return { error: { message } };
};

// Cloudflare's header first (the site is behind it), then the first hop
// Railway's proxy recorded, then the connection itself.
const clientIp = (event: H3Event) =>
  getRequestHeader(event, "cf-connecting-ip")?.trim()
  || getRequestHeader(event, "x-forwarded-for")?.split(",")[0]?.trim()
  || event.node.req.socket?.remoteAddress
  || "";

/**
 * The body, or null when it is over `max` bytes. A longer body is still read
 * to its end, without being kept: leaving the loop destroys the connection
 * under the response (Nitro's shutdown handler then throws). Only a body
 * sixteen times over the limit is cut off.
 */
const readLimited = async (event: H3Event, max: number) => {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of event.node.req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    if (size <= max) chunks.push(part);
    else if (size > max * 16) break;
  }
  return size > max ? null : Buffer.concat(chunks);
};

let warned = 0;
const warn = (message: string) => {
  // At most once a minute: a dashboard that is down would otherwise fill the log.
  if (Date.now() - warned < 60_000) return;
  warned = Date.now();
  console.warn(`[ob-proxy] ${message}`);
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  const path = getRouterParam(event, "path") || "";
  if (!PATHS.has(path)) return fail(event, 404, "not found");
  if (event.method !== "POST") {
    setResponseHeader(event, "allow", "POST");
    return fail(event, 405, "method not allowed");
  }

  const config = useRuntimeConfig(event);
  const base = String(config.dashboardInternalUrl || "").trim().replace(/\/+$/, "");
  const secret = String(config.dashboardProxySecret || "");
  if (!base || !secret) return fail(event, 503, "unavailable");

  if (Number(getRequestHeader(event, "content-length") || 0) > MAX_BODY) return fail(event, 413, "too large");
  const body = await readLimited(event, MAX_BODY);
  if (!body) return fail(event, 413, "too large");

  const headers: Record<string, string> = { "x-ob-proxy-secret": secret, "x-ob-client-ip": clientIp(event) };
  for (const name of FORWARDED) {
    const value = getRequestHeader(event, name);
    if (value) headers[name] = value;
  }

  try {
    const upstream = await fetch(`${base}/api/public/${path}`, {
      method: "POST",
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await upstream.text();
    if (upstream.status >= 500 || upstream.status < 200 || (upstream.status >= 300 && upstream.status < 400)) {
      warn(`dashboard answered ${upstream.status}`);
      return fail(event, 503, "unavailable");
    }
    setResponseStatus(event, upstream.status);
    setResponseHeader(event, "content-type", upstream.headers.get("content-type") || "application/json");
    const retryAfter = Number(upstream.headers.get("retry-after") || Number.NaN);
    if (Number.isFinite(retryAfter)) setResponseHeader(event, "retry-after", retryAfter);
    return text;
  } catch (error) {
    warn(`dashboard unreachable (${(error as Error)?.name || "error"})`);
    return fail(event, 503, "unavailable");
  }
});
