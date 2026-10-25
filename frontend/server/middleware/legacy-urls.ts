import { LEGACY_SERVICE_IDS, serviceByKey, serviceBySlug } from "../../app/utils/servicePages";
import { withCmsSlug, type FetchSlugs } from "../utils/cmsSlugs";

/**
 * One permanent redirect from any old or non-canonical page address to its
 * final URL, never a chain:
 * - the www host to the bare domain;
 * - the old "/en" prefix (English is the default, at "/");
 * - a trailing slash ("/ru/", "/about/");
 * - old page names (/About, /ContactPage, /Costs, /Oneguarantee,
 *   /NewsSlug/<id>, /ProjectSlug/<id>, /ProductSlug/<id>) and any other
 *   casing of the current ones;
 * - service pages: the old CMS category id, or a service's slug in another
 *   language, to the slug of the requested language.
 * - an old case study or article address by its CMS document id, to its
 *   readable one (/ProjectSlug/<id> to /projects/<slug>, server/utils/cmsSlugs.ts).
 * The language prefix (/ru, /uz) and the query string are kept.
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
  services: "/services",
  privacy: "/privacy",
};

const DETAIL_SECTIONS: Record<string, string> = {
  news: "/news",
  newsslug: "/news",
  projects: "/projects",
  projectslug: "/projects",
  services: "/services",
  productslug: "/services",
};

const LOCALES = new Set(["ru", "uz"]);

type Locale = "en" | "ru" | "uz";

/** The canonical form of a page path, or null when the path is not a page. */
export const canonicalPagePath = (pathname: string): string | null => {
  const segments = pathname.split("/").slice(1);
  if (segments.length > 1 && segments[segments.length - 1] === "") segments.pop();
  let first = segments[0]?.toLowerCase() || "";
  // "/en/..." is the default language without its old prefix.
  if (first === "en") {
    segments.shift();
    first = segments[0]?.toLowerCase() || "";
  }
  const locale: Locale = LOCALES.has(first) ? (first as Locale) : "en";
  const rest = locale === "en" ? segments : segments.slice(1);
  const prefix = locale === "en" ? "" : `/${locale}`;

  if (rest.length === 0 || (rest.length === 1 && rest[0] === "")) return prefix || "/";
  const [section = "", id] = rest;
  if (rest.length === 1) {
    const page = PAGES[section.toLowerCase()];
    return page ? `${prefix}${page}` : null;
  }
  if (rest.length !== 2 || !id || id.includes(".")) return null;
  const base = DETAIL_SECTIONS[section.toLowerCase()];
  if (!base) return null;
  if (base === "/services") {
    const legacy = LEGACY_SERVICE_IDS[id];
    const service = serviceBySlug(id) ?? (legacy ? serviceByKey(legacy) : undefined);
    if (service) return `${prefix}/services/${service.slugs[locale]}`;
    // Any other old product/category address (a CMS document id) goes to the
    // services hub rather than to a page that no longer exists.
    if (section.toLowerCase() === "productslug" || /^[a-z0-9]{24}$/.test(id)) return `${prefix}/services`;
  }
  return `${prefix}${base}/${id}`;
};

export default defineEventHandler(async (event) => {
  if (event.method !== "GET" && event.method !== "HEAD") return;
  const url = getRequestURL(event);
  const host = (getRequestHeader(event, "x-forwarded-host") || getRequestHeader(event, "host") || "").split(",")[0]!.trim().toLowerCase();
  const bareHost = host.startsWith("www.") ? host.slice(4) : "";

  const canonical = canonicalPagePath(url.pathname);
  if (!bareHost && (!canonical || canonical === url.pathname)) return;
  // The id address of a case study or article would redirect once more, to its slug.
  const path = canonical
    ? await withCmsSlug(canonical, String(useRuntimeConfig(event).public.graphqlUrl || ""), $fetch as unknown as FetchSlugs)
    : url.pathname;
  const location = bareHost ? `https://${bareHost}${path}${url.search}` : `${path}${url.search}`;
  return sendRedirect(event, location, 301);
});
