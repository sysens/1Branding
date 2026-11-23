import { siteBySlug, siteOrigin } from "#shared/sites";

/**
 * The registry entry of a site and its public address. A page uses it for
 * canonical and Open Graph URLs: they always name the site's own host, also
 * when the page is previewed under /<slug> on another one.
 */
export function useMicroSite(slug: string) {
  const site = siteBySlug(slug);
  if (!site) throw createError({ statusCode: 500, statusMessage: `Site "${slug}" is not in shared/sites.ts` });
  const origin = siteOrigin(site);
  return {
    site,
    origin,
    /** Absolute URL on the site's host; also accepts asset URLs like /_nuxt/x.jpg. */
    url: (path = "/") => new URL(path, origin).href,
  };
}
