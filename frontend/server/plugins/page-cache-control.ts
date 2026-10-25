/**
 * Browsers ask the server again for a page's HTML on every visit (a 304 when
 * nothing changed); only the server and a CDN keep it.
 *
 * The page cache (routeRules `cache` in nuxt.config.ts, Nitro's SWR handler)
 * sends `s-maxage=300, stale-while-revalidate` with a Last-Modified date, and
 * on a 304 h3 sends `public, max-age=300, s-maxage=300`. With either, a
 * browser may reuse the HTML for minutes without asking, and HTML from before
 * a deploy points at /_nuxt/ files that no longer exist: the page then loads
 * without its stylesheet. `max-age=0` makes the browser revalidate; the
 * server-side cache and `s-maxage` stay as they are.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", (event) => {
    if (event.method !== "GET" && event.method !== "HEAD") return;
    const path = event.path.split("?")[0] || "";
    // Pages only: not /_nuxt/ files, payloads, the sitemap or other files.
    if (path.startsWith("/_") || /\.[a-z0-9]+$/i.test(path)) return;
    const res = event.node.res;
    const setHeader = res.setHeader.bind(res);
    res.setHeader = (name, value) => {
      if (String(name).toLowerCase() === "cache-control") {
        const shared = /s-maxage=(\d+)/.exec(String(value));
        if (shared) return setHeader(name, `max-age=0, s-maxage=${shared[1]}, stale-while-revalidate`);
      }
      return setHeader(name, value);
    };
  });
});
