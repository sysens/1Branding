<script setup lang="ts">
import { computed } from "vue";
import OptImage from "~/components/ui/OptImage.vue";
import { COMPANY } from "~/utils/company";
import { SITE_LOCALES, toSiteLocale } from "~/utils/locales";
import { loadServiceCopy } from "~/utils/serviceCopy";
import { serviceBySlug, servicePath, servicesHubPath, serviceByKey } from "~/utils/servicePages";

// One service's page (/services/<slug>, its slug in each language): what it
// is and costs, what it includes, how the work goes, questions, related
// services and a way to start. The copy is in app/content/services; prices
// come live from the CMS price list shown on /pricing.

const route = useRoute();
const { t, locale } = useI18n();
const localePath = useLocalePath();
const origin = useSiteOrigin();
const siteLocale = computed(() => toSiteLocale(locale.value));

definePageMeta({ key: (route) => route.fullPath });

const slug = String(route.params.slug || "").toLowerCase();
const service = serviceBySlug(slug);
if (!service) {
  throw createError({ statusCode: 404, statusMessage: "Service not found" });
}
// Another language's slug (a link followed inside the app; the server
// middleware redirects direct requests the same way).
if (service.slugs[siteLocale.value] !== slug) {
  await navigateTo(servicePath(service.key, siteLocale.value), { redirectCode: 301, replace: true });
}

const { data: copy } = await useAsyncData(
  `service-copy:${service.key}:${siteLocale.value}`,
  () => loadServiceCopy(service.key, siteLocale.value),
);
if (!copy.value) {
  throw createError({ statusCode: 404, statusMessage: "Service not found" });
}

// The language switcher and hreflang use each language's own slug.
const setI18nParams = useSetI18nParams();
setI18nParams(Object.fromEntries(SITE_LOCALES.map((code) => [code, { slug: service.slugs[code] }])));

type PriceListCategory = { title?: string | null; pricing?: Array<{ title?: string | null; price?: string | null } | null> | null };
const { data: prices } = await useCmsQuery<{ priceCategories?: PriceListCategory[] | null }>(
  "service-prices",
  `query ServicePrices { priceCategories(locale: "en") { title pricing { title price } } }`,
);

const formatPrice = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const plans = computed(() => {
  if (!service.priceCategory) return [];
  const category = prices.value?.data?.priceCategories?.find(
    (item) => item?.title?.trim().toLowerCase() === service.priceCategory!.toLowerCase(),
  );
  return (category?.pricing ?? [])
    .map((plan) => ({ name: plan?.title?.trim() || "", amount: Number.parseFloat(String(plan?.price || "").replace(/[^0-9.]/g, "")) }))
    .filter((plan) => plan.name && Number.isFinite(plan.amount) && plan.amount > 0)
    .sort((a, b) => a.amount - b.amount)
    .map((plan) => ({ ...plan, price: formatPrice(plan.amount) }));
});

// "from {price}" / "{price} per slide" split into the words (small, grey)
// and the price itself, in the order of the page's language.
const priceParts = (price: string) => {
  const marker = "%PRICE%";
  const template = t(service.priceUnit === "slide" ? "servicesPage.pricePerSlide" : "servicesPage.priceFrom", { price: marker });
  const [before = "", after = ""] = template.split(marker);
  return [
    ...(before.trim() ? [{ text: before.trim(), word: true }, { text: " ", word: false }] : []),
    { text: price, word: false },
    ...(after.trim() ? [{ text: " ", word: false }, { text: after.trim(), word: true }] : []),
  ];
};

const pagePath = computed(() => servicePath(service.key, siteLocale.value));
const name = computed(() => t(`servicePages.${service.key}.name`));
const parent = computed(() => (service.parent ? {
  name: t(`servicePages.${service.parent}.name`),
  path: servicePath(service.parent, siteLocale.value),
} : null));
const related = computed(() => service.related.map((key) => ({
  key,
  name: t(`servicePages.${key}.name`),
  summary: t(`servicePages.${key}.summary`),
  image: serviceByKey(key).image,
  path: servicePath(key, siteLocale.value),
})));

