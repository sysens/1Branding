<script setup lang="ts">
import { computed, ref } from "vue";
import RisingLines from "~/components/ui/RisingLines.vue";
import { toggleDetails } from "~/utils/smoothDetails";

/**
 * The terms under the price list: the heading "Before we begin. Pricing &
 * project terms." over lines of light rising from a glowing horizon, and an
 * accordion of seven short answers (i18n pricing.terms), in the look
 * of ReUI's single-expand accordion (reui.io/components/accordion: a chevron
 * before each title, the answer in muted text under it, hairlines between the
 * rows, the first open on load), dressed for the dark page. ReUI's is
 * React/shadcn; this is the site's own <details>, slid open and closed by
 * toggleDetails, so the answers are in the HTML for search engines and it
 * works without JavaScript.
 */
const { t, tm } = useI18n();
const items = computed(() => (tm("pricing.terms.items") as unknown[]).map((_, index) => index));

const list = ref<HTMLElement | null>(null);
// One answer open at a time: opening one closes the open one through its own
// summary, so that one slides shut as this one slides open.
const toggle = (event: MouseEvent) => {
  const details = (event.currentTarget as HTMLElement).parentElement as HTMLDetailsElement | null;
  if (details && (!details.open || details.classList.contains("is-closing"))) {
    list.value?.querySelectorAll<HTMLDetailsElement>("details[open]:not(.is-closing)").forEach((other) => {
      if (other !== details) other.querySelector<HTMLElement>("summary")?.click();
    });
  }
  toggleDetails(event);
};
</script>

<template>
  <section class="price-terms" aria-labelledby="price-terms-title">
    <!-- The heading over lines of light rising from a glowing horizon
         (components/ui/RisingLines.vue), set up as in the design: Classic,
         tail #00ff7d, line #8effab, density 0.42, speed 0.16, horizon -0.27
         with glow 1.81, depth 0.08, spread 0.9, updraft 0.53, particles
         1.71, interactive, intro; the background is the page's black, not
         the design's #0a0a0a, so the block has no edge. -->
    <div class="price-terms__hero">
      <RisingLines
        class="price-terms__lines"
        :colors="['#00ff7d', '#8effab']"
        background-color="#000000"
        :density="0.42"
        :speed="0.16"
        :line-width="1"
        :line-length="1"
        :horizon-height="-0.27"
        :horizon-glow="1.81"
        :depth="0.08"
        :spread="0.9"
        :updraft="0.53"
        :particles="1.71"
        interactive
        intro
        :paused="false"
        :dpr="1.5"
      />
      <header class="price-terms__head">
        <h2 id="price-terms-title" class="price-terms__title price-title">{{ t("pricing.terms.title") }}</h2>
        <p class="price-terms__eyebrow">{{ t("pricing.terms.eyebrow") }}</p>
      </header>
    </div>

    <div class="price-terms__inner">
      <div ref="list" class="price-terms__list">
        <details v-for="index in items" :key="index" :open="index === 0" class="price-terms__item">
          <summary @click="toggle">
            <svg class="price-terms__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4" /></svg>
            <h3>{{ t(`pricing.terms.items.${index}.q`) }}</h3>
          </summary>
          <div class="price-terms__answer"><p>{{ t(`pricing.terms.items.${index}.a`) }}</p></div>
        </details>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* The accordion is as wide as a service's block (the packages and the card),
   at every width; the heading above it runs the whole width of the page. */
.price-terms {
  --card-w: 24.375rem;
  --side-w: 25rem;
  --group-gap: 3.5rem;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
  margin-top: clamp(3rem, calc(5 * var(--fvw)), 6rem);
  font-family: var(--app-font-sans);
}

@media (max-width: 1279px) {
  .price-terms {
    --card-w: 22.875rem;
  }
}

@media (max-width: 1023px) {
  .price-terms {
    --side-w: 17.5rem;
    --group-gap: 2rem;
  }
}

.price-terms__inner {
  width: calc(var(--side-w) + var(--group-gap) + var(--card-w));
  max-width: calc(100% - 2.5rem);
  margin: 0 auto;
}

@media (max-width: 767px) {
  .price-terms {
    --card-w: 22.875rem;
  }

  .price-terms__inner {
    width: 100%;
    max-width: min(var(--card-w), calc(100% - 2.5rem));
  }
}

/* The heading: centred over the lines, a little below the middle, the
   horizon (at 78% of the height) under it. */
.price-terms__hero {
  position: relative;
  width: 100%;
  height: clamp(25rem, 48vw, 42rem);
}

/* The lines melt into the page at the top and the bottom. */
.price-terms__lines {
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 16%, #000 82%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 16%, #000 82%, transparent 100%);
}

.price-terms__head {
  position: absolute;
  top: 61%;
  right: 0;
  left: 0;
  box-sizing: border-box;
  padding: 0 1.25rem;
  text-align: center;
  transform: translateY(-50%);
}

.price-terms__title {
  margin-inline: auto;
  font-size: clamp(2.25rem, calc(1rem + 4.6vw), 5.75rem);
  letter-spacing: -0.015em;
  text-transform: uppercase;
}

.price-terms__eyebrow {
  margin: 0.875rem 0 0;
  color: #fff;
  font-size: clamp(1rem, calc(0.9rem + 0.5vw), 1.375rem);
  line-height: 1.3;
  letter-spacing: -0.01em;
  font-weight: 500;
}

/* The rows: hairlines between them, none above the first or under the last. */
.price-terms__item + .price-terms__item {
  border-top: 1px solid rgb(255 255 255 / 0.12);
}

.price-terms__item summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.125rem 0;
  list-style: none;
  cursor: pointer;
}

.price-terms__item summary::-webkit-details-marker {
  display: none;
}

.price-terms__item h3 {
  margin: 0;
  color: #fff;
  font-size: var(--type-small-size);
  line-height: 1.35;
  letter-spacing: 0.04em;
  font-weight: 500;
  text-transform: uppercase;
  transition: color 0.2s ease;
}

.price-terms__item summary:hover h3 {
  color: rgb(255 255 255 / 0.78);
}

/* A chevron that points down when the answer is open and turns to the side
   when it is shut (it turns back at once while the answer is closing). */
.price-terms__chevron {
  flex: none;
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: rgb(255 255 255 / 0.6);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(-90deg);
  transition: transform 0.3s ease;
}

.price-terms__item[open]:not(.is-closing) .price-terms__chevron {
  transform: none;
}

/* The box that slides (utils/smoothDetails.ts): it clips the answer while its
   height eases. */
.price-terms__answer {
  overflow: hidden;
}

/* The answer is under the title, not under the chevron. */
.price-terms__item p {
  max-width: 44em;
  margin: 0;
  padding: 0 0 1.5rem 1.75rem;
  color: #a3a6aa;
  font-size: var(--type-small-size);
  line-height: 1.6;
  letter-spacing: var(--type-small-ls);
}

@media (prefers-reduced-motion: reduce) {
  .price-terms__chevron,
  .price-terms__item h3 {
    transition: none;
  }
}
</style>
