import { buildSitemap } from "../utils/seoSitemap";
import { resolveSiteOrigin } from "../utils/requestOrigin";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  try {
    const xml = await buildSitemap(
      resolveSiteOrigin(event),
      String(config.public.graphqlUrl || ""),
      (url, options) => $fetch(url, options)
    );
    setHeader(event, "Content-Type", "application/xml; charset=utf-8");
    setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");
    return xml;
  } catch {
    // Never serve an apparently complete, empty sitemap during CMS outages.
    throw createError({ statusCode: 503, statusMessage: "Sitemap is temporarily unavailable" });
  }
});
