import { computed, ref, type ComputedRef, type Ref } from "vue";
import { resolveStrapiMediaUrl, trimTrailingSlash } from "~/utils/strapiMedia";

type Media = {
  url?: string | null;
};

type BrandCollage = {
  row1?: Media[] | null;
  row2?: Media[] | null;
  row3?: Media[] | null;
};

type LandingBrandCollageResponse = {
  data?: {
    landingPage?: {
      brandCollage?: BrandCollage | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

type UseBrandCollageRowsResult = {
  rowSets: ComputedRef<string[][]>;
  staticMediaBaseUrl: ComputedRef<string>;
};

const brandCollageQuery = `
  query LandingBrandCollage($locale: I18NLocaleCode) {
    landingPage(locale: $locale) {
      brandCollage {
        row1 { url }
        row2 { url }
        row3 { url }
      }
    }
  }
`;

const mapMediaRow = (row: Media[] | null | undefined, graphqlUrl: string): string[] =>
  (row ?? [])
    .map((media) => resolveStrapiMediaUrl(media.url ?? null, graphqlUrl))
    .filter((url): url is string => Boolean(url));

export const useBrandCollageRows = async (): Promise<UseBrandCollageRowsResult> => {
  const runtimeConfig = useRuntimeConfig();
  const graphqlUrl = String(runtimeConfig.public.graphqlUrl || "");
  const { locale } = useI18n();
  const gqlLocale = computed(() => (locale.value === "en" ? "en" : "ru"));
  const emptyData: Ref<LandingBrandCollageResponse | null> = ref(null);

  const { data } = graphqlUrl
    ? await useFetch<LandingBrandCollageResponse>(graphqlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: computed(() => ({
          query: brandCollageQuery,
          variables: { locale: gqlLocale.value },
        })),
        key: "landing-brand-collage",
        watch: [gqlLocale],
      })
    : { data: emptyData };

  const rowSets = computed(() => {
    const brandCollage = data.value?.data?.landingPage?.brandCollage;

    if (!brandCollage) {
      return [];
    }

    return [
      mapMediaRow(brandCollage.row1, graphqlUrl),
      mapMediaRow(brandCollage.row2, graphqlUrl),
      mapMediaRow(brandCollage.row3, graphqlUrl),
    ];
  });

  const staticMediaBaseUrl = computed(() =>
    trimTrailingSlash(String(runtimeConfig.public.staticMediaBaseUrl || ""))
  );

  return {
    rowSets,
    staticMediaBaseUrl,
  };
};
