<script setup lang="ts">
// The page's last screen: the mark, "We work with brands that want more." and
// the way to the contact page.
const { t } = useI18n();
const localePath = useLocalePath();

// The mark (a disc with a slanted "1" cut out of it), as in PageLoader.vue.
const MARK_PATH = "M919 811A213.5 213.5 0 1 1 1009 827L1095 499L1006 500L904 588L1060 590L974 613Z";
// The "1" itself, in black, under the disc: the mark breathes with light (a
// glow behind it swells and fades, the disc brightens and dims), and this
// keeps the light out of the cut-out. It is clipped to the disc's circle
// (DISC), so the "1" stays open at its foot, down to the rim, and no further:
// outside the disc the glow is a whole ring. (The stem used to run on past
// the rim and cut a black bar through the glow under the disc.)
const ONE_POINTS = "1009,827 1095,499 1006,500 904,588 1060,590 974,613 919,811 886,930 957,1024";
const DISC = { cx: 1000.5, cy: 613.7, r: 213.5 };
</script>

<template>
  <section class="og-cta">
    <div v-rise class="og-cta__mark" aria-hidden="true">
      <svg viewBox="787 400.2 427 427" focusable="false">
        <defs>
          <linearGradient id="og-cta-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#06f01e" />
            <stop offset="1" stop-color="#0c9c3a" />
          </linearGradient>
          <clipPath id="og-cta-disc">
            <circle :cx="DISC.cx" :cy="DISC.cy" :r="DISC.r" />
          </clipPath>
        </defs>
        <g clip-path="url(#og-cta-disc)">
          <polygon class="og-cta__mark-one" :points="ONE_POINTS" />
        </g>
        <path :d="MARK_PATH" fill="url(#og-cta-mark)" />
      </svg>
    </div>

    <h2 v-blur-reveal class="og-cta__title type-display-s">
      <span>{{ t("oneGuarantee.cta.line1") }}</span>
      {{ " " }}
      <span class="og-grad ob-green">{{ t("oneGuarantee.cta.line2") }}</span>
    </h2>
    <p v-rise class="og-cta__text type-intro">{{ t("oneGuarantee.cta.text") }}</p>
    <p v-rise class="og-cta__action">
      <NuxtLink :to="localePath('/contact')" class="ob-button og-button og-button--caps">{{ t("oneGuarantee.cta.button") }}</NuxtLink>
    </p>
  </section>
</template>

<style scoped>
/* The design at 1440px: the mark 252px across, in a screen of black. Type is
   the site's scale: the heading display-s, the text the intro step. */
.og-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: min(100svh, 62rem);
  padding: clamp(5rem, 9 * var(--fvw), 11rem) 1.25rem clamp(5rem, 11 * var(--fvw), 13rem);
  background: #000;
  text-align: center;
}

.og-cta__mark {
  position: relative;
  width: clamp(8rem, 17.5 * var(--fvw), 21rem);
  aspect-ratio: 1;
}

/* The glow behind the disc: it swells bright and sinks back, 2.6s a breath. */
.og-cta__mark::before {
  position: absolute;
  inset: -24%;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(20 255 60 / 0.95) 0%, rgb(10 230 50 / 0.6) 44%, transparent 70%);
  content: "";
  filter: blur(1.25rem);
  animation: og-cta-glow 2.6s ease-in-out infinite;
}

/* The disc brightens and dims with it. (On the <svg>, not the path: Safari
   does not run CSS filters on an SVG's children.) */
.og-cta__mark svg {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  animation: og-cta-lit 2.6s ease-in-out infinite;
}

/* A hair wider than the cut-out, so no light shows along its edges. */
.og-cta__mark-one {
  fill: #000;
  stroke: #000;
  stroke-width: 3;
}

@keyframes og-cta-glow {
  0%,
  100% {
    opacity: 0.14;
    transform: scale(0.84);
  }

  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes og-cta-lit {
  0%,
  100% {
    filter: brightness(0.74) saturate(0.95);
  }

  50% {
    filter: brightness(1.24) saturate(1.1);
  }
}

/* No breathing: a steady, middling glow. */
@media (prefers-reduced-motion: reduce) {
  .og-cta__mark::before {
    opacity: 0.5;
    animation: none;
  }

  .og-cta__mark svg {
    animation: none;
  }
}

/* The copy is over the mark's glow, which runs down behind it. */
.og-cta__title,
.og-cta__text,
.og-cta__action {
  position: relative;
  z-index: 1;
}

.og-cta__title {
  margin: clamp(1.5rem, 2.6 * var(--fvw), 3.2rem) 0 0;
}

.og-cta__title > span {
  display: block;
  padding-bottom: 0.08em;
}

.og-cta__text {
  max-width: 27em;
  margin: clamp(0.75rem, 1.2 * var(--fvw), 1.5rem) auto 0;
  text-wrap: balance;
}

.og-cta__action {
  display: flex;
  justify-content: center;
  margin: clamp(1.5rem, 2.9 * var(--fvw), 3.5rem) 0 0;
}
</style>
