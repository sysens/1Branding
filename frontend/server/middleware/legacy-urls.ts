/**
 * Page URLs are lowercase (/about, /contact, /news/<id>, ...). Old addresses
 * (/About, /ContactPage, /Costs, /Oneguarantee, /NewsSlug/<id>, /ProjectSlug/<id>,
 * /ProductSlug/<id>) and any other casing of the new ones get a 301 to the
 * canonical URL, with the /ru prefix and the query string kept.
 *
 * Only page shapes are touched (one segment, or a section plus an id without a
 * file extension), never asset paths such as /News/<file>.png or /OneGuarantee/<file>.
 */
const PAGES: Record<string, string> = {
  about: "/about",
  projects: "/projects",
  contact: "/contact",
  contactpage: "/contact",
  pricing: "/pricing",
  costs: "/pricing",
  "one-guarantee": "/one-guarantee",
  oneguarantee: "/one-guarantee",
  news: "/news",
};

const DETAIL_SECTIONS: Record<string, string> = {
  news: "/news",
  newsslug: "/news",
  projects: "/projects",
  projectslug: "/projects",
  services: "/services",
  productslug: "/services",
};

export default defineEventHandler((event) => {
  if (event.method !== "GET" && event.method !== "HEAD") return;
  const url = getRequestURL(event);
  const segments = url.pathname.split("/").slice(1);
  const hasLocale = segments[0]?.toLowerCase() === "ru";
  const rest = hasLocale ? segments.slice(1) : segments;
  if (rest.length && rest[rest.length - 1] === "") rest.pop();
  const [section = "", id] = rest;

  let target: string | undefined;
  if (rest.length === 1) target = PAGES[section.toLowerCase()];
  else if (rest.length === 2 && id && !id.includes(".")) {
    const base = DETAIL_SECTIONS[section.toLowerCase()];
    if (base) target = `${base}/${id}`;
  }
  if (!target) return;

  const canonical = `${hasLocale ? "/ru" : ""}${target}`;
  if (canonical === url.pathname) return;
  return sendRedirect(event, `${canonical}${url.search}`, 301);
});
