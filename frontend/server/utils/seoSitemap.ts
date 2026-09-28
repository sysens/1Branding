type Locale = "ru" | "en";
type Collection = "newsPages_connection" | "projectsPages_connection" | "categories_connection";
type Node = { documentId?: string | null; updatedAt?: string | null } | null;
type Connection = {
  nodes?: Node[] | null;
  pageInfo?: { pageCount?: number | null } | null;
} | null;
type SitemapResponse = {
  data?: Partial<Record<Collection, Connection>>;
  errors?: Array<{ message: string }>;
};
type FetchCms = (url: string, options: {
  method: "POST";
  headers: { "Content-Type": string };
  body: { query: string; variables: { page: number; pageSize: number; locale: Locale } };
}) => Promise<SitemapResponse>;

const PAGE_SIZE = 100;
const collections: Record<Collection, string> = {
  newsPages_connection: "NewsSlug",
  projectsPages_connection: "ProjectSlug",
  categories_connection: "ProductSlug",
};
const staticPaths = ["/", "/About", "/ContactPage", "/Costs", "/Oneguarantee", "/Projects", "/News"];

const query = `
  query SitemapEntries($page: Int!, $pageSize: Int!, $locale: I18NLocaleCode) {
    newsPages_connection(locale: $locale, pagination: { page: $page, pageSize: $pageSize }) {
      nodes { documentId updatedAt }
      pageInfo { pageCount }
    }
    projectsPages_connection(locale: $locale, pagination: { page: $page, pageSize: $pageSize }) {
      nodes { documentId updatedAt }
      pageInfo { pageCount }
    }
    categories_connection(locale: $locale, pagination: { page: $page, pageSize: $pageSize }) {
      nodes { documentId updatedAt }
      pageInfo { pageCount }
    }
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

export async function buildSitemap(siteUrl: string, graphqlUrl: string, fetchCms: FetchCms): Promise<string> {
  const origin = siteOrigin(siteUrl);
  if (!graphqlUrl) throw new Error("A GraphQL URL is required for the sitemap");

  const pages = new Map<string, { locales: Set<Locale>; updatedAt: Partial<Record<Locale, string>> }>();
  for (const path of staticPaths) pages.set(path, { locales: new Set(["ru", "en"]), updatedAt: {} });

  for (const locale of ["ru", "en"] as const) {
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
          const path = `/${segment}/${encodeURIComponent(id)}`;
          const entry = pages.get(path) ?? { locales: new Set<Locale>(), updatedAt: {} as Partial<Record<Locale, string>> };
          entry.locales.add(locale);
          const updatedAt = dateOrEmpty(node?.updatedAt);
          if (updatedAt > (entry.updatedAt[locale] || "")) entry.updatedAt[locale] = updatedAt;
          pages.set(path, entry);
        }
      }
      page += 1;
    } while (page <= lastPage);
  }

  const absolute = (path: string, locale: Locale) => `${origin}${locale === "en" ? "/en" : ""}${path === "/" && locale === "en" ? "" : path}`;
  const entries: string[] = [];
  for (const [path, entry] of pages) {
    for (const locale of ["ru", "en"] as const) {
      if (!entry.locales.has(locale)) continue;
      const links = entry.locales.size === 2
        ? (["ru", "en"] as const).map((language) =>
          `<xhtml:link rel="alternate" hreflang="${language}" href="${xmlEscape(absolute(path, language))}"/>`
        ).concat(`<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(absolute(path, "ru"))}"/>`)
        : [];
      entries.push(`<url><loc>${xmlEscape(absolute(path, locale))}</loc>${entry.updatedAt[locale] ? `<lastmod>${entry.updatedAt[locale]}</lastmod>` : ""}${links.join("")}</url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join("")}</urlset>`;
}
