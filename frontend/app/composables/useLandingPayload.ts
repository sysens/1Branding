import { computed, type ComputedRef } from "vue";
import type { LandingPageContent, LandingPayloadResponse } from "~/types/landingPayload";
import type { CmsSeo } from "~/utils/seo";

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
    # The CMS has no Russian entry yet: fall back to English so the landing is not empty.
    # Not requested for English itself, so this (inlined) payload is not sent twice.
    fallbackLandingPage: landingPage(locale: "en") @include(if: $withFallback) {
      ...LandingPageFields
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
      # GraphQL lists stop at defaultLimit (25) unless asked for more.
      partnersLogo(pagination: { limit: 100 }) { url alternativeText name width height }
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
  seo: ComputedRef<CmsSeo | null>;
};

// The whole page is cached by the server (see pageCache in nuxt.config.ts),
// so this query runs once per render and needs no cache of its own. The
// footer's social links come from the footer itself (useFooterSocials).
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
  };
};
