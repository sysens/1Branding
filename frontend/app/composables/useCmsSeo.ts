import { computed } from "vue";
import { cmsSeoText } from "~/utils/seo";

export type CmsSeoPage = "landingPage" | "aboutPage" | "pricePage" | "oneGuaranteePage" | "contactsPage";

type SeoEntry = { title?: string | null; description?: string | null } | null;
type SeoResponse = { data?: { seo?: Partial<Record<CmsSeoPage, SeoEntry>> | null } };

const SEO_QUERY = `
  query Seo($locale: I18NLocaleCode) {
    seo(locale: $locale) {
      landingPage { title description }
      aboutPage { title description }
      pricePage { title description }
      oneGuaranteePage { title description }
      contactsPage { title description }
    }
  }
`;

/**
 * Editor-managed title/description for a static page in the current locale.
 * The SEO single type is localized, so it must be queried per locale; one
 * request per locale is shared by every page. Placeholder text is dropped so
 * the caller's i18n copy is used instead.
 */
export const useCmsSeo = async (page: CmsSeoPage) => {
  const graphqlUrl = String(useRuntimeConfig().public.graphqlUrl || "");
  const { locale } = useI18n();
  const gqlLocale = computed(() => (locale.value === "en" ? "en" : "ru"));

  const { data } = await useAsyncData<SeoResponse | null>(
    () => `cms-seo-${gqlLocale.value}`,
    () => graphqlUrl
      ? $fetch<SeoResponse>(graphqlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { query: SEO_QUERY, variables: { locale: gqlLocale.value } },
      }).catch(() => null)
      : Promise.resolve(null),
    { watch: [gqlLocale] },
  );

  const entry = computed(() => data.value?.data?.seo?.[page] ?? null);
  return {
    title: computed(() => cmsSeoText(entry.value?.title, 15)),
    description: computed(() => cmsSeoText(entry.value?.description, 50)),
  };
};
