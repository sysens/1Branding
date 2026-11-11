<script setup lang="ts">
import { computed } from "vue";
import ProjectsShowcase from "~/components/projects/ProjectsShowcase.vue";
import ServiceTemplate from "~/components/services/ServiceTemplate.vue";
import OptImage from "~/components/ui/OptImage.vue";
import { SITE_LOCALES, toSiteLocale } from "~/utils/locales";
import { priceNumber, priceUnitKey, withPriceChanges } from "~/utils/pricePlans";
import { loadServiceCopy } from "~/utils/serviceCopy";
import { serviceBySlug, servicePath, servicesHubPath, serviceByKey } from "~/utils/servicePages";
import { toggleDetails } from "~/utils/smoothDetails";

// One service's page (/services/<slug>, its slug in each language), on the
// shared showcase template (components/services/ServiceTemplate.vue; Branding
// & rebranding is the showcase page itself, ProjectsShowcase): what it
// is, how the work goes and what it includes (its own words and picture), then
// what it costs, our work, questions, related services and a way to start. The
// copy is in app/content/services; prices come live from the CMS price list
// shown on /pricing. The page ends with the site footer itself (the template).

const route = useRoute();
const { t, locale } = useI18n();

const packLabPrototype = usePrototype("packLab");
const localePath = useLocalePath();
const origin = useSiteOrigin();
const siteLocale = computed(() => toSiteLocale(locale.value));

definePageMeta({ key: (route) => route.fullPath, footer: false });

// A white page under the site header, as the showcase was.
useHead({
  htmlAttrs: { class: "showcase-document" },
  bodyAttrs: { class: "showcase-document" },
});

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
  return withPriceChanges(service.priceCategory, (category?.pricing ?? []).filter((plan): plan is NonNullable<typeof plan> => Boolean(plan)))
    .map((plan) => ({ name: plan.title?.trim() || "", amount: priceNumber(plan.price) }))
    .filter((plan) => plan.name && Number.isFinite(plan.amount) && plan.amount > 0)
    .sort((a, b) => a.amount - b.amount)
    .map((plan) => ({ ...plan, price: formatPrice(plan.amount) }));
});

