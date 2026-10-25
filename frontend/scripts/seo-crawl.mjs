// Crawl of the live site from its sitemap (weekly in CI, or by hand):
// `node scripts/seo-crawl.mjs [https://onebrandingworld.com]`.
// What a crawler such as Screaming Frog reports, for every URL the sitemap
// lists: status 200 with no redirect, one title and one description that no
// other page repeats, a self-canonical, no noindex and one H1; then every
// internal link found on those pages must answer 200 (or one 301).
const ORIGIN = (process.argv[2] || process.env.SITE_URL || "https://onebrandingworld.com").replace(/\/+$/, "");
const HEADERS = { "user-agent": "OneBranding-SEO-crawl/1.0" };
const attr = (html, pattern) => (html.match(pattern) || [])[1] || "";
const decode = (value) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'");

const sitemap = await (await fetch(`${ORIGIN}/sitemap.xml`, { headers: HEADERS })).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
console.log(`${urls.length} URLs in the sitemap`);

const problems = [];
const titles = new Map();
const descriptions = new Map();
const links = new Set();

// A few pages at a time: the crawl should not look like an attack.
for (let i = 0; i < urls.length; i += 4) {
  await Promise.all(urls.slice(i, i + 4).map(async (url) => {
    const res = await fetch(url, { redirect: "manual", headers: HEADERS });
    if (res.status !== 200) {
      problems.push(`${url}: status ${res.status} ${res.headers.get("location") || ""}`);
      return;
    }
    const html = await res.text();
    const title = decode(attr(html, /<title[^>]*>([^<]*)<\/title>/i));
    const description = decode(attr(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i));
    const canonical = decode(attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i));
    const robots = attr(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i);
    const h1s = (html.match(/<h1[\s>]/gi) || []).length;
    if (!title) problems.push(`${url}: no title`);
    if (title.length > 70) problems.push(`${url}: title ${title.length} characters`);
    if (!description) problems.push(`${url}: no description`);
    if (canonical !== url) problems.push(`${url}: canonical ${canonical || "missing"}`);
    if (/noindex/i.test(robots)) problems.push(`${url}: noindex in the sitemap`);
    if (h1s !== 1) problems.push(`${url}: ${h1s} H1`);
    titles.set(title, [...(titles.get(title) || []), url]);
    descriptions.set(description, [...(descriptions.get(description) || []), url]);
    for (const match of html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)/g)) links.add(decode(match[1]));
  }));
}

for (const [title, pages] of titles) if (title && pages.length > 1) problems.push(`title repeated on ${pages.length} pages: "${title}"`);
for (const [description, pages] of descriptions) if (description && pages.length > 1) problems.push(`description repeated on ${pages.length} pages: ${pages.join(", ")}`);

const internal = [...links].filter((path) => !/\.(?:png|jpe?g|webp|avif|svg|pdf|txt|xml|ico)$/i.test(path));
console.log(`${internal.length} internal links`);
for (let i = 0; i < internal.length; i += 6) {
  await Promise.all(internal.slice(i, i + 6).map(async (path) => {
    const res = await fetch(ORIGIN + path, { redirect: "manual", headers: HEADERS });
    if (res.status === 200) return;
    if (res.status === 301) {
      const next = await fetch(new URL(res.headers.get("location") || "/", ORIGIN), { redirect: "manual", headers: HEADERS });
      if (next.status === 200) return;
      problems.push(`link ${path}: 301 to a ${next.status}`);
      return;
    }
    problems.push(`link ${path}: ${res.status}`);
  }));
}

for (const problem of problems) console.log(`FAIL  ${problem}`);
console.log(problems.length ? `\n${problems.length} problems` : "\nno problems");
process.exit(problems.length ? 1 : 0);
