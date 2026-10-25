# SEO changelog

What changed on the site and when, for search. When rankings or traffic move, compare the dates here with Google's updates (status.search.google.com) and with Search Console's Performance report (Country = Uzbekistan, brand and non-brand queries apart), before changing anything else.

## 2026-10-25

- Case studies: real titles, texts and palettes instead of "Lorem ipsum" (Poyqadam, Raviosta, RUSH, Street Vibe Tuning, grechno), in English, Russian and Uzbek; they are indexable and in the sitemap.
- Readable addresses for case studies and articles (`/projects/<slug>`, `/news/<slug>`), the old ones 301 ([url-migrations.md](url-migrations.md)).
- Blog: "How much does a logo cost in Tashkent in 2026?" and "Logo, brand identity and brand book: what is the difference?" in en/ru/uz; the Pepsi article in Russian and Uzbek. The CMS has an Uzbek locale.
- Article pages show paragraphs, headings, lists and links; "Show more" on /news is a crawlable link (`?page=N`).
- Service pages: prices as a table, the related case studies ("Our work"), hero shown at first paint (lab LCP on slow 4G 7.0 s → 1.4 s); /services 7.2 s → 3.7 s; fallback fonts matched to SF Pro (CLS ≈ 0).
- Home: the headline no longer starts at opacity 0 (LCP); 103 descriptive alts (portfolio and client logos, was 13); /projects wall sized in CSS before it measures (CLS 1.0 → 0); the inner pages' glow as an 8 KB AVIF.
- Branding service page title moved off the home page's query ("branding agency in Tashkent").
- Security headers: HSTS with includeSubDomains, Content-Security-Policy in report-only mode.
- /llms.txt; IndexNow key and `scripts/indexnow.mjs` (73 URLs submitted on 2026-10-25, 202).
- Weekly CI: `seo-smoke.mjs` (www 301 is now checked) and `seo-crawl.mjs` (every sitemap URL and internal link).
- docs: [keyword-map.csv](keyword-map.csv), [catalogs.md](catalogs.md).

## 2026-10-23/24

- Service pages in three languages (15 services), `/services` hub, Uzbek version (`/uz`), company name, address and phone in one place (`utils/company.ts`), JSON-LD with telephone, sameAs and price range, FAQ answers in the server HTML, Russian copy, www → apex 301.

## Every quarter

1. Run `node frontend/scripts/seo-crawl.mjs` and fix what it reports.
2. Search Console: Pages (indexed vs. sitemap, "Duplicate", "Not found"), Performance by page, Core Web Vitals.
3. Rerun the queries of [keyword-map.csv](keyword-map.csv) and note the positions there.
4. Review content: prices, claims, team, case studies; update, merge or remove what is outdated, and note it here.
