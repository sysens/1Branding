import type { H3Event } from "h3";
import { siteOrigin } from "./seoSitemap";

/**
 * Public origin for robots.txt and the sitemap: NUXT_PUBLIC_SITE_URL when set,
 * otherwise the (proxy-forwarded) origin the crawler actually requested.
 */
export const resolveSiteOrigin = (event: H3Event) => {
  const configured = String(useRuntimeConfig(event).public.siteUrl || "").trim();
  if (configured) {
    try {
      return siteOrigin(configured);
    } catch {
      // Fall through to the request origin rather than blocking all crawling.
    }
  }
  return getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin;
};
