<script setup lang="ts">
import { computed } from "vue";
import FooterBrandSparkles from "~/components/FooterBrandSparkles.vue";
import FooterCopyBlock from "~/components/FooterCopyBlock.vue";
import FooterRobotScene from "~/components/FooterRobotScene.vue";

type AppLocale = "ru" | "en";

type SocialMediaLinks = {
  instagramLink?: string | null;
  behanceLink?: string | null;
  telegramLink?: string | null;
};

type FooterCopy = {
  headingLead: string;
  headingAccent: string;
  description: string;
  support: string;
  contactLabel: string;
};

type FooterLinks = {
  telegram: string;
  instagram: string;
  behance: string;
  contactTo: string;
};

type FooterDataRes = {
  data?: {
    footer?: {
      socialMedia?: SocialMediaLinks | null;
    } | null;
    fallbackFooter?: {
      socialMedia?: SocialMediaLinks | null;
    } | null;
    landingPage?: {
      splineRobot?: {
        sceneUrl?: string | null;
      } | null;
    } | null;
    fallbackLandingPage?: {
      splineRobot?: {
        sceneUrl?: string | null;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const DEFAULT_SCENE_URL =
  "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const localePath = useLocalePath();
const { locale } = useI18n();

const gqlLocale = computed<AppLocale>(() =>
  String(locale.value) === "en" ? "en" : "ru"
);

const fallbackLocale: AppLocale = "en";

const FOOTER_QUERY = `
  query FooterData($locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    footer(locale: $locale) {
      socialMedia {
        instagramLink
        behanceLink
        telegramLink
      }
    }
    fallbackFooter: footer(locale: $fallbackLocale) {
      socialMedia {
        instagramLink
        behanceLink
        telegramLink
      }
    }
    landingPage(locale: $locale) {
      splineRobot {
        sceneUrl
      }
    }
    fallbackLandingPage: landingPage(locale: $fallbackLocale) {
      splineRobot {
        sceneUrl
      }
    }
  }
`;

const { data: footerGql } = await useAsyncData<FooterDataRes>(
  () => `footer-data-${gqlLocale.value}`,
  async () => {
    if (!GRAPHQL_URL) return {};

    return await $fetch<FooterDataRes>(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        query: FOOTER_QUERY,
        variables: { locale: gqlLocale.value, fallbackLocale },
      },
    });
  },
  { watch: [gqlLocale] }
);

const socialMedia = computed<SocialMediaLinks | null>(
  () =>
    footerGql.value?.data?.footer?.socialMedia ??
    footerGql.value?.data?.fallbackFooter?.socialMedia ??
    null
);

const sceneUrl = computed(
  () =>
    footerGql.value?.data?.landingPage?.splineRobot?.sceneUrl?.trim() ||
    footerGql.value?.data?.fallbackLandingPage?.splineRobot?.sceneUrl?.trim() ||
    DEFAULT_SCENE_URL
);

const instagramLink = computed(
  () => socialMedia.value?.instagramLink || "https://www.instagram.com/"
);

const behanceLink = computed(
  () => socialMedia.value?.behanceLink || "https://www.behance.net"
);

const telegramLink = computed(
  () => socialMedia.value?.telegramLink || "https://web.telegram.org"
);

const footerCopy = computed<FooterCopy>(() =>
  gqlLocale.value === "ru"
    ? {
        headingLead: "Сильный бренд не создается",
        headingAccent: "случайно.",
        description:
          "Он строится через понятную систему, точную стратегию и сильные дизайн-решения.",
        support:
          "Onebranding помогает бизнесу стать узнаваемее, понятнее и ближе к выбору клиента.",
        contactLabel: "contact",
      }
    : {
        headingLead: "A strong brand is not created by",
        headingAccent: "chance.",
        description:
          "It is built through a smart system, clear strategy, and powerful design decisions.",
        support:
          "Onebranding helps your business become easier to recognize, trust, and choose.",
        contactLabel: "contact",
      }
);

const footerLinks = computed<FooterLinks>(() => ({
  telegram: telegramLink.value,
  instagram: instagramLink.value,
  behance: behanceLink.value,
  contactTo: localePath("/ContactPage"),
}));

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <FooterBrandSparkles />
      </div>

      <div class="site-footer__body">
        <FooterCopyBlock :copy="footerCopy" :links="footerLinks" />

        <div class="site-footer__visual">
          <FooterRobotScene :scene="sceneUrl" />
        </div>
      </div>

      <p class="site-footer__copyright">
        @ {{ currentYear }} OneBranding. All rights reserved.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  z-index: 2;
  overflow: hidden;
  background: #000000;
  color: #ffffff;
}

.site-footer__inner {
  position: relative;
  width: min(100%, 1728px);
  min-height: clamp(42rem, 64vw, 58rem);
  margin-inline: auto;
  padding: clamp(3rem, 6vw, 6rem) clamp(1.25rem, 7vw, 8rem) 1.6rem;
}

.site-footer__brand {
  position: relative;
  z-index: 3;
  display: grid;
  justify-items: center;
  margin-bottom: clamp(1rem, 2vw, 2rem);
  text-align: center;
}

.site-footer__body {
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: minmax(21rem, 0.88fr) minmax(26rem, 1.12fr);
  align-items: end;
  gap: clamp(2rem, 4vw, 5rem);
  margin-top: clamp(1rem, 3vw, 2.5rem);
}

.site-footer__visual {
  position: relative;
  min-width: 0;
  margin-bottom: -1.6rem;
}

.site-footer__copyright {
  position: relative;
  z-index: 6;
  margin: clamp(-1rem, -2vw, 0rem) 0 0;
  color: #ffffff;
  font-size: clamp(0.78rem, 0.9vw, 0.95rem);
  font-weight: 700;
}

@media (max-width: 900px) {
  .site-footer__inner {
    min-height: auto;
    padding-inline: 1.25rem;
  }

  .site-footer__body {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .site-footer__visual {
    margin-bottom: 0;
  }

  .site-footer__copyright {
    margin-top: 0;
    text-align: center;
  }
}
</style>
