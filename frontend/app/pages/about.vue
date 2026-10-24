<script setup lang="ts">
import { computed } from "vue";
import BigPhoto from "~/components/about/BigPhoto.vue";
import ThreePic from "~/components/about/ThreePic.vue";
import TwoFlex from "~/components/about/TwoFlex.vue";
import ThreeLayer from "~/components/home/ThreeLayerSlug.vue";
import { toSiteLocale } from "~/utils/locales";
import { servicePath, servicesHubPath } from "~/utils/servicePages";

const { t, locale } = useI18n();
const siteLocale = computed(() => toSiteLocale(locale.value));
// What OneBranding is, in plain words, with the way to its main services.
const serviceLinks = computed(() => (["branding", "logo", "identity", "packaging", "web"] as const).map((key) => ({
  key,
  name: t(`servicePages.${key}.name`),
  path: servicePath(key, siteLocale.value),
})));

const cmsSeo = await useCmsSeo("aboutPage");
const localePath = useLocalePath();
usePageSeo({
  title: computed(() => cmsSeo.title.value || t("seo.about.title")),
  description: computed(() => cmsSeo.description.value || t("seo.about.description")),
  breadcrumbs: computed(() => [{ name: t("nav.about"), path: localePath("/about") }]),
});
</script>

<template>
  <div
    class="relative min-h-screen overflow-x-hidden overscroll-y-none bg-black"
  >
    <div class="edge-gradient edge-gradient-left edge-gradient-soft" />
    <div class="edge-gradient edge-gradient-right edge-gradient-soft" />

    <div>
      <div
        class="vg relative z-10 bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat pt-[30px] md:pt-[60px]"
      >

        <h1
          class="products intro-slide-in type-h1 px-4 pt-[137px] pb-[30px] text-center text-[#FFFFFF] md:pt-[127px] md:pb-[60px]"
        >
          {{ $t("aboutPage.title") }}
        </h1>
        <div class="about-lead">
          <p>{{ $t("aboutPage.lead") }}</p>
          <nav :aria-label="$t('aboutPage.servicesTitle')">
            <NuxtLink v-for="link in serviceLinks" :key="link.key" :to="link.path">{{ link.name }}</NuxtLink>
            <NuxtLink :to="servicesHubPath(siteLocale)" class="about-lead__all">{{ $t("servicesPage.allServices") }}</NuxtLink>
          </nav>
        </div>
      </div>
    </div>

    <div>
      <div class="relative top-10">
        <BigPhoto />
      </div>

      <div class="relative bottom-7">
        <TwoFlex />
      </div>

      <ThreePic />
    </div>

    <!-- The landing's "Fresh projects" heading: the same step (h1) as there. -->
    <h2
      class="type-h2 type-caps px-4 pt-[100px] pb-[30px] text-center text-white md:pt-[130px] md:pb-20"
    >
      {{ $t("home.freshProjects") }}
    </h2>

    <ThreeLayer />

  </div>
</template>

<style scoped>
.about-lead {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px 56px;
  text-align: center;
}

/* Three lines and more (180+ characters): left-aligned at a reading measure,
   the block itself centred under the title. */
.about-lead p {
  max-width: var(--type-measure);
  margin: 0 auto;
  color: #b9bcc0;
  font-family: var(--app-font-sans);
  font-size: var(--type-lead-size);
  line-height: var(--type-lead-lh);
  letter-spacing: var(--type-lead-ls);
  text-align: left;
}

.about-lead nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 12px;
  margin-top: 24px;
}

.about-lead a {
  padding: 8px 16px;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 999px;
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  line-height: var(--type-small-lh);
  letter-spacing: var(--type-small-ls);
  text-decoration: none;
  transition: border-color 0.25s ease, color 0.25s ease;
}

.about-lead a:hover,
.about-lead a:focus-visible {
  border-color: #03cb00;
  color: #03cb00;
}

.about-lead a.about-lead__all {
  border-color: rgb(3 203 0 / 0.6);
}
</style>
