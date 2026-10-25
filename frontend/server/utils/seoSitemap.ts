import { isPlaceholderCopy, toMetaDescription } from "../../app/utils/seo";
import { SITE_LOCALES, localizedPath, type SiteLocale } from "../../app/utils/locales";
import { SERVICE_PAGES } from "../../app/utils/servicePages";

type CmsLocale = "ru" | "en" | "uz";
type Collection = "newsPages_connection" | "projectsPages_connection";
type SingleType = "landingPage" | "aboutPage" | "contactsPage" | "price" | "oneGuarantee";
type Node = {
  documentId?: string | null;
  updatedAt?: string | null;
  section1?: { projectTitle?: string | null; text?: string | null } | null;
  section2?: { text?: string | null } | null;
} | null;
type Connection = {
  nodes?: Node[] | null;
  pageInfo?: { pageCount?: number | null } | null;
} | null;
type SitemapResponse = {
  data?: Partial<Record<Collection, Connection>> & Partial<Record<SingleType, { updatedAt?: string | null } | null>>;
  errors?: Array<{ message: string }>;
};
type FetchCms = (url: string, options: {
  method: "POST";
  headers: { "Content-Type": string };
  body: { query: string; variables: { page: number; pageSize: number; locale: CmsLocale } };
}) => Promise<SitemapResponse>;

const PAGE_SIZE = 100;
// CMS articles and case studies in each language they are written in. Most
// have English and Russian versions; the blog articles have Uzbek ones too (an
// Uzbek page without its own version repeats the English text, so it is left out).
const CMS_LOCALES: readonly CmsLocale[] = ["ru", "en", "uz"];
const collections: Record<Collection, string> = {
  newsPages_connection: "news",
  projectsPages_connection: "projects",
};

// The date the site's own copy (i18n, service pages) last changed in a way
// worth recrawling: bump it with such a change. A page's lastmod is the later
// of this and its CMS entry's updatedAt.
export const SITE_COPY_UPDATED = "2026-10-23";

// Pages in every language, with the CMS entry that feeds each one.
const staticPages: Array<{ path: string; source?: SingleType | Collection }> = [
  { path: "/", source: "landingPage" },
  { path: "/about", source: "aboutPage" },
  { path: "/services" },
  { path: "/projects", source: "projectsPages_connection" },
  { path: "/pricing", source: "price" },
  { path: "/one-guarantee", source: "oneGuarantee" },
  { path: "/news", source: "newsPages_connection" },
  { path: "/contact", source: "contactsPage" },
  { path: "/privacy" },
];

const query = `
  query SitemapEntries($page: Int!, $pageSize: Int!, $locale: I18NLocaleCode) {
    newsPages_connection(locale: $locale, pagination: { page: $page, pageSize: $pageSize }) {
      nodes { documentId updatedAt }
      pageInfo { pageCount }
    }
    projectsPages_connection(locale: $locale, pagination: { page: $page, pageSize: $pageSize }) {
      nodes { documentId updatedAt section1 { projectTitle text } section2 { text } }
      pageInfo { pageCount }
    }
    landingPage(locale: $locale) { updatedAt }
    aboutPage(locale: $locale) { updatedAt }
    contactsPage(locale: $locale) { updatedAt }
    price(locale: $locale) { updatedAt }
    oneGuarantee(locale: $locale) { updatedAt }
  }
`;

export const siteOrigin = (siteUrl: string): string => {
  let url: URL;
  try {
    url = new URL(siteUrl.trim());
  } catch {
    throw new Error("A valid public siteUrl is required for the sitemap");
  }
  if (!/^https?:$/.test(url.protocol) || !url.hostname || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("public.siteUrl must be an HTTP(S) origin");
  }
  return url.origin;
};

const xmlEscape = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[character] || character);

const dateOrEmpty = (date?: string | null) => date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : "";
const latest = (...dates: Array<string | undefined>) => dates.reduce<string>((max, date) => (date && date > max ? date : max), "");

/** One page in its languages: the path of each version and when it changed. */
type PageGroup = { paths: Partial<Record<SiteLocale, string>>; updatedAt: Partial<Record<SiteLocale, string>> };

