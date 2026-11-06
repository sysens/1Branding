<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId } from "vue";
import PriceCardLightning from "~/components/costs/PriceCardLightning.vue";
import { priceAmount, type CmsPriceCategory } from "~/composables/usePriceCategories";
import { SERVICE_PAGES, type ServiceKey } from "~/utils/servicePages";
import { loadServiceCopy } from "~/utils/serviceCopy";
import { toSiteLocale } from "~/utils/locales";

/**
 * /pricing: one card per service of the CMS price list, each with its own
 * colour (teal, blue, purple, orange). The card shows the lowest price and
 * the first items of the service page's "what it includes" list. The selected card (the first one, then the one clicked,
 * focused or, while the row scrolls, the one in the middle) is lit in its
 * colour: lightning round it (PriceCardLightning), a glow and the white button.
 */
const { t, locale } = useI18n();
const localePath = useLocalePath();
const siteLocale = computed(() => toSiteLocale(locale.value));

const { categories, categoryTitle, categoryPage } = await usePriceCategories();
const { uzs } = await useUzsPrice();

// The service each CMS category belongs to (Branding -> branding).
const PRICED = SERVICE_PAGES.filter((page) => page.priceCategory);
const serviceKey = (category: CmsPriceCategory): ServiceKey | null =>
  PRICED.find((page) => page.priceCategory!.toLowerCase() === category.title?.trim().toLowerCase())?.key ?? null;

// Only the first items of each list: the service page has all of them.
const LIST_LENGTH = 5;
const { data: includes } = await useAsyncData(
  () => `pricing-includes:${siteLocale.value}`,
  async () => {
    const copies = await Promise.all(PRICED.map((page) => loadServiceCopy(page.key, siteLocale.value)));
    return Object.fromEntries(PRICED.map((page, index) => [page.key, (copies[index]?.includes.items ?? []).slice(0, LIST_LENGTH)]));
  },
);

const formatPrice = (amount: number) => `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
// "from {price}" / "{price} per slide" split around the price, so the words
// stay small and the number large in any language ("$900 dan", "slayd uchun $35").
// The space next to the price stays in the text (screen readers, copying);
// on screen the gap between the parts spaces them.
const splitTemplate = (key: string) => {
  const [before = "", after = ""] = t(key, { price: "%PRICE%" }).split("%PRICE%").map((part) => part.trim());
  return { before: before && `${before} `, after: after && ` ${after}` };
};

const TONES = ["teal", "blue", "purple", "orange"] as const;
// The lightning's colours ("r g b"): the light, its white-hot core, the sparks,
// and how many sparks a second (the orange one burns). Measured on Huly's
// cards: the mean of the bright and of the mid pixels of their frames.
const LIGHTNING: Record<(typeof TONES)[number], { tone: string; core: string; spark: string; sparks: number }> = {
  teal: { tone: "70 235 210", core: "200 252 248", spark: "150 255 232", sparks: 8 },
  blue: { tone: "84 106 245", core: "185 205 252", spark: "160 190 255", sparks: 8 },
  purple: { tone: "195 100 245", core: "242 205 248", spark: "235 170 255", sparks: 10 },
  orange: { tone: "245 128 75", core: "252 215 175", spark: "255 196 110", sparks: 34 },
};

const cards = computed(() => categories.value.flatMap((category) => {
  const plans = (category.pricing ?? [])
    .map((plan) => ({ name: plan.title?.trim() || "", amount: priceAmount(plan.price) }))
    .filter((plan) => plan.name && Number.isFinite(plan.amount) && plan.amount > 0)
    .sort((a, b) => a.amount - b.amount);
  if (!plans.length) return [];
  const key = serviceKey(category);
  const perSlide = Boolean(categoryPage(category)?.perSlide);
  const lowest = plans[0]!.amount;
  return [{
    id: category.title,
    title: categoryTitle(category),
    price: formatPrice(lowest),
    unit: splitTemplate(perSlide ? "servicesPage.pricePerSlide" : "servicesPage.priceFrom"),
    uzs: uzs(lowest),
    items: (key && includes.value?.[key]) || [],
  }];
}).map((card, index) => ({ ...card, tone: TONES[index % TONES.length] ?? "teal" })));

const contactPath = computed(() => `${localePath("/contact")}#contact-request`);

// ---------- the selected card ----------
const active = ref(0);
const row = ref<HTMLElement | null>(null);
const cardEls: HTMLElement[] = [];
const setCard = (index: number) => (el: unknown) => { if (el instanceof HTMLElement) cardEls[index] = el; };
const scrolls = () => Boolean(row.value && row.value.scrollWidth > row.value.clientWidth + 1);

