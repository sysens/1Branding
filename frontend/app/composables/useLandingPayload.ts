import { computed, ref, type ComputedRef, type Ref } from "vue";
import type {
  AppLocale,
  FooterSocialMediaLinks,
  LandingPageContent,
  LandingPayloadResponse,
  LandingSeo,
} from "~/types/landingPayload";

const LANDING_PAYLOAD_QUERY = `
  query LandingPayload($locale: I18NLocaleCode) {
    seo(locale: $locale) {
      landingPage {
        title
        description
      }
    }
    landingPage(locale: $locale) {
      heroSlogan {
        mutedText
        mainText
        accentText
      }
      slogan { alternativeText caption }
      sloganMobile { alternativeText caption }
      section2 {
        title
        description
      }
      section3 {
        partnersLogo { url }
      }
      brandCollage {
        row1 { url formats }
        row2 { url formats }
        row3 { url formats }
      }
      section5 {
        title
        subTitle
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
    footer(locale: $locale) {
      socialMedia {
        instagramLink
        behanceLink
        telegramLink
      }
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
      variables: { locale: gqlLocale },
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
    landingPage: computed(() => data.value?.data?.landingPage ?? null),
    seo: computed(() => data.value?.data?.seo?.landingPage ?? null),
    footerSocialMedia: computed(
      () => data.value?.data?.footer?.socialMedia ?? null
    ),
  };
};
