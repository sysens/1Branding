import { computed, ref, type ComputedRef, type Ref } from "vue";
import type {
  AppLocale,
  FooterSocialMediaLinks,
  LandingPageContent,
  LandingPayloadResponse,
  LandingSeo,
} from "~/types/landingPayload";

const LANDING_PAYLOAD_QUERY = `
  query LandingPayload($locale: I18NLocaleCode, $withFallback: Boolean!) {
    seo(locale: $locale) {
      landingPage {
        title
        description
      }
    }
    landingPage(locale: $locale) {
      ...LandingPageFields
    }
    footer(locale: $locale) {
      socialMedia {
        instagramLink
        behanceLink
        telegramLink
      }
    }
    # The CMS has no Russian entry yet: fall back to English so the landing is not empty.
    # Not requested for English itself, so this (inlined) payload is not sent twice.
    fallbackLandingPage: landingPage(locale: "en") @include(if: $withFallback) {
      ...LandingPageFields
    }
    fallbackFooter: footer(locale: "en") @include(if: $withFallback) {
      socialMedia {
        instagramLink
        behanceLink
        telegramLink
      }
    }
  }

  fragment LandingPageFields on LandingPage {
    heroSlogan {
      mutedText
      mainText
      accentText
    }
    slogan { alternativeText caption }
    sloganMobile { alternativeText caption }
    section3 {
      partnersLogo { url }
    }
    brandCollage {
      row1 { url formats }
      row2 { url formats }
      row3 { url formats }
    }
    section10 {
      title
      description
      image { url }
    }
    splineRobot {
      title
      description
      sceneUrl
    }
  }
`;

type LandingPayloadResult = {
  landingPage: ComputedRef<LandingPageContent | null>;
  seo: ComputedRef<LandingSeo | null>;
  footerSocialMedia: ComputedRef<FooterSocialMediaLinks | null>;
};

// Strapi GraphQL sekin javob beradi; bir xil so'rov 60 sekund davomida
// xotiradan o'qiladi (SSR + client), TTFB barqaror bo'ladi
const LANDING_PAYLOAD_TTL_MS = 60_000;
const payloadCache = new Map<string, { expiresAt: number; payload: Promise<LandingPayloadResponse> }>();

const fetchLandingPayloadCached = (graphqlUrl: string, gqlLocale: AppLocale) => {
  const key = `${graphqlUrl}::${gqlLocale}`;
  const now = Date.now();
  const cached = payloadCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  const payload = $fetch<LandingPayloadResponse>(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      query: LANDING_PAYLOAD_QUERY,
      variables: { locale: gqlLocale, withFallback: gqlLocale !== "en" },
    },
  });

  payload.catch(() => payloadCache.delete(key));

  payloadCache.set(key, { expiresAt: now + LANDING_PAYLOAD_TTL_MS, payload });
  return payload;
};

export const useLandingPayload = async (): Promise<LandingPayloadResult> => {
  const runtimeConfig = useRuntimeConfig();
  const graphqlUrl = String(runtimeConfig.public.graphqlUrl || "");
  const { locale } = useI18n();
  const gqlLocale = computed<AppLocale>(() =>
    locale.value === "en" ? "en" : "ru"
  );
  const emptyData: Ref<LandingPayloadResponse | null> = ref(null);

  const { data } = graphqlUrl
    ? await useAsyncData<LandingPayloadResponse>(
        () => `landing-payload-${gqlLocale.value}`,
        () => fetchLandingPayloadCached(graphqlUrl, gqlLocale.value)
      )
    : { data: emptyData };

  return {
    landingPage: computed(() => {
      const own = data.value?.data?.landingPage;
      if (own) return own;
      const fallback = data.value?.data?.fallbackLandingPage;
      // section10's heading and text have i18n copy (BrandGallery), which reads
      // better on a page in another language than the English CMS text.
      return fallback ? { ...fallback, section10: null } : null;
    }),
    // No English fallback: the page's own i18n title/description fill an empty SEO entry.
    seo: computed(() => data.value?.data?.seo?.landingPage ?? null),
    footerSocialMedia: computed(
      () =>
        data.value?.data?.footer?.socialMedia ??
        data.value?.data?.fallbackFooter?.socialMedia ??
        null
    ),
  };
};
