import { computed, type ComputedRef } from "vue";
import type {
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

// The whole page is cached by the server (see pageCache in nuxt.config.ts),
// so this query runs once per render and needs no cache of its own.
export const useLandingPayload = async (): Promise<LandingPayloadResult> => {
  const { data } = await useCmsQuery<NonNullable<LandingPayloadResponse["data"]>>("landing-payload", LANDING_PAYLOAD_QUERY);

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
