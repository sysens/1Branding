<script setup lang="ts">
import Warning from "~/components/costs/Warning.vue";
import { computed } from "vue";
import { priceAmount } from "~/composables/usePriceCategories";

const { t } = useI18n();

const cmsSeo = await useCmsSeo("pricePage");
const localePath = useLocalePath();
const origin = useSiteOrigin();
// The same request as the slider's (one key): the table and the structured
// data repeat the cards' prices as plain text.
const { categories, categoryTitle, categoryPage } = await usePriceCategories();

const formatPrice = (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const rows = computed(() => categories.value.flatMap((category) => {
  const page = categoryPage(category);
  return (category.pricing ?? [])
    .map((plan) => ({ plan: plan.title?.trim() || "", amount: priceAmount(plan.price) }))
    .filter((row) => row.plan && Number.isFinite(row.amount) && row.amount > 0)
    .sort((a, b) => a.amount - b.amount)
    .map((row) => ({
      ...row,
      category: categoryTitle(category),
      page,
      price: page?.perSlide
        ? t("servicesPage.pricePerSlide", { price: formatPrice(row.amount) })
        : t("servicesPage.priceFrom", { price: formatPrice(row.amount) }),
    }));
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

    <div class="edge-gradient edge-gradient-left edge-gradient-strong"/>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"/>

    <div class="relative z-10">
      <div class="vg md:pt-[3.75rem] pt-[1.875rem]">

        <header class="pricing-intro">
          <h1 v-blur-reveal>{{ $t("seo.price.h1") }}</h1>
          <p v-rise>{{ $t("pricing.lead") }}</p>
        </header>

        <div class="mx-auto max-w-[110rem] touch-pan-y">
          <CostsSlider />
        </div>
      </div>

      <section v-if="rows.length" class="pricing-table" aria-labelledby="pricing-table-title">
        <h2 id="pricing-table-title">{{ $t("pricing.tableTitle") }}</h2>
        <div class="pricing-table__scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{{ $t("pricing.tableService") }}</th>
                <th scope="col">{{ $t("pricing.tablePackage") }}</th>
                <th scope="col">{{ $t("pricing.tablePrice") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="`${row.category}-${row.plan}`">
                <td>
                  <NuxtLink v-if="row.page" :to="row.page.path">{{ row.page.name }}</NuxtLink>
                  <template v-else>{{ row.category }}</template>
                </td>
                <td>{{ row.plan }}</td>
                <td>{{ row.price }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="mx-auto max-w-[103.75rem]">
        <Warning />
      </div>

    </div>
  </div>
</template>

<style scoped>
.pricing-intro {
  max-width: 61.25rem;
  margin: 0 auto;
  padding: 6.875rem 1.25rem 0.625rem;
  text-align: center;
}

.pricing-intro h1 {
  margin: 0;
  color: #fff;
  font-family: var(--app-font-display);
  font-size: var(--type-h1-size);
  line-height: var(--type-h1-lh);
  letter-spacing: var(--type-h1-ls);
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

.pricing-table {
  max-width: 68.75rem;
  margin: 2.5rem auto 5rem;
  padding: 0 1.25rem;
}

.pricing-table h2 {
  margin: 0 0 1.5rem;
  color: #fff;
  font-family: var(--app-font-display);
  font-size: var(--type-h3-size);
  line-height: var(--type-h3-lh);
  letter-spacing: var(--type-h3-ls);
  font-weight: 600;
  text-align: center;
}

.pricing-table__scroll {
  overflow-x: auto;
}

.pricing-table table {
  width: 100%;
  min-width: 32.5rem;
  border-collapse: collapse;
  color: #d5d7da;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
}

.pricing-table th,
.pricing-table td {
  padding: 1rem 1.125rem;
  border-bottom: 1px solid rgb(255 255 255 / 0.12);
  text-align: left;
}

.pricing-table th {
  color: #8f9297;
  font-size: var(--type-label-size);
  line-height: var(--type-label-lh);
  letter-spacing: var(--type-label-ls);
  font-weight: 600;
  text-transform: uppercase;
}

.pricing-table td:last-child,
.pricing-table th:last-child {
  text-align: right;
  white-space: nowrap;
}

.pricing-table td:last-child {
  color: #fff;
  font-weight: 600;
}

.pricing-table a {
  color: #fff;
  text-decoration: underline;
  text-decoration-color: rgb(3 203 0 / 0.7);
  text-underline-offset: 0.2em;
}

.pricing-table a:hover,
.pricing-table a:focus-visible {
  color: #03cb00;
}
</style>
