import { resolveSiteOrigin } from "../utils/requestOrigin";

// Prototype routes kept in app/pages for reference; they also send X-Robots-Tag: noindex.
const PROTOTYPE_ROUTES = ["/testPage", "/Newsslug", "/Projectslug", "/idProductSlugSecondVersion", "/ProjectSlug/Products"];

export default defineEventHandler((event) => {
  const origin = resolveSiteOrigin(event);
  const disallow = [
    "/api/",
    "/__nuxt_error",
    "/*?*preview",
    "/*?*draft",
    ...PROTOTYPE_ROUTES.flatMap((path) => [path, `/en${path}`]),
  ];

  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600, s-maxage=3600");
  return [
    "User-agent: *",
    "Allow: /",
    ...disallow.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
});
