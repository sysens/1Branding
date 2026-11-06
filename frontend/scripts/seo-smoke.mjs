// Live SEO smoke test of the production site (weekly in CI, or by hand):
// `node scripts/seo-smoke.mjs [https://onebrandingworld.com]`.
// For each key page in every language it checks what a crawler sees in the
// server HTML: status 200, one H1, a title and description, an absolute
// self-canonical, robots allowing indexing and the hreflang set; then
// robots.txt, the sitemap, and that old addresses answer with one 301.
const ORIGIN = (process.argv[2] || process.env.SITE_URL || "https://onebrandingworld.com").replace(/\/+$/, "");
const PAGES = [
  "/", "/about", "/services", "/services/branding", "/services/logo-design", "/projects", "/showcase", "/pricing", "/contact", "/news",
  "/ru", "/ru/about", "/ru/services", "/ru/services/razrabotka-logotipa", "/ru/pricing", "/ru/contact",
  "/uz", "/uz/about", "/uz/services", "/uz/services/logotip-yaratish", "/uz/pricing", "/uz/contact",
];
const REDIRECTS = [
  ["/en/About", "/about"],
  ["/ru/", "/ru"],
  ["/ContactPage", "/contact"],
  ["/services/rq51r0st097n29olxjbe1q5h", "/services/branding"],
];

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};
const attr = (html, pattern) => (html.match(pattern) || [])[1] || "";
const get = (path, init = {}) => fetch(ORIGIN + path, { redirect: "manual", headers: { "user-agent": "OneBranding-SEO-smoke/1.0" }, ...init });

for (const path of PAGES) {
  const res = await get(path);
  const html = await res.text();
  const title = attr(html, /<title[^>]*>([^<]*)<\/title>/i);
  const description = attr(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
  const canonical = attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
  const robots = attr(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i);
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  const hreflangs = ["en", "ru", "uz", "x-default"].filter((code) => html.includes(`hreflang="${code}"`));
  const expected = `${ORIGIN}${path}`;
  const problems = [
    res.status !== 200 && `status ${res.status}`,
    !title && "no title",
    title.length > 70 && `title ${title.length} chars`,
    !description && "no description",
    canonical !== expected && `canonical ${canonical || "missing"}`,
    /noindex/i.test(robots) && "noindex",
    h1s !== 1 && `${h1s} h1`,
    hreflangs.length !== 4 && `hreflang ${hreflangs.join(",")}`,
  ].filter(Boolean);
  check(path, problems.length === 0, problems.join("; "));
}

let res = await get("/robots.txt");
const robotsTxt = await res.text();
// Cloudflare's managed block in front of ours disallows AI training bots
// (GPTBot, ClaudeBot...): only the groups for every crawler ("*") and for
// Googlebot/Yandex/Bingbot must leave the site open.
const groups = robotsTxt.split(/\n\s*\n/).map((block) => ({
  agents: [...block.matchAll(/^User-agent:\s*(.+)$/gim)].map((match) => match[1].trim().toLowerCase()),
  blocksAll: /^Disallow:\s*\/\s*$/im.test(block),
}));
const searchBlocked = groups.some((group) => group.blocksAll && group.agents.some((agent) => ["*", "googlebot", "yandex", "bingbot"].includes(agent)));
check("robots.txt", res.status === 200 && robotsTxt.includes(`Sitemap: ${ORIGIN}/sitemap.xml`) && !searchBlocked, `${res.status}${searchBlocked ? ", search crawlers blocked" : ""}`);

res = await get("/sitemap.xml");
const sitemap = await res.text();
const urls = (sitemap.match(/<loc>/g) || []).length;
check("sitemap.xml", res.status === 200 && urls >= 60 && sitemap.includes(`${ORIGIN}/uz/services/logotip-yaratish`), `${res.status}, ${urls} URLs`);

for (const [from, to] of REDIRECTS) {
  res = await get(from);
  const location = res.headers.get("location") || "";
  check(`301 ${from}`, res.status === 301 && (location === to || location === `${ORIGIN}${to}`), `${res.status} ${location}`);
}

// The www host (a Cloudflare redirect rule) sends every address, with its path
// and query, to the same address without www in one 301.
try {
  const www = await fetch(`${ORIGIN.replace("://", "://www.")}/about?ref=smoke`, { redirect: "manual" });
  const location = www.headers.get("location") || "";
  check("301 www", www.status === 301 && location === `${ORIGIN}/about?ref=smoke`, `${www.status} ${location}`);
} catch (error) {
  check("301 www", false, error.message);
}

console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
process.exit(results.every(Boolean) ? 0 : 1);
