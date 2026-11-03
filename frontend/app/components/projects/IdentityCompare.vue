<script setup lang="ts">
// The grid view's "Logo / Brand identity": the same packaging twice, once
// with the name alone (grey) and once in a full identity (the brand's
// colours and marks), each under its label and over its line; then the
// paragraph on what OneBranding joins into one system, over the big dark "1"
// of the OneBranding mark. The packaging is drawn in SVG
// (PackagingIllustration), in the design's two versions.
import PackagingIllustration from "~/components/projects/PackagingIllustration.vue";

const { t } = useI18n();

const SIDES = ["logo", "identity"] as const;
</script>

<template>
  <section class="identity-compare" aria-labelledby="identity-compare-title">
    <h2 id="identity-compare-title" class="sr-only">{{ t("projectsPage.identity.title") }}</h2>
    <div class="identity-compare__pair">
      <figure v-for="side in SIDES" :key="side" class="identity-compare__side" :class="`identity-compare__side--${side}`">
        <p v-rise class="identity-compare__label">{{ t(`projectsPage.identity.${side}.label`) }}</p>
        <div v-rise class="identity-compare__picture">
          <PackagingIllustration :variant="side" :label="t(`projectsPage.identity.${side}.alt`)" />
        </div>
        <figcaption v-rise class="identity-compare__line">{{ t(`projectsPage.identity.${side}.line`) }}</figcaption>
      </figure>
    </div>

    <div class="identity-compare__system">
      <!-- The "1" fades into the black before the section ends, as in the design. -->
      <svg class="identity-compare__one" viewBox="0 0 380 640" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="identity-compare-one" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#191919" />
            <stop offset="0.5" stop-color="#121212" />
            <stop offset="1" stop-color="#000" />
          </linearGradient>
        </defs>
        <path d="M173 0H380V640H171V168H0Z" fill="url(#identity-compare-one)" />
      </svg>
      <p v-rise class="identity-compare__text">
        {{ t("projectsPage.identity.text") }}
        <span class="identity-compare__accent">{{ t("projectsPage.identity.accent") }}</span>
      </p>
    </div>
  </section>
</template>

<style scoped>
/* The design at 1440px: the two sides centred 306px either side of the
   middle (columns of 85% of the screen), labels 86px tall in 3.5px frames,
   pictures 402px wide, lines in 33px type; the paragraph in 30px type. */
.identity-compare {
  position: relative;
  overflow: hidden;
  padding-block: clamp(4rem, 7vw, 6.5rem) clamp(5rem, 10vw, 9rem);
  background: #000;
  color: #fff;
}

.identity-compare__pair {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: min(100% - 2.5rem, 85 * var(--fvw));
  margin-inline: auto;
}

.identity-compare__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  text-align: center;
}

/* "Logo" in white, "Brand identity" in the green frame. */
.identity-compare__label {
  margin: 0;
  padding: 0.18em 0.62em 0.26em;
  border: max(2px, 0.075em) solid #fff;
  border-radius: 0.34em;
  font-family: var(--app-font-display);
  font-size: clamp(1.75rem, 3.5vw, 3.15rem);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.015em;
}

.identity-compare__side--identity .identity-compare__label {
  border-color: #14c93f;
}

.identity-compare__picture {
  width: min(100%, 27.9 * var(--fvw));
  margin-top: clamp(2.5rem, 6.5vw, 6rem);
}

.identity-compare__line {
  max-width: 13em;
  margin-top: clamp(1.25rem, 2.8vw, 2.5rem);
  font-family: var(--app-font-display);
  font-size: clamp(1.25rem, 2.3vw, 2.1rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

/* The paragraph over the big "1", whose top starts level with the lines. */
.identity-compare__system {
  position: relative;
  display: flex;
  justify-content: center;
  margin-top: clamp(4rem, 12.5vw, 11.5rem);
  padding-inline: 1.25rem;
}

.identity-compare__one {
  position: absolute;
  top: calc(-1 * clamp(5rem, 15vw, 13.5rem));
  left: 50%;
  width: clamp(9rem, 19vw, 17.5rem);
  height: auto;
  transform: translateX(-56%);
  pointer-events: none;
}

.identity-compare__text {
  position: relative;
  max-width: 47em;
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(1.125rem, 2.1vw, 1.9rem);
  font-weight: 600;
  line-height: 1.33;
  letter-spacing: -0.01em;
  text-align: center;
  text-wrap: balance;
}

.identity-compare__accent {
  display: block;
  background: linear-gradient(90deg, #0fae38, #20e848 55%, #14c93f);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Phones: one side under the other. */
@media (max-width: 767px) {
  .identity-compare__pair {
    grid-template-columns: 1fr;
    gap: 3.5rem;
    width: calc(100% - 2.5rem);
  }

  .identity-compare__picture {
    width: min(100%, 22rem);
  }
}
</style>
