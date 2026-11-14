<script setup lang="ts">
import { computed } from "vue";
import CeoStory from "~/components/about/CeoStory.vue";

// The CEO's page (the about page's "More" leads here): the way back to About,
// his name over his role and the green rule, as on the about page, then how
// he works (components/about/CeoStory.vue).

const { t } = useI18n();
const localePath = useLocalePath();
const origin = useSiteOrigin();

usePageSeo({
  title: computed(() => t("seo.ceo.title")),
  description: computed(() => t("seo.ceo.description")),
  breadcrumbs: computed(() => [
    { name: t("nav.about"), path: localePath("/about") },
    { name: t("aboutPage.ceo.name"), path: localePath("/about/ceo") },
  ]),
  structuredData: computed(() => ({
    "@type": "ProfilePage",
    name: t("seo.ceo.title"),
    description: t("seo.ceo.description"),
    isPartOf: { "@id": `${origin}/#website` },
    mainEntity: {
      "@type": "Person",
      name: t("aboutPage.ceo.name"),
      jobTitle: t("aboutPage.ceo.jobTitle"),
      image: `${origin}/about-page/ceo-desk.webp`,
      worksFor: { "@id": `${origin}/#organization` },
    },
  })),
});
</script>

<template>
  <div class="ceo-page">
    <header class="ceo-page__head">
      <NuxtLink :to="localePath('/about')" class="ceo-page__back">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        {{ t("nav.about") }}
      </NuxtLink>
      <h1 v-rise class="ceo-page__name">{{ t("aboutPage.ceo.name") }}</h1>
      <p v-rise class="ceo-page__role">{{ t("aboutPage.ceo.role") }}</p>
    </header>

    <CeoStory />
  </div>
</template>

<style scoped>
/* Black, as the about page; the heading clears the fixed header and lines
   up with the story under it. */
.ceo-page {
  --green: #20e848;
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  overflow-x: clip;
  padding: clamp(8rem, 12vw, 11rem) 0 clamp(5rem, 10vw, 9rem);
  background: #000;
  color: #fff;
}

.ceo-page__head {
  width: min(100% - 2.5rem, 79 * var(--fvw));
  margin: 0 auto clamp(2.5rem, 5vw, 4.5rem);
}

.ceo-page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: clamp(1.25rem, 2.5vw, 2rem);
  color: rgb(255 255 255 / 0.55);
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.25s ease;
}

.ceo-page__back:hover,
.ceo-page__back:focus-visible {
  color: var(--green);
}

.ceo-page__back svg {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ceo-page__name {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(2.25rem, 4vw, 3.6rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

/* The role, with the green rule under it. */
.ceo-page__role {
  position: relative;
  width: fit-content;
  margin: 0.2em 0 0;
  padding-bottom: 0.45em;
  color: rgb(255 255 255 / 0.7);
  font-family: var(--app-font-display);
  font-size: clamp(1.25rem, 2vw, 1.8rem);
  font-weight: 400;
  line-height: 1.2;
}

.ceo-page__role::after {
  position: absolute;
  bottom: 0;
  left: 0.05em;
  width: 88%;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #14c93f, var(--green));
  content: "";
}

/* Phones: centred, as on the about page. */
@media (max-width: 767px) {
  .ceo-page__head {
    text-align: center;
  }

  .ceo-page__role {
    margin-inline: auto;
  }
}
</style>
