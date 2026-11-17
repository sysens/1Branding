<script setup lang="ts">
// "Your market won't wait. Neither will we.": the offer in a lit box, the
// terms under it and the way to the contact page.
//
// The box is lit the way /pricing's green card is when picked
// (costs/PricingCards.vue, .price-card.is-active in the green tone): a soft
// green hairline, a dark green ground lit from within, a glow round it (close
// and bright, then a wide faint haze), and that card's own lightning running
// round the edge (PriceCardLightning, in the same green).
import { Check } from "lucide-vue-next";
import { computed } from "vue";
import PriceCardLightning from "~/components/costs/PriceCardLightning.vue";

const { t, tm, rt } = useI18n();
const localePath = useLocalePath();

const items = computed(() => (tm("oneGuarantee.market.items") as unknown[]).map((item) => (typeof item === "string" ? item : rt(item as never))));
// Two columns of five, as designed.
const columns = computed(() => {
  const half = Math.ceil(items.value.length / 2);
  return [items.value.slice(0, half), items.value.slice(half)];
});

// The lightning's colours, as on the green price card (PricingCards.vue,
// LIGHTNING.green): the line, its pale core and the sparks, as "r g b".
const LIGHTNING = { tone: "3 203 0", core: "201 255 191", spark: "125 255 107", sparks: 10 };
</script>

<template>
  <section class="og-deadline">
    <h2 v-blur-reveal class="og-deadline__title type-h1">
      <span>{{ t("oneGuarantee.market.line1") }}</span>
      {{ " " }}
      <span class="og-grad">{{ t("oneGuarantee.market.line2") }}</span>
    </h2>
    <p v-rise class="og-deadline__note type-h5">
      <span class="og-deadline__note-accent">{{ t("oneGuarantee.market.noteAccent") }}</span>
      {{ t("oneGuarantee.market.note") }}
    </p>

    <div v-rise class="og-offer">
      <span class="og-offer__halo" aria-hidden="true" />

      <div class="og-offer__panel">
        <!-- Drawn round its parent, behind it: the panel. -->
        <PriceCardLightning v-bind="LIGHTNING" />
        <div class="og-offer__top">
          <h3 class="og-offer__title type-h4">
            {{ t("oneGuarantee.market.boxTitle") }}
            <span class="og-offer__title-accent">{{ t("oneGuarantee.market.boxTitleAccent") }}</span>
          </h3>
          <ul v-for="(column, index) in columns" :key="index" class="og-offer__list type-small">
            <li v-for="item in column" :key="item">
              <Check class="og-offer__check" aria-hidden="true" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
        <p class="og-offer__text type-lead">
          <span class="og-offer__text-muted">{{ t("oneGuarantee.market.textMuted") }}</span>
          {{ t("oneGuarantee.market.text") }}
        </p>
      </div>
    </div>

    <p v-rise class="og-deadline__terms type-h5">{{ t("oneGuarantee.market.terms") }}</p>
    <p v-rise class="og-deadline__action">
      <NuxtLink :to="localePath('/contact')" class="ob-button og-button">{{ t("oneGuarantee.market.cta") }}</NuxtLink>
    </p>
  </section>
</template>

<style scoped>
/* The design at 1440px: the box 1077px wide. Type is the site's scale: the
   heading h1, its note and the terms h5, the box's title h4, its list the
   small step (600), its text the lead step. */
.og-deadline {
  position: relative;
  padding: clamp(4rem, 9 * var(--fvw), 11rem) 1.25rem clamp(5rem, 12 * var(--fvw), 14rem);
  background: #000;
  text-align: center;
}

.og-deadline__title {
  margin: 0;
}

.og-deadline__title > span {
  display: block;
  padding-bottom: 0.04em;
  text-wrap: balance;
}

.og-deadline__note {
  max-width: 44em;
  margin: clamp(0.6rem, 1 * var(--fvw), 1.2rem) auto 0;
  text-wrap: balance;
}

.og-deadline__note-accent {
  color: #1fd13f;
}

