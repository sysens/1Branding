<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import PriceCardLightning from "~/components/costs/PriceCardLightning.vue";
import { priceAmount } from "~/composables/usePriceCategories";
import { SERVICE_PAGES } from "~/utils/servicePages";
import { loadServiceCopy } from "~/utils/serviceCopy";
import { loadPriceItems } from "~/utils/priceCopy";
import { PRICE_LIST_LENGTH, coveredItems, isFixedPrice, planKey, planTone, priceUnitKey, warningItems, type PlanTone } from "~/utils/pricePlans";
import { toSiteLocale } from "~/utils/locales";

/**
 * /pricing: one block per service of the CMS price list, one under another.
 * A block opens with the service's name, large and green, and its description.
 * Under them, on the left the service's packages as tabs, cheapest first; on
 * the right one card for the picked package: its price and the service's ten
 * items, the ones the package does not cover dimmed (utils/pricePlans.ts).
 *
 * A package has a colour, on its tab and on the card: by its place the first
 * is white, the second the site's green (the one we recommend: its tab says
 * so), the third gold; a few packages have their own (planTone: packaging's
 * One Pro is green, its Advanced gold). The picked tab's border has the beam
 * of the contact page's button going round it. The card of the block at the
 * middle of the screen (or the one clicked or focused) is lit: lightning round
 * it (PriceCardLightning), a glow and the white button.
 */
const { t, locale } = useI18n();
const localePath = useLocalePath();
const siteLocale = computed(() => toSiteLocale(locale.value));

const { categories, categoryTitle, categoryDescription, categoryPage } = await usePriceCategories();

// Each service's list: the price list's own ten items, else (a category added
// in the CMS) the first items of its service page's "what it includes".
const PRICED = SERVICE_PAGES.filter((page) => page.priceCategory);
const { data: lists } = await useAsyncData(
  () => `pricing-lists:${siteLocale.value}`,
  async () => {
    const found: Record<string, string[]> = { ...(await loadPriceItems(siteLocale.value)) };
    await Promise.all(PRICED.filter((page) => !found[planKey(page.priceCategory!)]).map(async (page) => {
      found[planKey(page.priceCategory!)] = (await loadServiceCopy(page.key, siteLocale.value))?.includes.items ?? [];
    }));
    return Object.fromEntries(Object.entries(found).map(([key, items]) => [key, items.slice(0, PRICE_LIST_LENGTH)]));
  },
);

const formatPrice = (amount: number) => `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
// "from {price}" / "{price} per slide" split around the price, so the words
// stay small and the number large in any language ("$900 dan", "slayd uchun $35").
// The space next to the price stays in the text (screen readers, copying);
// on screen the gap between the parts spaces them.
const NO_UNIT = { before: "", after: "" };
const splitTemplate = (key: string) => {
  const [before = "", after = ""] = t(key, { price: "%PRICE%" }).split("%PRICE%").map((part) => part.trim());
  return { before: before && `${before} `, after: after && ` ${after}` };
};

// A package's colour: by its place among its service's packages, or its own
// (utils/pricePlans.ts: planTone). The lightning's colours ("r g b"): the light, its white-hot core, the sparks,
// and how many sparks a second (the gold one burns). The green is the site's
// (#03cb00, with the pale greens of the OneGuarantee pill's beam).
const LIGHTNING: Record<PlanTone, { tone: string; core: string; spark: string; sparks: number }> = {
  white: { tone: "214 226 240", core: "255 255 255", spark: "255 255 255", sparks: 8 },
  green: { tone: "3 203 0", core: "201 255 191", spark: "125 255 107", sparks: 10 },
  gold: { tone: "245 180 50", core: "255 242 200", spark: "255 212 105", sparks: 30 },
};

// ---------- the picked package of each service ----------
// By the CMS category's title; a service starts on its cheapest package.
const picked = ref<Record<string, number>>({});

const groups = computed(() => categories.value.flatMap((category) => {
  const key = planKey(category.title ?? "");
  const priced = (category.pricing ?? [])
    .map((plan) => ({ name: plan.title?.trim() || "", amount: priceAmount(plan.price), was: plan.was ?? null }))
    .filter((plan) => plan.name && Number.isFinite(plan.amount) && plan.amount > 0)
    .sort((a, b) => a.amount - b.amount);
  if (!priced.length) return [];
  const items = lists.value?.[key] ?? [];
  // "from $X" (or "$X per slide"); a fixed-price package shows the price alone.
  const unit = splitTemplate(priceUnitKey(categoryPage(category)?.unit));
  const plans = priced.map((plan, rank) => ({
    name: plan.name,
    price: formatPrice(plan.amount),
    unit: isFixedPrice(key, plan.name) ? NO_UNIT : unit,
    // A discounted package: its full price, shown crossed out above the price.
    was: plan.was ? formatPrice(plan.was) : "",
    covered: coveredItems(key, plan.name, rank, priced.length, items.length),
    tone: planTone(key, plan.name, rank),
    // The green package is the one we recommend.
    recommended: planTone(key, plan.name, rank) === "green",
  }));
  const index = Math.min(picked.value[key] ?? 0, plans.length - 1);
  return [{
    key,
    title: categoryTitle(category),
    description: categoryDescription(category),
    items,
    warnings: warningItems(key),
    plans,
    // One of the service's packages is discounted: every card of the service
    // keeps the line above the price, so it does not jump between packages.
    discounted: plans.some((plan) => plan.was),
    index,
    plan: plans[index]!,
  }];
}));

const contactPath = computed(() => `${localePath("/contact")}#contact-request`);