// While the row scrolls, a clicked card also comes to the middle (the cards
// it passes on the way are not selected).
let lockedUntil = 0;
const select = (index: number) => {
  active.value = index;
  const card = cardEls[index];
  if (!row.value || !card || !scrolls()) return;
  const target = card.offsetLeft + card.offsetWidth / 2 - row.value.clientWidth / 2;
  lockedUntil = performance.now() + 700;
  row.value.scrollTo({ left: target, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
};

// A swipe selects the card the row comes to rest on: the one whose snap
// position (its middle at the row's middle, kept within the scroll range, so
// the first card's is the start) is nearest to where the row is.
let frame = 0;
const onScroll = () => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!row.value || !scrolls() || performance.now() < lockedUntil) return;
    const { scrollLeft, clientWidth, scrollWidth } = row.value;
    const max = scrollWidth - clientWidth;
    let nearest = active.value;
    let distance = Infinity;
    cardEls.forEach((card, index) => {
      const snap = Math.min(max, Math.max(0, card.offsetLeft + card.offsetWidth / 2 - clientWidth / 2));
      const gap = Math.abs(snap - scrollLeft);
      if (gap < distance) { distance = gap; nearest = index; }
    });
    active.value = nearest;
  });
};

const uid = useId();
onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <section v-if="cards.length" class="price-cards">
    <div ref="row" class="price-cards__row" @scroll.passive="onScroll">
      <article
        v-for="(card, index) in cards"
        :key="card.id"
        :ref="setCard(index)"
        class="price-card"
        :class="[`price-card--${card.tone}`, { 'is-active': active === index }]"
        :aria-labelledby="`price-card-${uid}-${index}`"
        @click="select(index)"
        @focusin="active = index"
      >
        <span class="price-card__halo" aria-hidden="true" />
        <PriceCardLightning v-if="active === index" v-bind="LIGHTNING[card.tone]" />

        <h2 :id="`price-card-${uid}-${index}`" class="price-card__title">{{ card.title }}</h2>
        <p class="price-card__price">
          <span v-if="card.unit.before" class="price-card__unit">{{ card.unit.before }}</span>
          <span class="price-card__amount">{{ card.price }}</span>
          <span v-if="card.unit.after" class="price-card__unit">{{ card.unit.after }}</span>
        </p>
        <p v-if="card.uzs" class="price-card__uzs">{{ card.uzs }}</p>
        <span class="price-card__rule" aria-hidden="true" />

        <ul v-if="card.items.length" class="price-card__items">
          <li v-for="item in card.items" :key="item">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m13.33 4-7.33 7.33L2.66 8" /></svg>
            <span>{{ item }}</span>
          </li>
        </ul>

        <div class="price-card__foot">
          <NuxtLink :to="contactPath" class="price-card__cta">{{ t("pricing.order") }}</NuxtLink>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
/* Laid out as huly.io/pricing's plans, at every width: cards 390px wide and
   56px apart; the first one at the left of a 896px content column centred on
   the page, the others running on to the right, off the screen where it is
   narrow. */
.price-cards {
  --card-w: 24.375rem;
  --card-gap: 3.5rem;
  --card-r: 1.5rem;
  --column: min(56rem, 100% - 2.5rem);
  position: relative;
  width: 100%;
}

/* The row scrolls sideways across the whole width; a picked card comes to the
   middle (it snaps there). The start padding puts the first card at the
   column's left; the end padding lets the last one reach the middle. Huly's
   fade: clear at the left edge, full from 21% of the width to 70%, clear again
   from 90% (cards further right sink into the dark). The vertical padding is
   room for the glow (a scrolling box clips what sticks out of it); the
   negative margins keep it from pushing the page apart (the title and the
   rate line sit above it, pricing.vue). */
