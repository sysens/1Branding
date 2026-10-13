/**
 * A request path the way the router compares it: case-insensitive, without a
 * trailing slash, so `/API/Upload/` and `/api/upload` reach the same
 * controller. Middlewares that guard a route must compare the same way.
 */
export const routePath = (path: string): string => {
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    // Malformed escapes never match a route.
  }
  return decoded.toLowerCase().replace(/\/{2,}/g, '/').replace(/(.)\/+$/, '$1');
};
