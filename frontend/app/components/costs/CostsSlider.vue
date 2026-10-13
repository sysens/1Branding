<template>
  <div class="costs">
      <div class="costs__inner">
        <section
          v-for="(category, categoryIndex) in priceCategories"
          :key="`${category.title}-${categoryIndex}`"
          class="costs-cat"
          :class="{ 'costs-cat--hero': categoryIndex === 0 }"
        >
          <CostsOrbitalGlow
            v-if="categoryIndex === 0"
            class="costs-cat__orbital-glow"
            :speed="0.7"
            :intensity="1.35"
            :opacity="0.92"
          />

          <div class="costs-cat__head">
            <h2 class="costs-cat__title">{{ category.title }}</h2>
            <p v-if="categoryDescription(category)" class="costs-cat__desc">
              {{ categoryDescription(category) }}
            </p>
          </div>

          <div class="costs-cards">
            <button
              v-for="(item, itemIndex) in category.pricing"
              :key="`${category.title}-${item.title}-${itemIndex}`"
              type="button"
              class="costs-card"
              :class="{ 'costs-card--active': activeIndex[categoryIndex] === itemIndex }"
              @mouseenter="setActive(categoryIndex, itemIndex)"
              @focus="setActive(categoryIndex, itemIndex)"
            >
              <img
                class="costs-card__badge"
                src="/Costs/one.webp"
                alt=""
                aria-hidden="true"
                loading="lazy"
              >

              <span class="costs-card__name">{{ item.title }}</span>

              <span class="costs-card__price">
                <span class="costs-card__from">{{ fromLabel }}</span>
                <span class="costs-card__amount">{{ formatPrice(item.price) }}</span>
              </span>
            </button>
          </div>
        </section>
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import CostsOrbitalGlow from "~/components/costs/CostsOrbitalGlow.vue";

type PricingItem = {
  title: string;
  price: string;
  priceText: string;
  description: string;
};

type PriceCategory = {
  title: string;
  pricing: PricingItem[];
};

type PriceCategoriesResponse = {
  data?: {
    priceCategories?: PriceCategory[];
    fallbackPriceCategories?: PriceCategory[];
  };
  errors?: Array<{ message: string }>;
};

const { t } = useI18n();

const query = `
  query PriceCategories($locale: I18NLocaleCode!, $withFallback: Boolean!) {
    priceCategories(locale: $locale) {
      title
      pricing {
        title
        price
        priceText
        description
      }
    }
    fallbackPriceCategories: priceCategories(locale: "en") @include(if: $withFallback) {
      title
      pricing {
        title
        price
        priceText
        description
      }
    }
  }
`;

const { data: priceRes } = await useCmsQuery<NonNullable<PriceCategoriesResponse["data"]>>("price-categories", query);

const priceCategories = computed<PriceCategory[]>(() => {
  const current = priceRes.value?.data?.priceCategories || [];
  if (current.length) return current;
  return priceRes.value?.data?.fallbackPriceCategories || [];
});

const fromLabel = computed(() => t("common.from"));

const categoryDescription = (category: PriceCategory) =>
  category.pricing?.[0]?.description?.trim() ||
  category.pricing?.[0]?.priceText?.trim() ||
  "";

const formatPrice = (value: string) => {
  const raw = String(value || "").trim();
  const number = raw.replace(/[^\d.,]/g, "");
  const currency = raw.replace(/[\d.,\s]/g, "") || "$";
  return number ? `${number}${currency}` : raw;
};

// Highlighted ("featured") card per category — defaults to the first, follows hover/focus.
const activeIndex = reactive<Record<number, number>>({});

watch(
  priceCategories,
  (categories) => {
    categories.forEach((_, index) => {
      if (activeIndex[index] === undefined) activeIndex[index] = 0;
    });
  },
  { immediate: true }
);

const setActive = (categoryIndex: number, itemIndex: number) => {
  activeIndex[categoryIndex] = itemIndex;
};
</script>

<style scoped>
.costs {
  position: relative;
  width: 100%;
}

.costs__inner {
  position: relative;
  margin-inline: auto;
  width: min(100%, 70rem);
  padding: clamp(2rem, 5vw, 4.5rem) clamp(1rem, 4vw, 2.5rem) clamp(3rem, 7vw, 7rem);
  display: flex;
  flex-direction: column;
  gap: clamp(3rem, 7vw, 7rem);
}

/* ---------- category block ---------- */
.costs-cat {
  position: relative;
}

