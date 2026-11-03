<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { toSiteLocale } from "~/utils/locales";
import { servicePath } from "~/utils/servicePages";

// The grid view's "Every detail. One standard.": the 30 chapters of a
// OneBranding brandbook as a numbered list. A row lights up under the
// pointer; clicking it opens it (one at a time): a green bar on its left, its
// number green, its line set in a green plate ("Colour specifications" also
// shows the brand's three colours) and the plus turned to a minus. Under the
// list, the way to the brandbook service and to the prices.

const { t, tm, rt, locale } = useI18n();
const localePath = useLocalePath();
const siteLocale = computed(() => toSiteLocale(locale.value));
const baseId = useId();

const items = computed(() => (tm("projectsPage.brandbook.items") as Array<{ title: unknown; text: unknown }>).map((item, index) => ({
  number: String(index + 1).padStart(2, "0"),
  title: rt(item.title as never),
  text: rt(item.text as never),
})));
// Chapter 14, "Colour specifications", shows the identity's colours.
const SWATCH_ROW = 13;
const SWATCHES = ["#0ccc3c", "#000000", "#ffffff"];

const open = ref<number | null>(null);
const toggle = (index: number) => {
  open.value = open.value === index ? null : index;
};
</script>

<template>
  <section class="brandbook-index" :aria-labelledby="`${baseId}-title`">
    <div class="brandbook-index__column">
      <header class="brandbook-index__head">
        <h2 :id="`${baseId}-title`" v-blur-reveal class="brandbook-index__title">
          <span>{{ t("projectsPage.brandbook.title") }}</span>
          <span class="brandbook-index__accent">{{ t("projectsPage.brandbook.accent") }}</span>
        </h2>
        <p v-rise class="brandbook-index__intro">{{ t("projectsPage.brandbook.intro") }}</p>
      </header>
      <p class="brandbook-index__eyebrow">{{ t("projectsPage.brandbook.eyebrow") }}</p>

      <ol class="brandbook-index__list">
        <li v-for="(item, index) in items" :key="item.number" class="brandbook-index__item" :class="{ 'is-open': open === index }">
          <button
            type="button"
            class="brandbook-index__row"
            :aria-expanded="open === index"
            :aria-controls="`${baseId}-${index}`"
            @click="toggle(index)"
          >
            <span class="brandbook-index__number" aria-hidden="true">{{ item.number }}</span>
            <span class="brandbook-index__name">{{ item.title }}</span>
            <span :id="`${baseId}-${index}`" class="brandbook-index__text">
              <span class="brandbook-index__plate">
                <span>{{ item.text }}</span>
                <span v-if="index === SWATCH_ROW" class="brandbook-index__swatches" aria-hidden="true">
                  <span v-for="colour in SWATCHES" :key="colour" class="brandbook-index__swatch" :style="{ background: colour }" />
                </span>
              </span>
            </span>
            <span class="brandbook-index__sign" aria-hidden="true" />
          </button>
        </li>
      </ol>

      <div class="brandbook-index__foot">
        <p>{{ t("projectsPage.brandbook.foot") }}</p>
        <NuxtLink :to="servicePath('brandbook', siteLocale)" class="brandbook-index__more">
          {{ t("projectsPage.brandbook.more") }}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" /></svg>
        </NuxtLink>
      </div>
    </div>

    <div class="brandbook-index__cta">
      <NuxtLink v-rise :to="localePath('/pricing')" class="ob-button brandbook-index__pricing">{{ t("projectsPage.brandbook.pricing") }}</NuxtLink>
      <p v-rise>{{ t("projectsPage.brandbook.pricingLine") }}</p>
    </div>
  </section>
</template>

<style scoped>
/* The design at 1440px: an 80% column; the heading 90px, the rows 54px tall
   (number 26px, chapter 24px, line 17px), an open row 86px. */
.brandbook-index {
  --green: #20e848;
  padding-block: clamp(4rem, 7vw, 6.5rem) clamp(5rem, 9vw, 8rem);
  background: #000;
  color: #fff;
}

.brandbook-index__column {
  width: min(100% - 2.5rem, 80 * var(--fvw));
  margin-inline: auto;
}

.brandbook-index__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.5rem 3rem;
}

.brandbook-index__title {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(3rem, 6.25vw, 5.65rem);
  font-weight: 700;
  line-height: 0.92;
  letter-spacing: -0.045em;
}

.brandbook-index__title > span {
  display: block;
}

.brandbook-index__accent {
  background: linear-gradient(90deg, #14c93f, var(--green) 60%, #1fd544);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.brandbook-index__intro {
  max-width: 24em;
  margin: 0.2em 0 0;
  color: rgb(255 255 255 / 0.78);
  font-family: var(--app-font-sans);
  font-size: clamp(1rem, 1.5vw, 1.375rem);
  line-height: 1.5;
}

.brandbook-index__eyebrow {
  margin: clamp(1.25rem, 2.2vw, 2rem) 0 clamp(1.5rem, 2.6vw, 2.25rem);
  color: rgb(255 255 255 / 0.55);
  font-family: var(--app-font-sans);
  font-size: clamp(0.75rem, 0.95vw, 0.875rem);
  font-weight: 600;
  letter-spacing: 0.42em;
  text-transform: uppercase;
}

.brandbook-index__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.brandbook-index__item {
  position: relative;
  border-bottom: 1px solid rgb(255 255 255 / 0.14);
}

/* The green bar left of an open row, just outside it. */
.brandbook-index__item::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -0.65rem;
  width: 0.25rem;
  background: var(--green);
  content: "";
  opacity: 0;
  transition: opacity 0.25s ease;
}

