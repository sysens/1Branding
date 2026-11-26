<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";

// How the CEO works (the about page's "More" leads to it, pages/about/ceo.vue):
// a photo of him at work beside the copy, the green questions in it, and the
// way to a conversation, "let's talk. one to one." The photo has build-time
// AVIF/WebP copies (public/about-page, scripts/optimize-images.mjs).
const { t } = useI18n();
const localePath = useLocalePath();
</script>

<template>
  <section class="ceo-story" :aria-label="t('aboutPage.ceo.storyLabel')">
    <div v-rise class="ceo-story__photo">
      <OptImage
        src="/about-page/ceo-desk.webp"
        :alt="t('aboutPage.ceo.deskAlt')"
        sizes="(max-width: 767px) 90vw, 29vw"
        loading="eager"
        decoding="async"
      />
    </div>
    <div class="ceo-story__copy">
      <p v-rise>{{ t("aboutPage.ceo.story1") }}</p>
      <p v-rise class="ceo-story__questions ob-green">
        <span>{{ t("aboutPage.ceo.questions1") }}</span>
        {{ " " }}
        <span>{{ t("aboutPage.ceo.questions2") }}</span>
      </p>
      <p v-rise>{{ t("aboutPage.ceo.story2") }}</p>
      <div class="ceo-story__talk">
        <p v-rise class="ceo-story__ask">
          <span>{{ t("aboutPage.ceo.askLine1") }}</span>
          {{ " " }}
          <span>{{ t("aboutPage.ceo.askLine2") }} <span class="ceo-story__accent ob-green">{{ t("aboutPage.ceo.askAccent") }}</span></span>
        </p>
        <NuxtLink v-rise :to="localePath('/contact')" class="ob-button ceo-story__button">{{ t("aboutPage.ceo.contact") }}</NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* The design at 1440px: the copy 19px beside a 409px photo, the call to talk
   in 39px type. */
.ceo-story {
  --green: #20e848;
  display: grid;
  grid-template-columns: minmax(0, 36fr) minmax(0, 59.6fr);
  gap: clamp(1.5rem, 4.4vw, 4rem);
  align-items: start;
  width: min(100% - 2.5rem, 79 * var(--fvw));
  margin: 0 auto;
  color: #fff;
}

.ceo-story__photo :deep(img) {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  object-fit: cover;
}

.ceo-story__copy {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 1.6vw, 1.4rem);
  padding-top: clamp(0rem, 1.4vw, 1.25rem);
}

.ceo-story__copy > p {
  margin: 0;
  color: rgb(255 255 255 / 0.86);
  font-family: var(--app-font-sans);
  font-size: clamp(1rem, 1.32vw, 1.2rem);
  line-height: 1.22;
}

.ceo-story__questions {
  color: var(--green) !important;
}

.ceo-story__questions > span {
  display: block;
}

.ceo-story__talk {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem 2rem;
  margin-top: clamp(0.75rem, 2vw, 1.75rem);
}

.ceo-story__ask {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(1.6rem, 2.7vw, 2.45rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.015em;
}

.ceo-story__ask > span {
  display: block;
}

.ceo-story__accent {
  color: var(--green);
}

/* The about page's buttons: bright green, black type. */
.ceo-story__button {
  --button-h: clamp(2.75rem, 3.2vw, 2.9rem);
  --button-pad: clamp(1.4rem, 2.2vw, 2rem);
  --button-font: clamp(1.0625rem, 1.6vw, 1.45rem);
  background: linear-gradient(100deg, #11b237 0%, #1fd544 55%, var(--green) 100%);
  color: #000;
  font-weight: 700;
  text-shadow: none;
}

/* The shared button's drifting dark light would sit under the black type. */
.ceo-story__button::before {
  display: none;
}

/* Phones: the photo above the copy. */
@media (max-width: 767px) {
  .ceo-story {
    grid-template-columns: 1fr;
  }
}
</style>