.price-cards__row {
  position: relative;
  display: flex;
  gap: var(--card-gap);
  align-items: stretch;
  margin-block: -10rem;
  padding: 10rem calc(50% - var(--card-w) / 2) 10rem calc((100% - var(--column)) / 2);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(90deg, transparent 0.46%, #000 21.13%, #000 69.57%, transparent 90.18%);
  mask-image: linear-gradient(90deg, transparent 0.46%, #000 21.13%, #000 69.57%, transparent 90.18%);
}

.price-cards__row::-webkit-scrollbar {
  display: none;
}

@media (max-width: 1279px) {
  .price-cards {
    --card-w: 22.875rem;
    --card-gap: 3rem;
  }
}

/* ---------- colours: the line, its glow, the inside of the lit card ---------- */
.price-card--teal {
  --tone: 70 235 210;
  --tone-soft: 140 245 225;
  --tone-core: 215 255 246;
  --lit-top: rgb(26 52 47);
  --lit-bottom: rgb(11 19 19);
}

.price-card--blue {
  --tone: 84 106 245;
  --tone-soft: 140 165 255;
  --tone-core: 220 222 255;
  --lit-top: rgb(33 44 94);
  --lit-bottom: rgb(13 16 33);
}

.price-card--purple {
  --tone: 195 100 245;
  --tone-soft: 205 160 255;
  --tone-core: 242 222 255;
  --lit-top: rgb(50 45 88);
  --lit-bottom: rgb(19 17 32);
}

.price-card--orange {
  --tone: 245 128 75;
  --tone-soft: 255 190 130;
  --tone-core: 255 236 214;
  --lit-top: rgb(70 42 33);
  --lit-bottom: rgb(24 15 12);
}

/* ---------- card ---------- */
.price-card {
  position: relative;
  flex: 0 0 var(--card-w);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 1.75rem 1.75rem 1.5625rem;
  border: 1px solid rgb(255 255 255 / 0.05);
  border-radius: var(--card-r);
  background: rgb(14 16 18 / 0.88);
  box-shadow: 0.25rem 0.375rem 1.5625rem rgb(0 0 0 / 0.56);
  color: #fff;
  font-family: var(--app-font-sans);
  scroll-snap-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.price-card:hover {
  border-color: rgb(255 255 255 / 0.12);
}

.price-card.is-active {
  border-color: rgb(var(--tone-soft) / 0.55);
  background:
    radial-gradient(70% 45% at 100% 100%, rgb(var(--tone) / 0.14), rgb(var(--tone) / 0) 100%),
    linear-gradient(160deg, var(--lit-top) 0%, var(--lit-bottom) 62%);
  box-shadow: inset 0 0 1.25rem rgb(var(--tone) / 0.16);
  cursor: default;
}

/* The glow around the lit card: close and bright (shadows), then a wide
   faint haze (a radial gradient). All of it fades out within 8rem of the card,
   inside the row's 10rem of glow room: a wider shadow reached past it and was
   cut off in a straight line above and below the cards. */
.price-card__halo {
  position: absolute;
  inset: -0.5rem;
  z-index: -2;
  border-radius: calc(var(--card-r) + 0.5rem);
  box-shadow:
    0 0 2.5rem 0.25rem rgb(var(--tone) / 0.5),
    0 0 5rem 1rem rgb(var(--tone) / 0.28);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.price-card__halo::after {
  position: absolute;
  inset: -7.5rem -9rem;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgb(var(--tone) / 0.16), rgb(var(--tone) / 0.07) 60%, rgb(var(--tone) / 0));
  content: "";
}

.price-card.is-active .price-card__halo {
  opacity: 1;
}

/* ---------- content ---------- */
.price-card__title {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.375;
  letter-spacing: -0.04em;
  font-weight: 600;
}

.price-card__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.3rem;
  margin: 0.625rem 0 0;
  line-height: 1.25;
}

.price-card__amount {
  font-size: clamp(2.5rem, calc(3.33 * var(--fvw)), 4rem);
  letter-spacing: -0.04em;
  font-weight: 600;
}

.price-card__unit {
  color: rgb(201 203 207);
  font-size: 1.25rem;
  letter-spacing: -0.04em;
  font-weight: 500;
}

.price-card__uzs {
  margin: 0.125rem 0 0;
  color: rgb(201 203 207 / 0.7);
  font-size: 0.875rem;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.price-card__rule {
  display: block;
  height: 1px;
  margin-top: 1.125rem;
  background: rgb(255 255 255 / 0.1);
}

.price-card__items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
}

.price-card__items li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: rgb(255 255 255 / 0.9);
  font-size: 1.125rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 500;
}

.price-card__items svg {
  flex: none;
  width: 1rem;
  height: 1rem;
  margin-top: 0.05em;
  fill: none;
  stroke: #fff;
  stroke-width: 1.83;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* The button sits at the bottom, with room above it however short the card. */
.price-card__foot {
  margin-top: auto;
  padding-top: 2.5rem;
}

/* White on the lit card, an outline on the others. */
.price-card__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 3.5rem;
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 62.4375rem;
  color: #fff;
  font-size: 1.125rem;
  line-height: 1;
  letter-spacing: -0.02em;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.price-card__cta:hover,
.price-card__cta:focus-visible {
  background: rgb(255 255 255 / 0.08);
}

.price-card.is-active .price-card__cta {
  background: #fff;
  color: rgb(11 13 16);
}

.price-card.is-active .price-card__cta:hover,
.price-card.is-active .price-card__cta:focus-visible {
  background: rgb(228 230 233);
}

@media (max-width: 767px) {
  .price-cards {
    --card-w: min(86vw, 22.875rem);
    --card-gap: 1.25rem;
  }

  /* Phones: no fade (as on Huly), the row runs edge to edge. */
  .price-cards__row {
    -webkit-mask-image: none;
    mask-image: none;
  }

  .price-card {
    padding: 1.125rem;
  }

  .price-card__title,
  .price-card__unit {
    font-size: 1rem;
  }

  .price-card__amount {
    font-size: 2.25rem;
  }

  .price-card__items li {
    font-size: 1rem;
  }

  .price-card__items {
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .price-card__foot {
    padding-top: 1.75rem;
  }

  .price-card__cta {
    height: 3rem;
    font-size: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .price-card,
  .price-card__halo,
  .price-card__cta {
    transition: none;
  }
}
</style>