.brandbook-index__item.is-open::before {
  opacity: 1;
}

.brandbook-index__row {
  display: grid;
  grid-template-columns: 7.8% 42.2% minmax(0, 1fr) 2.5rem;
  align-items: center;
  width: 100%;
  min-height: clamp(3rem, 3.75vw, 3.4rem);
  padding: 0 0 0 0.5rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.25s ease, min-height 0.35s ease;
}

.brandbook-index__row:hover,
.brandbook-index__item.is-open .brandbook-index__row {
  background: rgb(255 255 255 / 0.07);
}

.brandbook-index__item.is-open .brandbook-index__row {
  min-height: clamp(4.25rem, 6vw, 5.4rem);
}

.brandbook-index__row:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -2px;
}

.brandbook-index__number {
  color: rgb(255 255 255 / 0.62);
  font-family: var(--app-font-display);
  font-size: clamp(1.125rem, 1.8vw, 1.65rem);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  transition: color 0.25s ease;
}

.brandbook-index__item.is-open .brandbook-index__number {
  color: var(--green);
}

.brandbook-index__name {
  padding-right: 1rem;
  font-family: var(--app-font-display);
  font-size: clamp(1.0625rem, 1.7vw, 1.55rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.brandbook-index__text {
  color: rgb(255 255 255 / 0.66);
  font-family: var(--app-font-sans);
  font-size: clamp(0.875rem, 1.2vw, 1.1rem);
  line-height: 1.35;
}

/* Closed, the line is plain text; open, it sits in the green plate. */
.brandbook-index__plate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0;
  border-radius: 0.4rem;
  transition: background-color 0.3s ease, color 0.3s ease, padding 0.3s ease;
}

.brandbook-index__item.is-open .brandbook-index__plate {
  min-height: clamp(2.75rem, 4.5vw, 4.05rem);
  padding: 0.5rem clamp(0.75rem, 1.6vw, 1.5rem);
  background: linear-gradient(100deg, #12c93d, #22ec4e);
  color: #000;
  font-weight: 600;
}

.brandbook-index__swatches {
  display: flex;
  flex: none;
  gap: 0.5rem;
}

.brandbook-index__swatch {
  width: clamp(1.5rem, 2.4vw, 2.2rem);
  aspect-ratio: 1;
  border: 1.5px solid rgb(0 0 0 / 0.35);
  border-radius: 0.375rem;
}

/* The plus, its upright stroke folding away to a minus when open. */
.brandbook-index__sign {
  position: relative;
  justify-self: center;
  width: 1rem;
  height: 1rem;
}

.brandbook-index__sign::before,
.brandbook-index__sign::after {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  margin-top: -1px;
  background: #fff;
  content: "";
  transition: transform 0.3s ease;
}

.brandbook-index__sign::after {
  transform: rotate(90deg);
}

.brandbook-index__item.is-open .brandbook-index__sign::after {
  transform: rotate(0deg);
}

/* "ONE VISION. EVERY APPLICATION." and the way to the service. */
.brandbook-index__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: clamp(3rem, 5vw, 4.5rem);
  padding: clamp(1.5rem, 2.5vw, 2.25rem) 0.5rem 0;
  border-top: 1px solid rgb(255 255 255 / 0.14);
}

.brandbook-index__foot p {
  margin: 0;
  color: rgb(255 255 255 / 0.62);
  font-family: var(--app-font-sans);
  font-size: clamp(0.75rem, 1.05vw, 0.95rem);
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
}

.brandbook-index__more {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  color: var(--green);
  font-family: var(--app-font-display);
  font-size: clamp(1.0625rem, 1.4vw, 1.3rem);
  font-weight: 600;
  text-decoration: none;
}

.brandbook-index__more svg {
  width: 1em;
  height: 1em;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
  transition: transform 0.25s ease;
}

.brandbook-index__more:hover svg {
  transform: translate(0.12em, -0.12em);
}

/* "Pricing" and the line under it, as the packaging wall's "Projects". */
.brandbook-index__cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin-top: clamp(4rem, 8vw, 7.5rem);
  padding-inline: 1.25rem;
  text-align: center;
}

.brandbook-index__pricing {
  --button-h: clamp(3.25rem, 4.4vw, 3.95rem);
  --button-pad: clamp(1.75rem, 2.6vw, 2.4rem);
  --button-font: clamp(1.25rem, 2vw, 1.8rem);
  background: linear-gradient(100deg, #11b237 0%, #1fd544 55%, var(--green) 100%);
  color: #000;
  text-shadow: none;
}

/* The shared button's drifting dark light would sit under the black type. */
.brandbook-index__pricing::before {
  display: none;
}

.brandbook-index__cta p {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(1.125rem, 1.7vw, 1.55rem);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

/* Phones: the line goes under the chapter's name. */
@media (max-width: 767px) {
  .brandbook-index__column {
    width: calc(100% - 2.5rem);
  }

  .brandbook-index__row {
    grid-template-columns: 2.75rem minmax(0, 1fr) 2rem;
    padding-block: 0.85rem;
  }

  .brandbook-index__number {
    grid-row: span 2;
    align-self: start;
  }

  .brandbook-index__name {
    grid-column: 2;
  }

  .brandbook-index__text {
    grid-column: 2;
    margin-top: 0.3rem;
  }

  .brandbook-index__sign {
    grid-column: 3;
    grid-row: 1;
  }
}
</style>
