<script setup lang="ts">
// "Your market won't wait. Neither will we.": the offer in a box with a live
// neon outline, the terms under it and the way to the contact page.
//
// The outline is a lit ring (border + glow, breathing) with a second, fine
// ring over it that an SVG turbulence filter keeps tearing into small arcs,
// like current jumping along a tube. The fine ring is left out on phones and
// with reduced motion (a full-width filter redrawn several times a second is
// work a phone need not do).
import { Check } from "lucide-vue-next";
import { computed } from "vue";

const { t, tm, rt } = useI18n();
const localePath = useLocalePath();

const items = computed(() => (tm("oneGuarantee.market.items") as unknown[]).map((item) => (typeof item === "string" ? item : rt(item as never))));
// Two columns of five, as designed.
const columns = computed(() => {
  const half = Math.ceil(items.value.length / 2);
  return [items.value.slice(0, half), items.value.slice(half)];
});
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

    <div v-rise class="og-neon">
      <svg class="og-neon__defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="og-neon-current" x="-5%" y="-15%" width="110%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.07" numOctaves="2" seed="3" result="noise">
            <animate attributeName="seed" values="1;9;4;12;7;2;10;5" dur="1.1s" calcMode="discrete" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <span class="og-neon__ring" aria-hidden="true" />
      <span class="og-neon__current" aria-hidden="true" />

      <div class="og-neon__body">
        <div class="og-neon__top">
          <h3 class="og-neon__title type-h4">
            {{ t("oneGuarantee.market.boxTitle") }}
            <span class="og-neon__title-accent">{{ t("oneGuarantee.market.boxTitleAccent") }}</span>
          </h3>
          <ul v-for="(column, index) in columns" :key="index" class="og-neon__list type-small">
            <li v-for="item in column" :key="item">
              <Check class="og-neon__check" aria-hidden="true" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
        <p class="og-neon__text type-lead">
          <span class="og-neon__text-muted">{{ t("oneGuarantee.market.textMuted") }}</span>
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
/* The design at 1440px: the box 1077px wide with a 4px lit outline. Type is
   the site's scale: the heading h1, its note and the terms h5, the box's
   title h4, its list the small step (600), its text the lead step. */
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
.og-neon {
  --radius: clamp(1.25rem, 2 * var(--fvw), 2.2rem);
  position: relative;
  width: min(100%, 75 * var(--fvw));
  min-width: min(100%, 20rem);
  margin: clamp(2.5rem, 4.6 * var(--fvw), 5.5rem) auto 0;
  border-radius: var(--radius);
  text-align: left;
}

.og-neon__defs {
  position: absolute;
}

.og-neon__ring,
.og-neon__current {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.og-neon__ring {
  border: 0.2rem solid #45ff62;
  box-shadow:
    0 0 0.45rem #2bff4b,
    0 0 1.5rem rgb(20 255 60 / 0.85),
    0 0 4.25rem rgb(0 255 40 / 0.45),
    inset 0 0 0.45rem #2bff4b,
    inset 0 0 1.4rem rgb(20 255 60 / 0.55);
  animation: og-neon-breathe 3.4s ease-in-out infinite;
}

.og-neon__current {
  inset: -0.25rem;
  border: 1px solid rgb(190 255 200 / 0.85);
  filter: url("#og-neon-current");
}

/* The inner panel: dark green glass with a hairline of its own. */
.og-neon__body {
  position: relative;
  margin: clamp(0.7rem, 1 * var(--fvw), 1.1rem);
  padding: clamp(1.5rem, 3.6 * var(--fvw), 4.2rem) clamp(1.25rem, 4 * var(--fvw), 4.8rem) clamp(1.5rem, 3.4 * var(--fvw), 4rem);
  border: 1px solid rgb(120 255 150 / 0.3);
  border-radius: calc(var(--radius) - 0.5rem);
  background: linear-gradient(135deg, rgb(15 56 26 / 0.92) 0%, rgb(5 20 9 / 0.95) 60%, rgb(9 34 16 / 0.92) 100%);
}

.og-neon__top {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(1.25rem, 2.6 * var(--fvw), 3rem);
  align-items: start;
}

.og-neon__title {
  margin: 0;
}

.og-neon__title-accent {
  color: #1fd13f;
}

.og-neon__list {
  display: grid;
  gap: 0.45em;
  margin: 0.2em 0 0;
  padding: 0;
  font-weight: 600;
  list-style: none;
}

.og-neon__list li {
  display: flex;
  gap: 0.6em;
  align-items: flex-start;
}

.og-neon__check {
  flex: none;
  width: 1.15em;
  height: 1.15em;
  margin-top: 0.15em;
  color: #19f03a;
  stroke-width: 4;
}

.og-neon__text {
  max-width: 46em;
  margin: clamp(1.25rem, 2.3 * var(--fvw), 2.75rem) 0 0;
}

.og-neon__text-muted {
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

@keyframes og-neon-breathe {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.82;
  }
}

/* Tablets and phones: the title over the two lists, then one list. */
@media (max-width: 1023px) {
  .og-neon__top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .og-neon__title {
    grid-column: 1 / -1;
  }
}

@media (max-width: 767px) {
  .og-neon__current {
    display: none;
  }
}

@media (max-width: 599px) {
  .og-neon__top {
    grid-template-columns: 1fr;
    gap: 0.5em;
  }

  .og-neon__title {
    margin-bottom: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .og-neon__ring {
    animation: none;
  }

  .og-neon__current {
    display: none;
  }
}
</style>
