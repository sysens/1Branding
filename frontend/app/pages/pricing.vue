<script setup lang="ts">
import PricingCards from "~/components/costs/PricingCards.vue";
import { computed } from "vue";
import { priceAmount } from "~/composables/usePriceCategories";

const { t } = useI18n();

const cmsSeo = await useCmsSeo("pricePage");
const localePath = useLocalePath();
const origin = useSiteOrigin();
// The same request as the cards' (one key): the structured data repeats
// their prices.
const { categories, categoryTitle, categoryPage } = await usePriceCategories();
const { uzsNote, uzsCredit } = await useUzsPrice();

const rows = computed(() => categories.value.flatMap((category) => {
  const page = categoryPage(category);
  return (category.pricing ?? [])
    .map((plan) => ({ plan: plan.title?.trim() || "", amount: priceAmount(plan.price) }))
    .filter((row) => row.plan && Number.isFinite(row.amount) && row.amount > 0)
    .sort((a, b) => a.amount - b.amount)
    .map((row) => ({ ...row, category: categoryTitle(category), page }));
}));

usePageSeo({
  title: computed(() => cmsSeo.title.value || t("seo.price.title")),
  description: computed(() => cmsSeo.description.value || t("seo.price.description")),
  breadcrumbs: computed(() => [{ name: t("nav.prices"), path: localePath("/pricing") }]),
  structuredData: computed(() => (rows.value.length ? {
    "@type": "OfferCatalog",
    name: t("seo.price.h1"),
    url: `${origin}${localePath("/pricing")}`,
    itemListElement: rows.value.map((row) => ({
      "@type": "Offer",
      name: `${row.category}: ${row.plan}`,
      price: String(row.amount),
      priceCurrency: "USD",
      ...(row.page?.perSlide ? {
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(row.amount),
          priceCurrency: "USD",
          referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitText: "slide" },
        },
      } : {}),
      itemOffered: {
        "@type": "Service",
        name: row.page?.name || row.category,
        ...(row.page ? { url: `${origin}${row.page.path}` } : {}),
        provider: { "@id": `${origin}/#organization` },
      },
    })),
  } : null)),
});

</script>

<template>
  <div class="relative min-h-screen bg-black overflow-hidden">

    <div class="pricing-body relative z-10">
      <div class="vg md:pt-[3.75rem] pt-[1.875rem]">

        <!-- The title comes in with the first paint (CSS), as on the other
             inner pages: a reveal waiting for the app's JavaScript kept it
             hidden for seconds on a slow phone. -->
        <header class="pricing-intro intro-slide-in">
          <h1>{{ $t("seo.price.h1") }}</h1>
          <p>{{ $t("pricing.lead") }}</p>
        </header>

      </div>

      <PricingCards class="pricing-cards" />
      <p v-if="uzsNote" class="pricing-note">
        {{ uzsNote }}
        <a v-if="uzsCredit" href="https://www.exchangerate-api.com" lang="en">Rates By Exchange Rate API</a>
      </p>

    </div>
  </div>
</template>

<style scoped>
/* Above the cards' row, whose glow room reaches up under it. */
.pricing-intro {
  position: relative;
  z-index: 1;
  max-width: 61.25rem;
  margin: 0 auto;
  padding: 6.875rem 1.25rem 0.625rem;
  text-align: center;
}

/* The page title: the h2 step, as on the site's other inner pages. */
.pricing-intro h1 {
  margin: 0;
  color: #fff;
  font-family: var(--app-font-display);
  font-size: var(--type-h2-size);
  line-height: var(--type-h2-lh);
  letter-spacing: var(--type-h2-ls);
  font-weight: 600;
}

/* One or two short lines (about 130 characters): stays centred. */
.pricing-intro p {
  max-width: var(--type-measure);
  margin: 1.25rem auto 0;
  color: #a3a6aa;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
}

/* Room under the cards (and the rate line) before the footer. */
.pricing-body {
  /* At least the cards' glow (8rem under them, less the rate line) clear of
     the footer. */
  padding-bottom: clamp(6rem, calc(7 * var(--fvw)), 8rem);
}

/* Below the title; the cards' glow reaches into the space around them. */
.pricing-cards {
  margin: clamp(2.5rem, calc(3.5 * var(--fvw)), 4.5rem) 0 0;
}

/* The rate the so'm amounts use: one quiet line under the cards. */
.pricing-note {
  position: relative;
  z-index: 1;
  max-width: 68.75rem;
  margin: 2.5rem auto 0;
  padding: 0 1.25rem;
  color: #8f9297;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  letter-spacing: var(--type-caption-ls);
  text-align: center;
}

.pricing-note a {
  color: #fff;
  text-decoration: underline;
  text-decoration-color: rgb(3 203 0 / 0.7);
  text-underline-offset: 0.2em;
}

.pricing-note a:hover,
.pricing-note a:focus-visible {
  color: #03cb00;
}
</style>