export async function buildSitemap(siteUrl: string, graphqlUrl: string, fetchCms: FetchCms): Promise<string> {
  const origin = siteOrigin(siteUrl);
  if (!graphqlUrl) throw new Error("A GraphQL URL is required for the sitemap");

  const groups = new Map<string, PageGroup>();
  const cmsDates: Partial<Record<SingleType | Collection, string>> = {};

  for (const locale of CMS_LOCALES) {
    let page = 1;
    let lastPage = 1;
    do {
      const response = await fetchCms(graphqlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { query, variables: { page, pageSize: PAGE_SIZE, locale } },
      });
      if (response.errors?.length || !response.data ||
        (Object.keys(collections) as Collection[]).some((collection) => !response.data?.[collection])) {
        throw new Error("CMS could not provide a complete sitemap page");
      }

      for (const type of ["landingPage", "aboutPage", "contactsPage", "price", "oneGuarantee"] as const) {
        cmsDates[type] = latest(cmsDates[type], dateOrEmpty(response.data[type]?.updatedAt));
      }

      for (const [collection, segment] of Object.entries(collections) as [Collection, string][]) {
        const connection = response.data[collection]!;
        if (!Array.isArray(connection.nodes)) {
          throw new Error("CMS sitemap nodes are unavailable");
        }
        const count = connection.pageInfo?.pageCount;
        // A missing/invalid page count cannot safely signal the end of pagination.
        if (!Number.isSafeInteger(count) || count! < 0) {
          throw new Error("CMS sitemap pagination is unavailable");
        }
        lastPage = Math.max(lastPage, count!);
        for (const node of connection.nodes) {
          const id = node?.documentId?.trim();
          if (!id) continue;
          // A case study still in "Lorem ipsum" (title or text) is served
          // noindex (pages/projects/[id].vue, same test); listing it would only
          // be reported back.
          if (collection === "projectsPages_connection" && isPlaceholderCopy(
            `${node?.section1?.projectTitle || ""} ${toMetaDescription(node?.section1?.text || node?.section2?.text)}`,
          )) continue;
          const path = `/${segment}/${encodeURIComponent(id)}`;
          const group = groups.get(path) ?? { paths: {}, updatedAt: {} };
          group.paths[locale] = localizedPath(path, locale);
          const updatedAt = dateOrEmpty(node?.updatedAt);
          if (updatedAt > (group.updatedAt[locale] || "")) group.updatedAt[locale] = updatedAt;
          cmsDates[collection] = latest(cmsDates[collection], updatedAt);
          groups.set(path, group);
        }
      }
      page += 1;
    } while (page <= lastPage);
  }

  const copyDate = dateOrEmpty(SITE_COPY_UPDATED);
  for (const { path, source } of staticPages) {
    const updated = latest(copyDate, source ? cmsDates[source] : undefined);
    groups.set(`static:${path}`, {
      paths: Object.fromEntries(SITE_LOCALES.map((locale) => [locale, localizedPath(path, locale)])),
      updatedAt: Object.fromEntries(SITE_LOCALES.map((locale) => [locale, updated])),
    });
  }
  for (const service of SERVICE_PAGES) {
    const updated = dateOrEmpty(service.updated);
    groups.set(`service:${service.key}`, {
      paths: Object.fromEntries(SITE_LOCALES.map((locale) => [locale, localizedPath(`/services/${service.slugs[locale]}`, locale)])),
      updatedAt: Object.fromEntries(SITE_LOCALES.map((locale) => [locale, updated])),
    });
  }

  const absolute = (path: string) => `${origin}${path}`;
  const entries: string[] = [];
  for (const group of groups.values()) {
    const locales = SITE_LOCALES.filter((locale) => group.paths[locale]);
    // English is the default language: x-default points at it when it exists.
    const links = locales.length > 1
      ? locales.map((language) =>
        `<xhtml:link rel="alternate" hreflang="${language}" href="${xmlEscape(absolute(group.paths[language]!))}"/>`
      ).concat(group.paths.en ? [`<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(absolute(group.paths.en))}"/>`] : [])
      : [];
    for (const locale of locales) {
      const lastmod = group.updatedAt[locale];
      entries.push(`<url><loc>${xmlEscape(absolute(group.paths[locale]!))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${links.join("")}</url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join("")}</urlset>`;
}
