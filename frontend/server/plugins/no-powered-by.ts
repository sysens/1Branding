// Nuxt's renderer adds "x-powered-by: Nuxt" to every page; it only tells
// scanners what to probe, so it is dropped (buffered and cached pages via
// render:response, anything else before the response goes out).
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:response", (response) => {
    if (response?.headers) delete (response.headers as Record<string, unknown>)["x-powered-by"];
  });
  nitroApp.hooks.hook("beforeResponse", (event) => {
    if (!event.node.res.headersSent) event.node.res.removeHeader("x-powered-by");
  });
});