/* ---------- the box ---------- */
/* The colours and the measures of the lit green price card
   (costs/PricingCards.vue: .price-tone--green, .price-card.is-active,
   .price-card__halo), so the two boxes are lit alike. isolation: the glow and
   the lightning are behind the panel, and over the section's black. */
.og-offer {
  --tone: 3 203 0;
  --tone-soft: 107 255 92;
  --radius: 1.5rem;
  position: relative;
  isolation: isolate;
  width: min(100%, 75 * var(--fvw));
  min-width: min(100%, 20rem);
  margin: clamp(2.5rem, 4.6 * var(--fvw), 5.5rem) auto 0;
  text-align: left;
}

/* The glow round the box: close and bright (shadows), then a wide faint haze
   (a radial gradient). */
.og-offer__halo {
  position: absolute;
  inset: -0.5rem;
  /* Under the lightning (-1). */
  z-index: -2;
  border-radius: calc(var(--radius) + 0.5rem);
  box-shadow:
    0 0 2.5rem 0.25rem rgb(var(--tone) / 0.5),
    0 0 5rem 1rem rgb(var(--tone) / 0.28);
  pointer-events: none;
}

.og-offer__halo::after {
  position: absolute;
  inset: -7.5rem -9rem;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgb(var(--tone) / 0.16), rgb(var(--tone) / 0.07) 60%, rgb(var(--tone) / 0));
  content: "";
}

/* The panel: a soft green hairline, a dark green ground lit from its upper
   left and its lower right corner, a glow inside the edge. */
.og-offer__panel {
  position: relative;
  padding: clamp(1.75rem, 4 * var(--fvw), 4.75rem) clamp(1.5rem, 4.6 * var(--fvw), 5.5rem) clamp(1.75rem, 3.8 * var(--fvw), 4.5rem);
  border: 1px solid rgb(var(--tone-soft) / 0.55);
  border-radius: var(--radius);
  background:
    radial-gradient(70% 45% at 100% 100%, rgb(var(--tone) / 0.14), rgb(var(--tone) / 0) 100%),
    linear-gradient(160deg, rgb(13 52 19) 0%, rgb(8 18 10) 62%);
  box-shadow: inset 0 0 1.25rem rgb(var(--tone) / 0.16);
}

.og-offer__top {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(1.25rem, 2.6 * var(--fvw), 3rem);
  align-items: start;
}

.og-offer__title {
  margin: 0;
}

.og-offer__title-accent {
  color: #1fd13f;
}

.og-offer__list {
  display: grid;
  gap: 0.45em;
  margin: 0.2em 0 0;
  padding: 0;
  font-weight: 600;
  list-style: none;
}

.og-offer__list li {
  display: flex;
  gap: 0.6em;
  align-items: flex-start;
}

.og-offer__check {
  flex: none;
  width: 1.15em;
  height: 1.15em;
  margin-top: 0.15em;
  color: #19f03a;
  stroke-width: 4;
}

.og-offer__text {
  max-width: 46em;
  margin: clamp(1.25rem, 2.3 * var(--fvw), 2.75rem) 0 0;
}

.og-offer__text-muted {
  color: rgb(255 255 255 / 0.52);
}

.og-deadline__terms {
  max-width: 42em;
  margin: clamp(2rem, 3.6 * var(--fvw), 4.25rem) auto 0;
  text-wrap: balance;
}

.og-deadline__action {
  display: flex;
  justify-content: center;
  margin: clamp(1.25rem, 2.2 * var(--fvw), 2.6rem) 0 0;
}

/* Tablets and phones: the title over the two lists, then one list. */
@media (max-width: 1023px) {
  .og-offer__top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .og-offer__title {
    grid-column: 1 / -1;
  }
}

@media (max-width: 599px) {
  .og-offer__top {
    grid-template-columns: 1fr;
    gap: 0.5em;
  }

  .og-offer__title {
    margin-bottom: 0.75rem;
  }
}
</style>