// "from {price}" / "{price} per slide" split into the words (small, grey)
// and the price itself, in the order of the page's language.
const priceParts = (price: string) => {
  const marker = "%PRICE%";
  const template = t(priceUnitKey(service.priceUnit), { price: marker });
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
// The case studies tagged with this service (CMS), in the page's language or
// in English where it has none.
type CaseNode = { documentId?: string | null; slug?: string | null; section1?: { projectTitle?: string | null; images?: Array<{ url?: string | null } | null> | null } | null; tags?: Array<{ label?: string | null } | null> | null };
const CASE_FIELDS = "nodes { documentId slug section1 { projectTitle images { url } } tags { label } }";
const { data: caseData } = await useCmsQuery<{ projectsPages_connection?: { nodes?: CaseNode[] | null } | null; fallback?: { nodes?: CaseNode[] | null } | null }>(
  "service-cases",
  `query ServiceCases($locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode, $withFallback: Boolean!) {
    projectsPages_connection(locale: $locale, pagination: { pageSize: 50 }) { ${CASE_FIELDS} }
    fallback: projectsPages_connection(locale: $fallbackLocale, pagination: { pageSize: 50 }) @include(if: $withFallback) { ${CASE_FIELDS} }
  }`,
);
const cmsMedia = useCmsMedia();
const cases = computed(() => {
  const tags = service.caseTags ?? [];
  if (!tags.length) return [];
  const own = caseData.value?.data?.projectsPages_connection?.nodes ?? [];
  const nodes = own.length ? own : caseData.value?.data?.fallback?.nodes ?? [];
  return nodes
    .map((node) => ({
      key: node?.documentId || "",
      title: cmsText(node?.section1?.projectTitle),
      image: cmsMedia(node?.section1?.images?.[0]?.url),
      path: localePath(`/projects/${node?.slug?.trim() || node?.documentId}`),
      match: (node?.tags ?? []).some((tag) => tags.includes(tag?.label?.trim() || "")),
    }))
    .filter((item) => item.key && item.title && item.image && item.match)
    .slice(0, 3);
});

const related = computed(() => service.related.map((key) => ({
  key,
  name: t(`servicePages.${key}.name`),
  summary: t(`servicePages.${key}.summary`),
  image: serviceByKey(key).image,
  path: servicePath(key, siteLocale.value),
})));

// The title's face (Display Semibold) is fetched with the HTML: the hero is
// visible from the first paint, and swapping the title in late moved the
// picture and the buttons under it (a layout shift).
useServerHead({
  link: [{ rel: "preload", as: "font", type: "font/woff2", href: "/fonts/v2/SF-Pro-Display-Semibold.woff2", crossorigin: "" }],
});

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
        ...(service.priceUnit ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: String(plan.amount),
            priceCurrency: "USD",
            referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitText: service.priceUnit },
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
  <ProjectsShowcase v-if="service.key === 'branding'" />
  <ServiceTemplate v-else :service="service" :copy="copy!" :name="name" :illustration="related[0]?.image || service.image">
    <div class="service-page service-page--template">
      <div class="edge-gradient edge-gradient-left edge-gradient-soft" />
      <div class="edge-gradient edge-gradient-right edge-gradient-soft" />

      <div v-if="copy" class="service-page__frame">
        <!-- PROTOTYPE (utils/prototypes.ts): the 3D packaging lab. (The before/after
             lens was made for the Branding page, which is ProjectsShowcase now:
             it is not wired.) -->
        <ClientOnly v-if="packLabPrototype && service.key === 'packaging'">
          <LazyPrototypeOnePackLab />
        </ClientOnly>
        <section v-if="copy.timeline" class="service-section service-timeline-block" aria-labelledby="service-timeline">
          <h2 id="service-timeline" v-blur-reveal class="service-heading">{{ copy.timeline.title }}</h2>
          <p v-rise class="service-timeline">{{ copy.timeline.text }}</p>
        </section>

        <section v-if="plans.length" class="service-section" aria-labelledby="service-prices">
          <h2 id="service-prices" v-blur-reveal class="service-heading">{{ t("servicesPage.pricesTitle", { name }) }}</h2>
          <!-- A table (package, price) drawn as the design's cards: the head is
               for screen readers and search engines, each row is a card. -->
          <table class="service-plans" data-reveal-row>
            <thead class="sr-only">
              <tr>
                <th scope="col">{{ t("pricing.tablePackage") }}</th>
                <th scope="col">{{ t("pricing.tablePrice") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in plans" :key="plan.name" v-rise>
                <th scope="row" class="service-plans__name">{{ plan.name }}</th>
                <!-- The words around the price follow each language's order ("от $900", "$900 dan"). -->
                <td class="service-plans__price">
                  <template v-for="(part, index) in priceParts(plan.price)" :key="index">
                    <span v-if="part.word">{{ part.text }}</span><template v-else>{{ part.text }}</template>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-rise class="service-note">
            {{ t("servicesPage.pricesNote") }}
            <NuxtLink :to="localePath('/pricing')">{{ t("servicesPage.allPrices") }}</NuxtLink>
          </p>
        </section>

        <section v-if="cases.length" class="service-section" aria-labelledby="service-cases">
          <h2 id="service-cases" v-blur-reveal class="service-heading">{{ t("servicesPage.casesTitle") }}</h2>
          <ul class="service-related" data-reveal-row>
            <li v-for="item in cases" :key="item.key" v-rise>
              <NuxtLink :to="item.path" class="service-card">
                <NuxtImg :src="item.image" :alt="item.title" width="800" height="450" sizes="xs:90vw md:30vw" format="webp" fit="cover" loading="lazy" decoding="async" />
                <span class="service-card__name">{{ item.title }}</span>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <section class="service-section" aria-labelledby="service-faq">
          <h2 id="service-faq" v-blur-reveal class="service-heading">{{ copy.faq.title }}</h2>
          <div class="service-faq">
            <!-- Native <details>, slid open and closed by toggleDetails. -->
            <details v-for="item in copy.faq.items" :key="item.q" v-rise>
              <summary @click="toggleDetails"><h3>{{ item.q }}</h3><span class="service-faq__icon" aria-hidden="true" /></summary>
              <div class="service-faq__answer"><p>{{ item.a }}</p></div>
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
          <NuxtLink v-rise :to="`${localePath('/contact')}#contact-request`" class="ob-button">{{ copy.cta.button }}</NuxtLink>
        </section>
      </div>
    </div>
  </ServiceTemplate>
</template>

<style src="~/assets/css/service-page.css"></style>
