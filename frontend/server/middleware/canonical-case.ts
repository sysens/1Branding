/**
 * The router matches paths case-insensitively, so /about and /ABOUT render the
 * same page as /About and every variant called itself canonical. Page paths in
 * any other casing now get a 301 to the one canonical spelling (query kept).
 * Only page shapes are touched: /News, /NewsSlug/<id>, never asset paths such
 * as /OneGuarantee/<file> (a folder whose name differs from the page's).
 */
const PAGES = ["About", "ContactPage", "Costs", "News", "Oneguarantee", "Projects"];
const DETAIL_PAGES = ["NewsSlug", "ProductSlug", "ProjectSlug"];
const pageByLower = new Map(PAGES.map((name) => [name.toLowerCase(), name]));
const detailByLower = new Map(DETAIL_PAGES.map((name) => [name.toLowerCase(), name]));

export default defineEventHandler((event) => {
  if (event.method !== "GET" && event.method !== "HEAD") return;
  const url = getRequestURL(event);
  const segments = url.pathname.split("/").slice(1);
  const hasLocale = segments[0]?.toLowerCase() === "ru";
  const rest = hasLocale ? segments.slice(1) : segments;
  if (rest.length && rest[rest.length - 1] === "") rest.pop();
  const [name = "", id, ...extra] = rest;

  let canonical: string | undefined;
  if (rest.length === 1) canonical = pageByLower.get(name.toLowerCase());
  else if (rest.length === 2 && id && !extra.length) canonical = detailByLower.get(name.toLowerCase());
  if (!canonical) return;
  if (canonical === name && (!hasLocale || segments[0] === "ru")) return;

  const path = ["", ...(hasLocale ? ["ru"] : []), canonical, ...(rest.length === 2 ? [id] : [])].join("/");
  return sendRedirect(event, `${path}${url.search}`, 301);
});
