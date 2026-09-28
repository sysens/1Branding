import { siteOrigin } from "../utils/seoSitemap";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  let origin = "";
  try {
    origin = siteOrigin(String(config.public.siteUrl || ""));
  } catch {
    // An unconfigured deployment should not be indexed under an accidental host.
    setHeader(event, "Content-Type", "text/plain; charset=utf-8");
    return "User-agent: *\nDisallow: /\n";
  }

  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");
  return `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`;
});
