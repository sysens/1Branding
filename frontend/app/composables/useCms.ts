import { resolveStrapiMediaUrl } from "~/utils/strapiMedia";

/**
 * Shared access to the Strapi GraphQL API. Every page and component goes
 * through these helpers instead of building its own `$fetch` call.
 *
 * Server renders reach the backend over Railway's private network (see
 * server/plugins/internal-graphql.ts); the code always uses the public URL.
 */

export type CmsLocale = "en" | "ru";

export type CmsResponse<T> = {
  data?: T | null;
  errors?: Array<{ message: string }>;
};

/** The CMS locale of the current page: "ru" under /ru, otherwise "en". */
export const useCmsLocale = () => {
  const { locale } = useI18n();
  return computed<CmsLocale>(() => (locale.value === "ru" ? "ru" : "en"));
};

/** The public GraphQL endpoint ("" when it is not configured). */
export const useGraphqlUrl = (): string => String(useRuntimeConfig().public.graphqlUrl || "");

/** Absolute URL for a media path the CMS returns (R2 URLs pass through). */
export const useCmsMedia = () => {
  const graphqlUrl = useGraphqlUrl();
  return (url?: string | null): string => resolveStrapiMediaUrl(url, graphqlUrl);
};

type JsonPost = <R>(url: string, options: { method: "POST"; headers: Record<string, string>; body: unknown }) => Promise<R>;

/** One GraphQL request. HTTP failures throw; GraphQL errors come back in `errors`. */
export const cmsRequest = <T>(graphqlUrl: string, query: string, variables: Record<string, unknown>) =>
  // $fetch typed against a runtime URL makes TypeScript expand every Nitro route.
  ($fetch as unknown as JsonPost)<CmsResponse<T>>(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { query, variables },
  });

/**
 * The variables every query may use: `$locale`, `$fallbackLocale` ("en") and
 * `$withFallback` (true off English) for `@include(if: $withFallback)` on an
 * English copy that fills what the Russian entry lacks. GraphQL ignores the
 * ones a query does not declare.
 */
export const cmsVariables = (locale: CmsLocale, extra: Record<string, unknown> = {}) => ({
  locale,
  fallbackLocale: "en",
  withFallback: locale !== "en",
  ...extra,
});

type CmsQueryOptions = {
  /** Extra variables; read inside the fetch, so reactive values are current. */
  variables?: () => Record<string, unknown>;
  /** false: fetch in the browser only (content that need not be in the HTML). */
  server?: boolean;
};

/**
 * A CMS query as page data: rendered on the server, reused by the browser and
 * refetched when the language or anything else in the key changes. Several
 * components asking with the same key share one request.
 */
export const useCmsQuery = <T>(
  key: string | (() => string),
  query: string,
  options: CmsQueryOptions = {}
) => {
  const locale = useCmsLocale();
  const graphqlUrl = useGraphqlUrl();
  return useAsyncData<CmsResponse<T> | null>(
    () => `cms:${typeof key === "function" ? key() : key}:${locale.value}`,
    async () => {
      if (!graphqlUrl) return null;
      return cmsRequest<T>(graphqlUrl, query, cmsVariables(locale.value, options.variables?.()));
    },
    { server: options.server ?? true }
  );
};

/**
 * CMS text that is real copy: trimmed, and empty for placeholders left in the
 * CMS ("Lorem ipsum…", "ButtonEn"), so the page's own i18n copy shows instead.
 */
export const cmsText = (value?: string | null): string => {
  const text = (value ?? "").trim();
  return /lorem ipsum|^button\s?en$/i.test(text) ? "" : text;
};
