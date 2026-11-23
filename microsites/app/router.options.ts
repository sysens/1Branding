import type { RouterConfig } from "nuxt/schema";
import { siteForHost } from "#shared/sites";

// On a site's own host (ertex.onebrandingworld.com) the pages under
// app/pages/<slug>/ become the root of the site, and no other page exists
// there. Anywhere else the scanned routes stay as they are: "/" lists the
// sites and "/<slug>" previews one. This runs on the server for the request's
// host and in the browser for the address bar's, so both build the same routes.
export default {
  routes(scanned) {
    const host = import.meta.server ? useRequestURL({ xForwardedHost: true }).host : window.location.host;
    const site = siteForHost(host);
    if (!site) return scanned;

    const prefix = `/${site.slug}`;
    return scanned
      .filter((route) => route.path === prefix || route.path.startsWith(`${prefix}/`))
      .map((route) => ({ ...route, path: route.path.slice(prefix.length) || "/" }));
  },
} satisfies RouterConfig;
