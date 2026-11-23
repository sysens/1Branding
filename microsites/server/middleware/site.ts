import { siteForHost } from "#shared/sites";

// Only a site's own host may be indexed (and only if the site allows it):
// "/" on the Railway domain or a preview under /<slug> would be duplicates.
export default defineEventHandler((event) => {
  const site = siteForHost(getRequestHost(event, { xForwardedHost: true }));
  event.context.site = site;
  if (!site?.index) setHeader(event, "X-Robots-Tag", "noindex, nofollow");
});
