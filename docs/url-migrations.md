# URL migrations

Every change of the site's addresses, with the old and the new URL, so that Search Console's "Page with redirect" and "Not found" reports can be checked against it. Each old URL must answer with one 301 to its new address (`frontend/scripts/seo-smoke.mjs` and `seo-crawl.mjs` check it weekly).

## 2026-10-25: case studies and articles by slug

The pages now live at readable addresses; the old address by CMS document ID answers with a 301 (`pages/projects/[id].vue`, `pages/news/[id].vue`). The slug is the same in every language: `/ru/projects/<slug>`, `/uz/projects/<slug>`.

| Old | New |
|---|---|
| /projects/m79mik1r5fuciwdthlp0w08n | /projects/poyqadam-brand-identity |
| /projects/whppp7vemlh9ra7ufsf3z0ky | /projects/raviosta-restaurant-identity |
| /projects/sfjntmxh23d1fwk50s3yrl08 | /projects/rush-coffee-logo |
| /projects/n7rsuvvd1zyfkwzkm9knq3rn | /projects/street-vibe-tuning-logo |
| /projects/lf9kuj4v3r4cpaj46xyrnsso | /projects/grechno-brand-identity |
| /news/zztkud74sbscajz3k646rykf | /news/pepsi-brand-identity-2025 |
| (new) | /news/logo-cost-tashkent-2026 |
| (new) | /news/logo-identity-brand-book |

A new case study or article gets its slug in the admin panel (field "slug"); until it has one, its page stays at its document ID.

The old address formats of 2026-10-13/14 (`/ProjectSlug/<id>`, `/NewsSlug/<id>`, with or without `/ru`, `/uz`, `/en`) also answer with one 301 straight to the slug (`server/utils/cmsSlugs.ts`, which reads the ids and slugs from the CMS every 10 minutes); when the CMS does not answer, they go to `/projects/<id>`, which redirects once more.

## 2026-10-23: service pages

`/services/<category id>` (the CMS category) became the repo's own service pages with a slug in each language, for example `/services/logo-design`, `/ru/services/razrabotka-logotipa`, `/uz/services/logotip-yaratish`. `/services/rq51r0st097n29olxjbe1q5h` answers with a 301 to `/services/branding`, and a service slug of another language to the page's own (`server/middleware/legacy-urls.ts`).

## 2026-10-13/14: lowercase addresses, English at "/"

`/About`, `/ContactPage`, `/Costs`, `/Oneguarantee`, `/NewsSlug/<id>`, `/ProjectSlug/<id>`, `/ProductSlug/<id>` and other casings answer with a 301 to the lowercase page; `/en` and `/en/*` to the same page without the prefix (`server/middleware/legacy-urls.ts`). `www.onebrandingworld.com` answers with a 301 to the same path and query without www (a Cloudflare redirect rule).
