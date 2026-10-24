// Dev server only: answers two kinds of requests that are not this app's
// before they reach the page renderer.
// - /api/presence: polled by a local tool; an empty 204.
// - /_next/*: a browser tab still open on an old Next.js app at this port
//   keeps reconnecting to /_next/webpack-hmr. Rendered as pages, those
//   long-lived requests filled the log with router warnings and their aborted
//   sockets ("write ECONNABORTED") made Nuxt restart. A plain 404 ends them.
export default defineEventHandler((event) => {
  if (!import.meta.dev) {
    return;
  }

  const path = getRequestURL(event).pathname;
  if (path === "/api/presence") {
    setResponseStatus(event, 204);
    return "";
  }
  if (path.startsWith("/_next/")) {
    setResponseStatus(event, 404);
    setResponseHeader(event, "cache-control", "no-store");
    return "";
  }
});
