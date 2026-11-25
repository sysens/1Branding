// Every request: security headers; for the private API, a same-origin check
// on changes (the session cookie is SameSite=Lax, this is the second lock
// against cross-site requests). The site's public endpoints and the
// webhooks have their own checks (proxy secret, Telegram/Meta signatures).
const PUBLIC_PREFIXES = ["/api/public/", "/api/telegram/", "/api/instagram/", "/healthz", "/r/"];

export default defineEventHandler((event) => {
  const path = event.path || "/";
  setResponseHeaders(event, {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "same-origin",
    "x-robots-tag": "noindex, nofollow",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    ...(process.env.NODE_ENV === "production" ? { "strict-transport-security": "max-age=31536000; includeSubDomains" } : {}),
  });

  if (!path.startsWith("/api/") || PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))) return;
  setResponseHeader(event, "cache-control", "no-store");
  const method = event.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const origin = getHeader(event, "origin");
  const host = getHeader(event, "x-forwarded-host") || getHeader(event, "host");
  const sameOrigin = (() => {
    try {
      return !!origin && !!host && new URL(origin).host === host;
    } catch {
      return false;
    }
  })();
  if (!sameOrigin) throw createError({ statusCode: 403, message: "Запрос с чужого сайта отклонён" });
});
