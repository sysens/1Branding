// After the app has hydrated in a real browser, the page must still say what
// its server HTML said: title, description, canonical, robots, H1 and the
// language links. (A site-wide description once replaced each page's own
// after hydration, and Google, which renders pages, indexed that one.)
// `node scripts/seo-hydration.mjs [origin]`; needs the `playwright` package
// and Chromium (see .github/workflows/seo-smoke.yml).
import { chromium } from "playwright";

const ORIGIN = (process.argv[2] || process.env.SITE_URL || "https://onebrandingworld.com").replace(/\/+$/, "");
const PAGES = ["/", "/ru/about", "/uz/services/logotip-yaratish", "/services/logo-design", "/ru/pricing", "/uz/contact"];

const read = () => ({
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
  canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
  robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
  h1: (document.querySelector("h1")?.textContent || "").replace(/\s+/g, " ").trim(),
  languages: Array.from(document.querySelectorAll("a[hreflang]"), (link) => `${link.getAttribute("hreflang")}=${link.getAttribute("href")}`).sort().join(" "),
});

const browser = await chromium.launch();
const results = [];
try {
  for (const path of PAGES) {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const raw = await context.newPage();
    await raw.goto(ORIGIN + path, { waitUntil: "domcontentloaded" });
    const server = await raw.evaluate(read);
    await context.close();

    const page = await browser.newPage();
    await page.goto(ORIGIN + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const hydrated = await page.evaluate(read);
    await page.close();

    const changed = Object.keys(server).filter((key) => server[key] !== hydrated[key]);
    const ok = changed.length === 0 && !!server.description && !!server.h1;
    results.push(ok);
    console.log(`${ok ? "PASS" : "FAIL"}  ${path}${changed.length ? `  (changed: ${changed.map((key) => `${key} "${server[key]}" -> "${hydrated[key]}"`).join("; ")})` : ""}`);
  }
} finally {
  await browser.close();
}
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
process.exit(results.every(Boolean) ? 0 : 1);
