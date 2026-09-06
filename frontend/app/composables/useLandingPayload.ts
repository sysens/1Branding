import { computed, ref, type ComputedRef, type Ref } from "vue";
import type {
  AppLocale,
  FooterSocialMediaLinks,
  LandingPageContent,
  LandingPayloadResponse,
  LandingSeo,
  OneGuaranteeSection4,
} from "~/types/landingPayload";

const LANDING_PAYLOAD_QUERY = `
  query LandingPayload($locale: I18NLocaleCode) {
    seo {
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
      section7 {
        title
        images { url createdAt }
      }
      section10 {
        title
        description
        image { url }
      }
      section11 {
        title
        AnswerQuestions { question answer }
      }
      splineRobot {
        title
        description
        sceneUrl
      }
    }
    oneGuarantee(locale: $locale) {
      section4 {
        title
        cards {
          title
          description
          icon { url }
        }
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
  oneGuaranteeSection4: ComputedRef<OneGuaranteeSection4 | null>;
  seo: ComputedRef<LandingSeo | null>;
  footerSocialMedia: ComputedRef<FooterSocialMediaLinks | null>;
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
        async () =>
          await $fetch<LandingPayloadResponse>(graphqlUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: {
              query: LANDING_PAYLOAD_QUERY,
              variables: { locale: gqlLocale.value },
            },
          })
      )
    : { data: emptyData };

  return {
    landingPage: computed(() => data.value?.data?.landingPage ?? null),
    oneGuaranteeSection4: computed(
      () => data.value?.data?.oneGuarantee?.section4 ?? null
    ),
    seo: computed(() => data.value?.data?.seo?.landingPage ?? null),
    footerSocialMedia: computed(
      () => data.value?.data?.footer?.socialMedia ?? null
    ),
  };
};
