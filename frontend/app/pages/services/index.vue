<script setup lang="ts">
import { computed } from "vue";
import OptImage from "~/components/ui/OptImage.vue";
import { toSiteLocale } from "~/utils/locales";
import { SERVICE_PAGES, servicePath, servicesHubPath } from "~/utils/servicePages";

// /services: every service with its own page, the hub the header, footer and
// service pages link back to.

const { t, locale } = useI18n();
const localePath = useLocalePath();
const origin = useSiteOrigin();
const siteLocale = computed(() => toSiteLocale(locale.value));

const services = computed(() => SERVICE_PAGES.map((page) => ({
  key: page.key,
  name: t(`servicePages.${page.key}.name`),
  summary: t(`servicePages.${page.key}.summary`),
  image: page.image,
  path: servicePath(page.key, siteLocale.value),
})));

// The title's face (Display Semibold) is fetched with the HTML: the hero is
// visible from the first paint, and swapping the title in late moved the
// picture and the buttons under it (a layout shift).
useServerHead({
  link: [{ rel: "preload", as: "font", type: "font/woff2", href: "/fonts/v2/SF-Pro-Display-Semibold.woff2", crossorigin: "" }],
});

usePageSeo({
  title: computed(() => t("servicesHub.title")),
  description: computed(() => t("servicesHub.description")),
  breadcrumbs: computed(() => [{ name: t("servicesPage.breadcrumb"), path: servicesHubPath(siteLocale.value) }]),
  structuredData: computed(() => ({
    "@type": "ItemList",
    name: t("servicesHub.h1"),
    itemListElement: services.value.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: service.name,
      url: `${origin}${service.path}`,
    })),
  })),
});
</script>

<template>
  <div class="service-page">
    <div class="edge-gradient edge-gradient-left edge-gradient-soft" />
    <div class="edge-gradient edge-gradient-right edge-gradient-soft" />

    <div class="service-page__frame">
      <nav class="service-crumbs" :aria-label="t('servicesPage.breadcrumbLabel')">
        <ol>
          <li><NuxtLink :to="localePath('/')">{{ t("nav.home") }}</NuxtLink></li>
          <li aria-current="page">{{ t("servicesPage.breadcrumb") }}</li>
        </ol>
      </nav>

      <section class="service-hub__intro" aria-labelledby="services-hub-title">
        <p class="service-eyebrow service-hero__intro">{{ t("servicesHub.eyebrow") }}</p>
        <h1 id="services-hub-title" class="service-hero__title service-hero__intro" style="--intro-step: 1">{{ t("servicesHub.h1") }}</h1>
        <p class="service-hero__lead service-hero__intro" style="--intro-step: 2">{{ t("servicesHub.lead") }}</p>
      </section>

      <section class="service-section" aria-labelledby="services-hub-list">
        <h2 id="services-hub-list" class="sr-only">{{ t("servicesHub.listTitle") }}</h2>
        <ul class="service-hub__grid" data-reveal-row>
          <!-- The first row is on screen as the page opens: it comes in with the
               hero (CSS), not on the app's reveal, which kept the first
               picture (the page's largest paint) hidden for seconds. -->
          <li
            v-for="(service, index) in services"
            :key="service.key"
            v-rise="index < 3 ? false : undefined"
            :class="{ 'service-hero__intro': index < 3 }"
            :style="index < 3 ? { '--intro-step': 3 + index } : undefined"
          >
            <NuxtLink :to="service.path" class="service-card">
              <OptImage
                :src="service.image"
                alt=""
                sizes="(min-width: 1320px) 420px, (min-width: 900px) 31vw, 92vw"
                width="800"
                height="600"
                :loading="index === 0 ? 'eager' : 'lazy'"
                :fetchpriority="index === 0 ? 'high' : undefined"
                decoding="async"
              />
              <span class="service-card__name">{{ service.name }}</span>
              <span class="service-card__summary">{{ service.summary }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section class="service-cta" aria-labelledby="services-hub-cta">
        <h2 id="services-hub-cta" v-blur-reveal>{{ t("servicesHub.ctaTitle") }}</h2>
        <p v-rise>{{ t("servicesHub.ctaText") }}</p>
        <NuxtLink v-rise :to="`${localePath('/contact')}#contact-request`" class="ob-button">{{ t("servicesHub.ctaButton") }}</NuxtLink>
      </section>
    </div>
  </div>
</template>

<style src="~/assets/css/service-page.css"></style>
