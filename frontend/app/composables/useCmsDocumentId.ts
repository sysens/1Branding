import { computed, type Ref } from "vue";

// Strapi document IDs: 24 lower-case letters and digits (no hyphen, unlike a slug).
const DOCUMENT_ID = /^[a-z0-9]{24}$/;
export const isDocumentId = (value: string) => DOCUMENT_ID.test(value);

type Collection = "newsPages" | "projectsPages";

/**
 * The documentId behind a page's address: /news/<slug> and /projects/<slug>,
 * or the documentId itself on old links (the page then answers with a 301 to
 * the slug). The slug is shared by every language and every entry has an
 * English version, so it is looked up there. "" when nothing has that slug.
 *
 * When the CMS does not answer (down, timed out, or an error instead of data)
 * the page answers 503, a temporary failure: a 404 would tell search engines
 * that every case study and article is gone.
 */
export const useCmsDocumentId = async (collection: Collection, key: Ref<string>) => {
  const graphqlUrl = useGraphqlUrl();
  const { data, error } = await useAsyncData(
    () => `cms-slug-${collection}-${key.value}`,
    async () => {
      if (!key.value || isDocumentId(key.value) || !graphqlUrl) return key.value;
      const response = await cmsRequest<Record<string, { nodes?: Array<{ documentId?: string | null } | null> | null } | null>>(
        graphqlUrl,
        `query CmsSlug($slug: String!) { ${collection}_connection(locale: "en", filters: { slug: { eq: $slug } }, pagination: { limit: 1 }) { nodes { documentId } } }`,
        { slug: key.value },
      );
      // The connection is there, with no nodes, when nothing has the slug.
      const connection = response?.data?.[`${collection}_connection`];
      if (!connection) throw new Error(response?.errors?.[0]?.message || "CMS slug lookup failed");
      return connection.nodes?.[0]?.documentId ?? "";
    },
  );
  if (error.value) {
    throw createError({ statusCode: 503, statusMessage: "Content is temporarily unavailable" });
  }
  return computed(() => data.value ?? "");
};