usePageSeo({
  title: computed(() => copy.value!.title),
  description: computed(() => copy.value!.description),
  image: service.image,
  imageAlt: computed(() => copy.value!.h1),
  breadcrumbs: computed(() => [
    { name: t("servicesPage.breadcrumb"), path: servicesHubPath(siteLocale.value) },
    ...(parent.value ? [parent.value] : []),
    { name: name.value, path: pagePath.value },
  ]),
  structuredData: computed(() => ({
    "@type": "Service",
    "@id": `${origin}${pagePath.value}#service`,
    name: name.value,
    serviceType: name.value,
    description: copy.value!.description,
    url: `${origin}${pagePath.value}`,
    image: `${origin}${service.image}`,
    provider: { "@id": `${origin}/#organization` },
    areaServed: [{ "@type": "City", name: "Tashkent" }, { "@type": "Country", name: "Uzbekistan" }],
    ...(parent.value ? { isRelatedTo: { "@type": "Service", name: parent.value.name, url: `${origin}${parent.value.path}` } } : {}),
    ...(plans.value.length ? {
      offers: plans.value.map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        price: String(plan.amount),
        priceCurrency: "USD",
        // Presentations are priced per slide.
        ...(service.priceUnit === "slide" ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: String(plan.amount),
            priceCurrency: "USD",
            referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitText: "slide" },
          },
        } : {}),
        url: `${origin}${localePath("/pricing")}`,
        seller: { "@id": `${origin}/#organization` },
      })),
    } : {}),
  })),
});
</script>