.costs-cat--hero {
  isolation: isolate;
  padding-top: clamp(1rem, 6vw, 5rem);
}

.costs-cat__orbital-glow {
  position: absolute;
  inset: clamp(-1rem, -2vw, -0.25rem) clamp(-8rem, -7vw, -2rem) clamp(-3rem, -4vw, -1rem);
  z-index: 0;
}

.costs-cat__head {
  position: relative;
  z-index: 1;
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
  padding-left: clamp(0.25rem, 1.5vw, 1.5rem);
}

.costs-cat__title {
  margin: 0 0 clamp(0.75rem, 1.6vw, 1.4rem);
  color: #ffffff;
  font-family: var(--app-font-display, "SF Pro Display", sans-serif);
  font-weight: 300;
  font-size: clamp(1.4rem, 2.3vw, 2.2rem);
  letter-spacing: 0.34em;
  text-transform: uppercase;
  line-height: 1.1;
}

.costs-cat__desc {
  margin: 0;
  max-width: 58rem;
  color: rgba(255, 255, 255, 0.82);
  font-family: var(--app-font-display, "SF Pro Display", sans-serif);
  font-size: clamp(0.95rem, 1.15vw, 1.15rem);
  line-height: 1.55;
  white-space: pre-line;
}

/* ---------- cards ---------- */
.costs-cards {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 1.4vw, 1.15rem);
}

.costs-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  min-height: clamp(4.75rem, 9vw, 8.25rem);
  padding: clamp(1rem, 2.2vw, 1.75rem) clamp(1.4rem, 3vw, 2.85rem);
  border: 0.125rem solid rgba(70, 200, 120, 0.16);
  border-radius: clamp(1.25rem, 2vw, 1.85rem);
  background:
    url("/Costs/shape-11.png") left top / 58% auto no-repeat,
    radial-gradient(120% 150% at -2% -10%, #0e4a2e 0%, #082619 34%, #05140d 62%, #04100b 100%),
    #04100b;
  color: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease;
}

.costs-card:hover {
  transform: translateY(-1px);
}

.costs-card--active {
  border-color: #3bec57;
  box-shadow:
    0 0 0 0.0625rem rgba(59, 236, 87, 0.55),
    0 0 3rem rgba(47, 224, 74, 0.5),
    inset 0 0 1.6rem rgba(47, 224, 74, 0.14);
  background:
    url("/Costs/shape-11.png") left top / 62% auto no-repeat,
    radial-gradient(120% 150% at -2% -10%, #14663f 0%, #0b3a24 34%, #06190f 62%, #04120c 100%),
    #04120c;
}

.costs-card__name {
  font-family: "Oswald", "SF Pro Display", sans-serif;
  font-weight: 600;
  font-size: clamp(1.3rem, 3vw, 2.75rem);
  line-height: 1;
  letter-spacing: 0.015em;
  text-transform: uppercase;
  background: linear-gradient(96deg, #ffffff 0%, #ffffff 46%, #c9d2cd 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.costs-card__price {
  display: flex;
  align-items: baseline;
  gap: clamp(0.35rem, 0.7vw, 0.6rem);
  white-space: nowrap;
}

.costs-card__from {
  font-family: "Poppins", "Inter", sans-serif;
  font-weight: 400;
  font-size: clamp(0.75rem, 1vw, 1.05rem);
  color: rgba(255, 255, 255, 0.85);
  text-transform: lowercase;
}

.costs-card__amount {
  font-family: "Oswald", "SF Pro Display", sans-serif;
  font-weight: 600;
  font-size: clamp(1.3rem, 3vw, 2.75rem);
  line-height: 1;
  color: #ffffff;
}

/* "1" badge image — only visible on the active card, top-right corner */
.costs-card__badge {
  position: absolute;
  z-index: 3;
  top: clamp(-1.5rem, -2.1vw, -1.9rem);
  right: clamp(0.75rem, 2.2vw, 1.6rem);
  width: clamp(3.5rem, 5vw, 5.5rem);
  height: auto;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}

.costs-card--active .costs-card__badge {
  opacity: 1;
  transform: scale(1);
}

@media (max-width: 37.5rem) {
  .costs-card {
    border-radius: 1.1rem;
    padding: 1rem 1.1rem;
  }

  .costs-card__name,
  .costs-card__amount {
    font-size: clamp(1.15rem, 6.4vw, 1.6rem);
  }
}
</style>