// ---------- the lit block ----------
const active = ref(0);
// The price comes in with a short rise once a visitor has picked a package:
// never on the first paint (the page's largest text).
const touched = ref(false);

const uid = useId();
const tabId = (group: number, plan: number) => `price-${uid}-${group}-tab-${plan}`;
const panelId = (group: number) => `price-${uid}-${group}-panel`;
const titleId = (group: number) => `price-${uid}-${group}-title`;

const groupEls: HTMLElement[] = [];
const tabEls: HTMLElement[][] = [];
const setGroup = (index: number) => (el: unknown) => { if (el instanceof HTMLElement) groupEls[index] = el; };
const setTab = (group: number, plan: number) => (el: unknown) => {
  if (el instanceof HTMLElement) (tabEls[group] ??= [])[plan] = el;
};

const pick = (group: number, plan: number, focus = false) => {
  const key = groups.value[group]?.key;
  if (key === undefined) return;
  picked.value = { ...picked.value, [key]: plan };
  active.value = group;
  touched.value = true;
  if (focus) tabEls[group]?.[plan]?.focus();
};

// Tabs as a keyboard user expects them: the arrows move through a service's
// packages (down and right forwards: the tabs are a column on wide screens
// and a row on phones), Home and End go to the first and the last.
const STEPS: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
const onTabKey = (event: KeyboardEvent, group: number, plan: number) => {
  const count = groups.value[group]?.plans.length ?? 0;
  if (count < 2) return;
  let next: number;
  if (event.key in STEPS) next = (plan + STEPS[event.key]! + count) % count;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = count - 1;
  else return;
  event.preventDefault();
  pick(group, next, true);
};

// The block that crosses the middle of the screen is the lit one.
let middle: IntersectionObserver | null = null;
onMounted(() => {
  middle = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const index = entry.isIntersecting ? groupEls.indexOf(entry.target as HTMLElement) : -1;
      if (index >= 0) active.value = index;
    }
  }, { rootMargin: "-50% 0px -50% 0px" });
  groupEls.forEach((el) => middle?.observe(el));
});
onBeforeUnmount(() => {
  middle?.disconnect();
  middle = null;
});
</script>

