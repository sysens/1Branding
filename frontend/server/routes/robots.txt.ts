import { resolveSiteOrigin } from "../utils/requestOrigin";


export default defineEventHandler((event) => {
  const origin = resolveSiteOrigin(event);
  const disallow = [
    "/api/",
    "/__nuxt_error",
    "/*?*preview",
    "/*?*draft",
  ];

  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  // Short edge cache: an outdated robots.txt (an old "Disallow: /") kept being
  // served by some Cloudflare locations for hours after a deploy.
  setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");
  return [
    "User-agent: *",
    "Allow: /",
    ...disallow.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
});
