// End-to-end checks of the built site: `bun run build && bun run test:e2e`.
// Starts .output/server with a stand-in for the backend's private network
// address (a local proxy to the public GraphQL API, read-only queries) and
// checks the page cache, /healthz, legacy-URL redirects, asset caching, the
// news slider and the fallback to the public URL when the private one fails.
import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";

const dir = path.resolve(process.argv[2] || path.join(import.meta.dirname, ".."));
const PUBLIC = process.env.E2E_GRAPHQL_URL || "https://onebrandingbackend.up.railway.app/graphql";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The stand-in for http://1branding.railway.internal:1337/graphql.
let proxyHits = 0;
const proxy = http.createServer(async (req, res) => {
  proxyHits++;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const upstream = await fetch(PUBLIC, { method: "POST", headers: { "content-type": "application/json" }, body: Buffer.concat(chunks) });
  res.writeHead(upstream.status, { "content-type": "application/json" });
  res.end(Buffer.from(await upstream.arrayBuffer()));
});
await new Promise((r) => proxy.listen(1338, "127.0.0.1", r));

const logs = [];
const server = spawn(process.execPath, [path.join(dir, ".output/server/index.mjs")], {
  env: { ...process.env, PORT: "3099", HOST: "127.0.0.1", NUXT_PUBLIC_GRAPHQL_URL: PUBLIC, NUXT_GRAPHQL_URL_INTERNAL: "http://127.0.0.1:1338/graphql" },
});
server.stdout.on("data", (d) => logs.push(String(d)));
server.stderr.on("data", (d) => logs.push(String(d)));
const BASE = "http://127.0.0.1:3099";
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`${BASE}/healthz`)).ok) break; } catch { /* not up yet */ }
  await sleep(500);
}