<template>
  <section v-if="groups.length" class="price-cards">
    <div
      v-for="(group, g) in groups"
      :key="group.key"
      :ref="setGroup(g)"
      class="price-group"
      :class="{ 'is-active': active === g }"
    >
      <header class="price-group__head">
        <h2 :id="titleId(g)" class="price-group__title price-title">{{ group.title }}</h2>
        <p v-if="group.description" class="price-group__text">{{ group.description }}</p>
      </header>

      <div class="price-group__body">
        <div class="price-group__side">
          <div class="price-tabs" role="tablist" aria-orientation="vertical" :aria-labelledby="titleId(g)">
            <button
              v-for="(plan, p) in group.plans"
              :id="tabId(g, p)"
              :key="plan.name"
              :ref="setTab(g, p)"
              type="button"
              role="tab"
              class="price-tab"
              :class="[`price-tone--${plan.tone}`, { 'is-selected': group.index === p, 'is-recommended': plan.recommended }]"
              :aria-selected="group.index === p"
              :aria-controls="panelId(g)"
              :tabindex="group.index === p ? 0 : -1"
              @click="pick(g, p)"
              @keydown="onTabKey($event, g, p)"
            >
              <span v-if="plan.recommended" class="price-tab__badge">{{ t("pricing.recommended") }}</span>
              <span class="price-tab__name">{{ plan.name }}</span>
              <span class="price-tab__arrow" aria-hidden="true">
                <svg viewBox="0 0 16 16" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
              </span>
            </button>
          </div>
        </div>

        <div
          :id="panelId(g)"
          class="price-card"
          :class="[`price-tone--${group.plan.tone}`, { 'is-active': active === g }]"
          role="tabpanel"
          :aria-labelledby="tabId(g, group.index)"
          @click="active = g"
          @focusin="active = g"
        >
          <span class="price-card__halo" aria-hidden="true" />
          <PriceCardLightning v-if="active === g" v-bind="LIGHTNING[group.plan.tone]" />

          <div :key="group.plan.name" class="price-card__head" :class="{ 'is-swapped': touched }">
            <div class="price-card__top">
              <h3 class="price-card__title">{{ group.plan.name }}</h3>
              <span v-if="group.plan.recommended" class="price-card__badge">{{ t("pricing.recommended") }}</span>
            </div>
            <p class="price-card__price" :class="{ 'has-was': group.discounted }">
              <span v-if="group.plan.unit.before" class="price-card__unit">{{ group.plan.unit.before }}</span>
              <span class="price-card__figure">
                <s v-if="group.plan.was" class="price-card__was"><span class="sr-only">{{ t("pricing.oldPrice") }} </span>{{ group.plan.was }}</s>
                <span class="price-card__amount">{{ group.plan.price }}</span>
              </span>
              <span v-if="group.plan.unit.after" class="price-card__unit">{{ group.plan.unit.after }}</span>
            </p>
          </div>
          <span class="price-card__rule" aria-hidden="true" />

          <ul v-if="group.items.length" class="price-card__items">
            <li v-for="(item, i) in group.items" :key="item" :class="{ 'is-off': i >= group.plan.covered, 'is-warning': group.warnings.includes(i) }">
              <!-- A warning triangle instead of the check on the items marked in utils/pricePlans.ts. -->
              <svg v-if="group.warnings.includes(i)" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.2 14.6 13.6H1.4L8 2.2Z" /><path d="M8 6.5v3.1M8 11.7v.01" /></svg>
              <svg v-else viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m13.33 4-7.33 7.33L2.66 8" /></svg>
              <span><span v-if="group.warnings.includes(i)" class="sr-only">{{ t("pricing.note") }}: </span>{{ item }}<span v-if="i >= group.plan.covered" class="sr-only"> ({{ t("pricing.notIncluded") }})</span></span>
            </li>
          </ul>

          <div class="price-card__foot">
            <NuxtLink :to="contactPath" class="price-card__cta">{{ t("pricing.startProject") }}</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* A service's block: its name and description across the top, under them its
   packages as a column of tabs on the left and the picked package's card
   (390px wide, as huly.io/pricing's plans) on the right. The block is as wide
   as the two and centred on the page; the blocks run one under another, with
   room for the lit card's glow between them. */
.price-cards {
  --card-w: 24.375rem;
  --card-r: 1.5rem;
  --side-w: 25rem;
  --group-gap: 3.5rem;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: clamp(7rem, calc(11 * var(--fvw)), 12rem);
  box-sizing: border-box;
  width: 100%;
  padding: 0 1.25rem;
  font-family: var(--app-font-sans);
}

.price-group {
  width: calc(var(--side-w) + var(--group-gap) + var(--card-w));
  max-width: 100%;
  margin: 0 auto;
}

.price-group__body {
  display: grid;
  grid-template-columns: var(--side-w) var(--card-w);
  gap: var(--group-gap);
  align-items: start;
}

@media (max-width: 1279px) {
  .price-cards {
    --card-w: 22.875rem;
  }
}

@media (max-width: 1023px) {
  .price-cards {
    --side-w: 17.5rem;
    --group-gap: 2rem;
  }
}

/* ---------- a package's colour: on its tab and, when picked, on the card ----------
   "r g b": the line, a paler one for borders, the white-hot core; then the
   inside of the lit card, and how strong its glow is (white light looks
   brighter than a colour at the same strength). */
.price-tone--white {
  --tone: 214 226 240;
  --tone-soft: 240 245 250;
  --tone-core: 255 255 255;
  --lit-top: rgb(50 54 60);
  --lit-bottom: rgb(15 16 18);
  --glow: 0.55;
}

.price-tone--green {
  --tone: 3 203 0;
  --tone-soft: 107 255 92;
  --tone-core: 201 255 191;
  --lit-top: rgb(13 52 19);
  --lit-bottom: rgb(8 18 10);
  --glow: 1;
}

.price-tone--gold {
  --tone: 245 180 50;
  --tone-soft: 255 214 120;
  --tone-core: 255 242 200;
  --lit-top: rgb(68 49 16);
  --lit-bottom: rgb(23 17 8);
  --glow: 1;
}

/* ---------- the service's name and description ---------- */
/* Above the glow of the card under it. */
.price-group__head {
  position: relative;
  z-index: 1;
  margin-bottom: clamp(1.5rem, calc(2.2 * var(--fvw)), 2.5rem);
}

/* The service's name: lit like "won't wait" (assets/css/price-title.css,
   .price-title); only its size is here. */
.price-group__title {
  font-size: clamp(2.75rem, calc(1.25rem + 4.6vw), 6.25rem);
}

.price-group__text {
  margin: 0.875rem 0 0;
  color: rgb(255 255 255 / 0.88);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
}

/* ---------- the packages ---------- */
/* Above the glow of the card beside it. The card is the taller of the two:
   the packages stay in view under the site header while it scrolls by. */
.price-group__side {
  position: sticky;
  top: 6.5rem;
  z-index: 1;
  min-width: 0;
}

/* The tabs stand on the page itself, each in its own outline; the room
   between them is also the recommended one's label's, which sits on its top
   border. A tab that is not picked is quiet: a faint outline and dimmed text.
   The picked one is lit in its package's colour (a fill, a glow, a beam going
   round its outline, an arrow), so it is plain at a glance which it is. */
.price-tabs {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.price-tab {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-sizing: border-box;
  width: 100%;
  min-height: 5rem;
  padding: 1.25rem 1.25rem 1.25rem 1.5rem;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 1rem;
  background: transparent;
  color: rgb(255 255 255 / 0.6);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.4s ease;
}

.price-tab:hover {
  border-color: rgb(var(--tone) / 0.5);
  background: rgb(var(--tone) / 0.06);
  color: #fff;
}

/* The recommended package's outline is plain to see: its label sits on it. */
.price-tab.is-recommended {
  border-color: rgb(var(--tone) / 0.4);
}

/* The picked package: lit from the left in its colour, with a glow and a beam
   running along its outline. */
.price-tab.is-selected {
  border-color: rgb(var(--tone-soft) / 0.7);
  background: linear-gradient(100deg, rgb(var(--tone) / 0.34), rgb(var(--tone) / 0.08) 75%);
  box-shadow: 0 0 1.25rem rgb(var(--tone) / 0.25);
  color: #fff;
  cursor: default;
}

/* "Recommended", on the green package's top border, by its left corner: the
   line runs into the label from both sides (its ground is the page's black). */
.price-tab__badge {
  position: absolute;
  top: 0;
  left: 1.25rem;
  z-index: 1;
  padding: 0.25rem 0.625rem;
  border: 1px solid rgb(var(--tone) / 0.55);
  border-radius: 62.4375rem;
  background: #000;
  color: rgb(var(--tone-soft));
  font-size: 0.6875rem;
  line-height: 1;
  letter-spacing: 0.08em;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
  transform: translateY(-50%);
}

/* The beam of the contact page's button (.site-guarantee hovered,
   assets/css/guarantee-pill.css): a conic gradient turned by that pill's own
   --guarantee-angle and masked to a ring the width of the border, with a
   blurred copy as its glow. It goes round the picked tab, in the package's
   colour. */
.price-tab::before,
.price-tab::after {
  position: absolute;
  inset: -1px;
  z-index: -1;
  padding: 0.078rem;
  border-radius: inherit;
  background: conic-gradient(from var(--guarantee-angle), transparent 0deg 240deg, rgb(var(--tone) / 0.15) 280deg, rgb(var(--tone)) 335deg, rgb(var(--tone-core)) 354deg, transparent 360deg);
  content: "";
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
}

.price-tab::after {
  padding: 0.156rem;
  filter: blur(0.1875rem);
}

.price-tab.is-selected::before {
  opacity: 1;
}

.price-tab.is-selected::after {
  opacity: 0.8;
}

@media (prefers-reduced-motion: no-preference) {
  .price-tab.is-selected {
    animation: guarantee-orbit 4.5s linear infinite;
  }
}

.price-tab__name {
  min-width: 0;
  font-size: 1.25rem;
  line-height: 1.25;
  letter-spacing: -0.02em;
  font-weight: 600;
}

/* The arrow marks the picked package, in its colour. */
.price-tab__arrow {
  display: grid;
  flex: none;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: rgb(var(--tone));
  color: rgb(11 13 16);
  opacity: 0;
  transform: translateX(-0.375rem);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.price-tab.is-selected .price-tab__arrow {
  opacity: 1;
  transform: none;
}

.price-tab__arrow svg {
  width: 0.9375rem;
  height: 0.9375rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* The gold package, picked, is lit the way the contact page's "Start
   something big" button is (.site-guarantee at rest, assets/css/guarantee-pill.css),
   in gold: liquid light that fills the tab and keeps flowing, dark text with a
   sheen running across it, two beams going round the outline in opposite
   directions, a glow that pulses. The light pours in from the left when the
   tab is picked (the pill's --guarantee-fill). Only the gold package has it. */
.price-tab.price-tone--gold {
  --guarantee-fill: 0%;
  background:
    linear-gradient(90deg, transparent calc(var(--guarantee-fill) - 14%), #000 var(--guarantee-fill)) 0 0 / 100% 100% no-repeat,
    linear-gradient(110deg, #e69b12 0%, #ffd870 22%, #a86a08 48%, #e69b12 70%, #ffd870 100%) 0% 50% / 300% 100% no-repeat,
    #000;
  /* The layers start at the border's outer edge, so the black shade covers the
     border's 1px too: from the padding box the gold ran out past the right
     edge and showed through the border as a yellow line. */
  background-origin: border-box;
  transition: --guarantee-fill 0.9s cubic-bezier(0.45, 0, 0.2, 1), border-color 0.6s ease, color 0.4s ease, box-shadow 0.6s ease;
}

.price-tab.price-tone--gold.is-selected {
  --guarantee-fill: 114%;
  border-color: rgb(var(--tone));
  box-shadow: 0 0 0.875rem rgb(var(--tone) / 0.4);
  color: #2b1a00;
}

.price-tab.price-tone--gold.is-selected::before,
.price-tab.price-tone--gold.is-selected::after {
  background:
    conic-gradient(from var(--guarantee-angle), transparent 0deg 240deg, rgb(var(--tone) / 0.15) 280deg, rgb(var(--tone)) 335deg, rgb(var(--tone-core)) 354deg, transparent 360deg),
    conic-gradient(from var(--guarantee-back), transparent 0deg, rgb(255 250 235) 4deg, rgb(var(--tone-soft)) 14deg, rgb(var(--tone) / 0.55) 42deg, transparent 110deg 360deg);
}

/* On the lit gold the arrow is dark, with the gold in it. */
.price-tab.price-tone--gold.is-selected .price-tab__arrow {
  background: #2b1a00;
  color: rgb(var(--tone-soft));
}

@media (prefers-reduced-motion: no-preference) {
  .price-tab.price-tone--gold.is-selected {
    animation:
      guarantee-orbit 4.5s linear infinite,
      guarantee-reverse 2.4s linear infinite,
      price-tab-charge 1.6s ease-in-out 0.5s infinite,
      guarantee-flow 3.2s ease-in-out infinite alternate;
  }

  .price-tab.price-tone--gold.is-selected .price-tab__name {
    background: linear-gradient(100deg, #2b1a00 36%, #fff3cf 46%, #fff 50%, #fff3cf 54%, #2b1a00 64%) 0 0 / 250% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: guarantee-shine 1.6s linear 0.7s infinite;
  }
}

/* Light from within: a white inner glow and the gold halo pulse together. */
@keyframes price-tab-charge {
  0%, 100% { box-shadow: 0 0 0.875rem rgb(245 180 50 / 0.4), inset 0 0 0.25rem rgb(255 255 255 / 0.25); }
  50% { box-shadow: 0 0 1.75rem rgb(245 180 50 / 0.7), inset 0 0 0.625rem rgb(255 255 255 / 0.55); }
}

/* ---------- card ---------- */
.price-card {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: var(--card-w);
  max-width: 100%;
  padding: 1.75rem 1.75rem 1.5625rem;
  border: 1px solid rgb(255 255 255 / 0.05);
  border-radius: var(--card-r);
  background: rgb(14 16 18 / 0.88);
  box-shadow: 0.25rem 0.375rem 1.5625rem rgb(0 0 0 / 0.56);
  color: #fff;
  font-family: var(--app-font-sans);
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
   faint haze (a radial gradient). All of it fades out within 8rem of the card. */
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
  opacity: var(--glow, 1);
}

/* ---------- content ---------- */
/* A newly picked package's name and price rise into place. */
.price-card__head.is-swapped {
  animation: price-swap 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes price-swap {
  from {
    opacity: 0;
    transform: translateY(0.375rem);
  }
}

/* The package's name on the left; on the recommended one its label on the right. */
.price-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.price-card__title {
  margin: 0;
  min-width: 0;
  font-size: 1.25rem;
  line-height: 1.375;
  letter-spacing: -0.04em;
  font-weight: 600;
}

/* The same label as on the package's tab, in the package's colour. */
.price-card__badge {
  flex: none;
  padding: 0.25rem 0.625rem;
  border: 1px solid rgb(var(--tone) / 0.55);
  border-radius: 62.4375rem;
  background: rgb(var(--tone) / 0.1);
  color: rgb(var(--tone-soft));
  font-size: 0.6875rem;
  line-height: 1;
  letter-spacing: 0.08em;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
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

/* A discounted package's full price: small and crossed out, like a
   superscript at the upper right of the price. It hangs over the line (the
   price's own line box has that much air above the digits), so "from" keeps
   the price's baseline; the service's cards make room for it under the name. */
.price-card__figure {
  position: relative;
  display: inline-block;
}

.price-card__was {
  position: absolute;
  bottom: calc(100% - 0.5rem);
  left: 100%;
  margin-left: 0.375rem;
  color: rgb(201 203 207 / 0.6);
  font-size: 1.25rem;
  line-height: 1;
  letter-spacing: -0.03em;
  font-weight: 500;
  white-space: nowrap;
  text-decoration: line-through;
  text-decoration-thickness: 0.0625rem;
}

.price-card__price.has-was {
  margin-top: 1.75rem;
}

.price-card__unit {
  color: rgb(201 203 207);
  font-size: 1.25rem;
  letter-spacing: -0.04em;
  font-weight: 500;
}

.price-card__rule {
  display: block;
  height: 1px;
  margin-top: 1.125rem;
  background: rgb(255 255 255 / 0.1);
}

/* Ten short lines: each item is written to fit on one line of the card in
   every language (app/content/pricing/<locale>.json): the longest, a Russian
   one, leaves about 1rem to spare on the narrower card and on a 360px phone. */
.price-card__items {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
}

.price-card__items li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: rgb(255 255 255 / 0.9);
  font-size: 1rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 500;
  transition: color 0.25s ease;
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
  transition: stroke 0.25s ease;
}

/* What the picked package does not cover stays in the list, dimmed. */
.price-card__items li.is-off {
  color: rgb(255 255 255 / 0.34);
}

.price-card__items li.is-off svg {
  stroke: rgb(255 255 255 / 0.34);
}

/* A warning mark instead of the check: amber, so it reads as a note. */
.price-card__items li.is-warning svg {
  stroke: rgb(255 196 87);
}

.price-card__items li.is-warning.is-off svg {
  stroke: rgb(255 196 87 / 0.4);
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

/* Phones: the packages become a row above the card (it scrolls sideways when
   they do not fit), the card takes the column's width. */
@media (max-width: 767px) {
  .price-cards {
    --card-w: 22.875rem;
    gap: 5.5rem;
  }

  .price-group {
    width: 100%;
    max-width: var(--card-w);
  }

  .price-group__body {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }

  .price-group__text {
    margin-top: 0.75rem;
    font-size: var(--type-small-size);
    line-height: var(--type-small-lh);
  }

  .price-group__side {
    position: relative;
    top: auto;
  }

  /* A scrolling row cuts what sticks out of it: the padding is the room the
     recommended label and the beam's glow need above and beside the tabs. */
  .price-tabs {
    flex-direction: row;
    gap: 0.5rem;
    margin: 0 -0.25rem;
    padding: 0.75rem 0.25rem 0.25rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }

  .price-tabs::-webkit-scrollbar {
    display: none;
  }

  .price-tab {
    flex: 1 0 auto;
    justify-content: center;
    width: auto;
    min-width: 7.5rem;
    min-height: 3.25rem;
    padding: 0.75rem 1rem;
    border-radius: 0.875rem;
    scroll-snap-align: start;
  }

  .price-tab__name {
    font-size: 1rem;
  }

  .price-tab__badge {
    left: 0.625rem;
    padding: 0.1875rem 0.5rem;
    font-size: 0.625rem;
  }

  .price-tab__arrow {
    display: none;
  }

  .price-card {
    width: 100%;
    padding: 1.125rem;
  }

  .price-card__title,
  .price-card__unit {
    font-size: 1rem;
  }

  .price-card__amount {
    font-size: 2.25rem;
  }

  .price-card__was {
    bottom: calc(100% - 0.375rem);
    margin-left: 0.25rem;
    font-size: 1rem;
  }

  .price-card__badge {
    padding: 0.1875rem 0.5rem;
    font-size: 0.625rem;
  }

  .price-card__price.has-was {
    margin-top: 1.375rem;
  }

  .price-card__items li {
    font-size: 0.875rem;
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
  .price-tab,
  .price-tab::before,
  .price-tab::after,
  .price-tab__arrow,
  .price-card,
  .price-card__halo,
  .price-card__cta,
  .price-card__items li,
  .price-card__items svg {
    transition: none;
  }

  /* No beam going round: the picked tab keeps its quiet border. */
  .price-tab::before,
  .price-tab::after {
    display: none;
  }

  .price-card__head.is-swapped {
    animation: none;
  }
}
</style>
