<script setup lang="ts">
// "With 2500+ completed design projects ...", on black, over the ribbon of
// green light (InterferenceRibbons, with the settings picked for this page).
import InterferenceRibbons from "~/components/one-guarantee/InterferenceRibbons.vue";

const { t } = useI18n();
</script>

<template>
  <section class="og-projects">
    <!-- The ribbon fills the lower part and runs up behind the text's foot. -->
    <InterferenceRibbons
      class="og-projects__ribbon"
      :colors="['#1dff00', '#6dff0a']"
      :wires="128"
      :line-width="1.1"
      :ribbon-width="0.26"
      :amplitude="0.6"
      :wave-length="3"
      :angle="34"
      fit
      :twist="1.6"
      :curl="0.25"
      :depth="0.59"
      :stripes="3.2"
      :color-flow="-0.02"
      :glow="0.55"
      :intensity="1"
      :speed="0.7"
      :spin="0.35"
      fallback="/one-guarantee-page/ribbon.webp"
    />

    <div class="og-projects__copy">
      <h2 v-blur-reveal class="og-projects__title type-display-l">
        {{ t("oneGuarantee.projects.before") }}
        <span class="og-grad">{{ t("oneGuarantee.projects.number") }}</span>
        {{ t("oneGuarantee.projects.after") }}
      </h2>
      <p v-rise class="og-projects__text type-intro">{{ t("oneGuarantee.projects.text") }}</p>
    </div>
  </section>
</template>

<style scoped>
/* The design at 1440px: the section 1020px tall, the ribbon from the lower
   left corner up to the right edge. Type is the site's scale: "With 2500+"
   display-l, the text the intro step. */
.og-projects {
  position: relative;
  min-height: clamp(38rem, 71 * var(--fvw), 82rem);
  padding: clamp(4.5rem, 12 * var(--fvw), 14rem) 1.25rem 0;
  background: #000;
  overflow: hidden;
}

.og-projects__ribbon {
  position: absolute;
  inset: 42% 0 0;
  /* It fades in under the text, and out towards the section's foot, instead
     of starting and ending on a line. The fade out is long and eased (the
     last 30%): the ribbon leaves through the lower left corner at full
     brightness, and over a short fade that still read as a cut. */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 26%, #000 70%, rgb(0 0 0 / 0.6) 85%, rgb(0 0 0 / 0.2) 95%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 26%, #000 70%, rgb(0 0 0 / 0.6) 85%, rgb(0 0 0 / 0.2) 95%, transparent 100%);
}

.og-projects__copy {
  position: relative;
  z-index: 1;
  text-align: center;
}

.og-projects__title {
  margin: 0;
  text-wrap: balance;
}

.og-projects__text {
  max-width: var(--type-measure-intro);
  margin: clamp(0.75rem, 1.2 * var(--fvw), 1.5rem) auto 0;
  text-wrap: balance;
}

/* Phones: a taller frame for the ribbon, which then runs steeper. */
@media (max-width: 767px) {
  .og-projects__ribbon {
    inset: 46% 0 0;
  }
}
</style>
