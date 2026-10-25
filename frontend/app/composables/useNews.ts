/**
 * News entries for the list (/News) and the "more news" slider: one query, one
 * request helper and one date format for both.
 */
export type NewsNode = {
  documentId: string;
  slug?: string | null;
  title?: string | null;
  text?: string | null;
  createdAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  image?: { url?: string | null } | null;
};

export type NewsPageInfo = {
  page?: number | null;
  pageSize?: number | null;
  pageCount?: number | null;
  total?: number | null;
} | null;

export type NewsPage = { nodes: NewsNode[]; pageInfo: NewsPageInfo };

const QUERY = `
  query NewsPagesConnection($page: Int!, $pageSize: Int!, $locale: I18NLocaleCode) {
    newsPages_connection(locale: $locale, pagination: { page: $page, pageSize: $pageSize }) {
      nodes { documentId slug title text createdAt publishedAt updatedAt image { url } }
      pageInfo { page pageSize pageCount total }
    }
  }
`;

type NewsResponse = {
  newsPages_connection?: { nodes?: NewsNode[] | null; pageInfo?: NewsPageInfo } | null;
};

/** Call in setup; the returned function can then run at any time (e.g. "show more"). */
export const useNewsPages = () => {
  const graphqlUrl = useGraphqlUrl();
  return async (page: number, pageSize: number, locale: CmsLocale): Promise<NewsPage> => {
    if (!graphqlUrl) return { nodes: [], pageInfo: null };
    const response = await cmsRequest<NewsResponse>(graphqlUrl, QUERY, { page, pageSize, locale });
    return {
      nodes: response?.data?.newsPages_connection?.nodes ?? [],
      pageInfo: response?.data?.newsPages_connection?.pageInfo ?? null,
    };
  };
};

/** The date a news entry is shown with. */
export const newsDate = (node: NewsNode): string => node.createdAt || node.publishedAt || node.updatedAt || "";

/** dd.mm.yyyy in UTC, so the server and the browser print the same day. */
export const formatNewsDate = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getUTCFullYear()}`;
};
