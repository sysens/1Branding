import type { MicroSite } from "#shared/sites";

// Crawlers may read a site that allows indexing, on its own host; every
// other host (the Railway domain, previews) is closed to them.
export default defineEventHandler((event) => {
  const site = event.context.site as MicroSite | undefined;
  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600");
  return site?.index ? "User-agent: *\nAllow: /\n" : "User-agent: *\nDisallow: /\n";
});