try {
  let res = await fetch(`${BASE}/healthz`);
  check("healthz", res.status === 200 && (await res.text()) === "ok", String(res.status));

  const headers = { "x-forwarded-host": "onebrandingworld.com", "x-forwarded-proto": "https" };
  let t = Date.now();
  res = await fetch(`${BASE}/`, { headers });
  const first = await res.text();
  const firstMs = Date.now() - t;
  check("home renders through the private URL", res.status === 200 && proxyHits > 0, `${res.status}, ${proxyHits} proxy hits, ${firstMs} ms`);
  check("cache-control set", /s-maxage=300/.test(res.headers.get("cache-control") || ""), res.headers.get("cache-control"));
  // Browsers revalidate a page's HTML, so none keeps one that points at a previous build's files.
  check("browsers revalidate pages", /(^|, )max-age=0\b/.test(res.headers.get("cache-control") || ""), res.headers.get("cache-control"));
  const lastModified = res.headers.get("last-modified");
  check("canonical uses the forwarded host", first.includes('href="https://onebrandingworld.com/"'), (first.match(/rel="canonical"[^>]*/) || [""])[0]);
  // The page's data (CMS media URLs among it) is in its extracted payload.
  const payloadSrc = (first.match(/data-src="([^"]+)"/) || [])[1]?.replace(/&amp;/g, "&");
  const payload = payloadSrc ? await (await fetch(BASE + payloadSrc, { headers })).text() : "";
  check("home has CMS content", payload.includes("r2.dev"), payloadSrc || "no payload");

  res = await fetch(`${BASE}/`, { headers: { ...headers, "if-modified-since": lastModified || "" } });
  check("a revalidated page is a 304 the browser still revalidates", res.status === 304 && /(^|, )max-age=0\b/.test(res.headers.get("cache-control") || ""), `${res.status} ${res.headers.get("cache-control")}`);
  const hitsBefore = proxyHits;
  t = Date.now();
  res = await fetch(`${BASE}/`, { headers });
  const second = await res.text();
  check("second request served from cache", res.status === 200 && proxyHits === hitsBefore && second.length > 1000, `${Date.now() - t} ms vs ${firstMs} ms`);

  res = await fetch(`${BASE}/`, { headers: { "x-forwarded-host": "onebranding.up.railway.app", "x-forwarded-proto": "https" } });
  const other = await res.text();
  check("other host gets its own cache entry", other.includes('href="https://onebranding.up.railway.app/"'), (other.match(/rel="canonical"[^>]*/) || [""])[0]);

  check("no x-powered-by header", !res.headers.get("x-powered-by"), res.headers.get("x-powered-by") || "");
  check("home lists every language", ["en", "ru", "uz", "x-default"].every((code) => first.includes(`hreflang="${code}"`)), "");
  res = await fetch(`${BASE}/ru`, { headers });
  check("/ru renders", res.status === 200 && (await res.text()).includes('lang="ru'), String(res.status));
  res = await fetch(`${BASE}/uz`, { headers });
  check("/uz renders", res.status === 200 && (await res.text()).includes('lang="uz'), String(res.status));

  for (const page of ["/about", "/projects", "/contact", "/pricing", "/one-guarantee", "/news", "/services", "/privacy", "/uz/about", "/uz/contact"]) {
    res = await fetch(BASE + page, { headers, redirect: "manual" });
    check(`${page} renders`, res.status === 200, String(res.status));
  }

  res = await fetch(`${BASE}/projects/does-not-exist-xyz`, { headers });
  check("missing project is a 404", res.status === 404, String(res.status));

  // Old addresses and other casings redirect to the canonical page; assets do not.
  for (const [from, to] of [
    ["/About", "/about"],
    ["/ContactPage", "/contact"],
    ["/ru/ContactPage", "/ru/contact"],
    ["/Costs", "/pricing"],
    ["/Oneguarantee?x=1", "/one-guarantee?x=1"],
    ["/News", "/news"],
    ["/NewsSlug/abc", "/news/abc"],
    ["/ProjectSlug/abc", "/projects/abc"],
    ["/ProductSlug/abc", "/services"],
    // One hop from the old /en prefix, a trailing slash and the old CMS category.
    ["/en/About", "/about"],
    ["/en/ProjectSlug/abc", "/projects/abc"],
    // A case study or article by its document id goes straight to its slug.
    ["/ProjectSlug/whppp7vemlh9ra7ufsf3z0ky", "/projects/raviosta-restaurant-identity"],
    ["/ru/NewsSlug/zztkud74sbscajz3k646rykf", "/ru/news/pepsi-brand-identity-2025"],
    ["/ru/", "/ru"],
    ["/about/", "/about"],
    ["/services/rq51r0st097n29olxjbe1q5h", "/services/branding"],
    ["/ru/services/branding", "/ru/services/brending"],
    ["/uz/services/razrabotka-logotipa", "/uz/services/logotip-yaratish"],
  ]) {
    res = await fetch(BASE + from, { redirect: "manual", headers });
    check(`redirect ${from}`, res.status === 301 && res.headers.get("location") === to, `${res.status} ${res.headers.get("location")}`);
  }
  res = await fetch(`${BASE}/about`, { redirect: "manual", headers: { "x-forwarded-host": "www.onebrandingworld.com", "x-forwarded-proto": "https" } });
  check("www redirects to the bare domain", res.status === 301 && res.headers.get("location") === "https://onebrandingworld.com/about", `${res.status} ${res.headers.get("location")}`);

  // Service pages: one per service in each language, with its own slug.
  for (const page of ["/services/logo-design", "/ru/services/razrabotka-logotipa", "/uz/services/logotip-yaratish"]) {
    res = await fetch(BASE + page, { headers, redirect: "manual" });
    const html = await res.text();
    check(`${page} renders a service page`, res.status === 200 && html.includes('"@type":"Service"') && html.includes("<h1"), String(res.status));
  }
  res = await fetch(`${BASE}/ru/services/razrabotka-logotipa`, { headers });
  const servicePage = await res.text();
  check("service hreflang uses each language's slug", servicePage.includes('hreflang="uz" href="https://onebrandingworld.com/uz/services/logotip-yaratish"') && servicePage.includes('hreflang="en" href="https://onebrandingworld.com/services/logo-design"'), "");
  res = await fetch(`${BASE}/services/not-a-service`, { headers });
  check("unknown service is a 404", res.status === 404, String(res.status));
  res = await fetch(`${BASE}/sitemap.xml`, { headers });
  const sitemap = await res.text();
  check("sitemap lists the service pages in every language", res.status === 200 && sitemap.includes("/uz/services/logotip-yaratish") && sitemap.includes("/ru/services/razrabotka-logotipa"), String(res.status));

  res = await fetch(`${BASE}/OneGuarantee/image95.webp`, { redirect: "manual" });
  check("asset folder not redirected", res.status === 200, String(res.status));
  res = await fetch(`${BASE}/pricing`, { headers });
  check("pages are not cached for a year", !/max-age=31536000/.test(res.headers.get("cache-control") || ""), res.headers.get("cache-control"));
  res = await fetch(`${BASE}/Costs/one.webp`);
  check("/Costs assets cached for a year", /max-age=31536000/.test(res.headers.get("cache-control") || ""), res.headers.get("cache-control"));

  res = await fetch(`${BASE}/news`, { headers });
  check("/news has the more-news slider", (await res.text()).includes("news-title"), "");

  res = await fetch(`${BASE}/contact`, { headers });
  const contact = await res.text();
  check("/contact renders the form with its limits", contact.includes("form-send") && contact.includes('maxlength="200"'), "");

  // Private address down: pages still render through the public URL.
  await new Promise((r) => proxy.close(r));
  proxy.closeAllConnections?.();
  res = await fetch(`${BASE}/one-guarantee?fresh=1`, { headers });
  check("falls back to the public URL", res.status === 200 && (await res.text()).length > 1000, String(res.status));
  check("fallback logged", logs.join("").includes("private network request failed"), "");
} finally {
  server.kill();
  proxy.close();
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
process.exit(results.every(Boolean) ? 0 : 1);
