import { normalizeOrigin } from "~/utils/seo";

/**
 * Public origin used for canonical/hreflang/OG URLs, robots.txt and the sitemap.
 * `NUXT_PUBLIC_SITE_URL` wins so every mirror (e.g. *.up.railway.app) canonicalises
 * to the production domain; without it the request's own (proxied) origin is used.
 */
export const useSiteOrigin = () => {
  const configured = normalizeOrigin(String(useRuntimeConfig().public.siteUrl || ""));
  if (configured) return configured;
  return useRequestURL({ xForwardedHost: true, xForwardedProto: true }).origin;
};