<template>
  <div class="service-page">
    <div class="edge-gradient edge-gradient-left edge-gradient-soft" />
    <div class="edge-gradient edge-gradient-right edge-gradient-soft" />

    <div v-if="copy" class="service-page__frame">
      <nav class="service-crumbs" :aria-label="t('servicesPage.breadcrumbLabel')">
        <ol>
          <li><NuxtLink :to="localePath('/')">{{ t("nav.home") }}</NuxtLink></li>
          <li><NuxtLink :to="servicesHubPath(siteLocale)">{{ t("servicesPage.breadcrumb") }}</NuxtLink></li>
          <li v-if="parent"><NuxtLink :to="parent.path">{{ parent.name }}</NuxtLink></li>
          <li aria-current="page">{{ name }}</li>
        </ol>
      </nav>

      <section class="service-hero" aria-labelledby="service-title">
        <div class="service-hero__text">
          <p v-rise class="service-eyebrow">{{ t("servicesPage.eyebrow") }}</p>
          <h1 id="service-title" v-blur-reveal class="service-hero__title">{{ copy.h1 }}</h1>
          <p v-rise class="service-hero__lead">{{ copy.lead }}</p>
          <div v-rise class="service-hero__actions">
            <NuxtLink :to="`${localePath('/contact')}#contact-request`" class="service-button">{{ copy.cta.button }}</NuxtLink>
            <a :href="`tel:${COMPANY.phone.e164}`" class="service-hero__phone">{{ COMPANY.phone.display }}</a>
          </div>
        </div>
        <div v-rise class="service-hero__picture">
          <OptImage :src="service.image" :alt="copy.h1" sizes="(min-width: 900px) 46vw, 92vw" width="1200" height="900" loading="eager" fetchpriority="high" decoding="async" />
        </div>
      </section>

      <section class="service-section service-intro">
        <p v-for="(paragraph, index) in copy.intro" :key="index" v-rise>{{ paragraph }}</p>
      </section>

      <section class="service-section" aria-labelledby="service-includes">
        <h2 id="service-includes" v-blur-reveal class="service-heading">{{ copy.includes.title }}</h2>
        <ul class="service-includes" data-reveal-row>
          <li v-for="item in copy.includes.items" :key="item" v-rise>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12.5 4.2 4.2L19 7" /></svg>
            <span>{{ item }}</span>
          </li>
        </ul>
      </section>

      <section class="service-section" aria-labelledby="service-process">
        <h2 id="service-process" v-blur-reveal class="service-heading">{{ copy.process.title }}</h2>
        <ol class="service-steps" data-reveal-row>
          <li v-for="(step, index) in copy.process.steps" :key="step.name" v-rise>
            <span class="service-steps__number" aria-hidden="true">{{ String(index + 1).padStart(2, "0") }}</span>
            <h3>{{ step.name }}</h3>
            <p>{{ step.text }}</p>
          </li>
        </ol>
        <p v-if="copy.timeline" v-rise class="service-timeline">
          <strong>{{ copy.timeline.title }}.</strong> {{ copy.timeline.text }}
        </p>
      </section>

      <section v-if="plans.length" class="service-section" aria-labelledby="service-prices">
        <h2 id="service-prices" v-blur-reveal class="service-heading">{{ t("servicesPage.pricesTitle", { name }) }}</h2>
        <ul class="service-plans" data-reveal-row>
          <li v-for="plan in plans" :key="plan.name" v-rise>
            <p class="service-plans__name">{{ plan.name }}</p>
            <!-- The words around the price follow each language's order ("от $900", "$900 dan"). -->
            <p class="service-plans__price">
              <template v-for="(part, index) in priceParts(plan.price)" :key="index">
                <span v-if="part.word">{{ part.text }}</span><template v-else>{{ part.text }}</template>
              </template>
            </p>
          </li>
        </ul>
        <p v-rise class="service-note">
          {{ t("servicesPage.pricesNote") }}
          <NuxtLink :to="localePath('/pricing')">{{ t("servicesPage.allPrices") }}</NuxtLink>
        </p>
      </section>

      <section class="service-section" aria-labelledby="service-faq">
        <h2 id="service-faq" v-blur-reveal class="service-heading">{{ copy.faq.title }}</h2>
        <div class="service-faq">
          <details v-for="item in copy.faq.items" :key="item.q" v-rise>
            <summary><h3>{{ item.q }}</h3><span class="service-faq__icon" aria-hidden="true" /></summary>
            <p>{{ item.a }}</p>
          </details>
        </div>
      </section>

      <section class="service-section" aria-labelledby="service-related">
        <h2 id="service-related" v-blur-reveal class="service-heading">{{ t("servicesPage.relatedTitle") }}</h2>
        <ul class="service-related" data-reveal-row>
          <li v-for="item in related" :key="item.key" v-rise>
            <NuxtLink :to="item.path" class="service-card">
              <OptImage :src="item.image" alt="" sizes="(min-width: 900px) 22vw, 80vw" width="800" height="600" loading="lazy" decoding="async" />
              <span class="service-card__name">{{ item.name }}</span>
              <span class="service-card__summary">{{ item.summary }}</span>
            </NuxtLink>
          </li>
        </ul>
        <p v-rise class="service-note">
          <NuxtLink :to="servicesHubPath(siteLocale)">{{ t("servicesPage.allServices") }}</NuxtLink>
          ·
          <NuxtLink :to="localePath('/projects')">{{ t("servicesPage.viewProjects") }}</NuxtLink>
        </p>
      </section>

      <section class="service-cta" aria-labelledby="service-cta">
        <h2 id="service-cta" v-blur-reveal>{{ copy.cta.title }}</h2>
        <p v-rise>{{ copy.cta.text }}</p>
        <NuxtLink v-rise :to="`${localePath('/contact')}#contact-request`" class="service-button">{{ copy.cta.button }}</NuxtLink>
      </section>
    </div>
  </div>
</template>

<style src="~/assets/css/service-page.css"></style>
