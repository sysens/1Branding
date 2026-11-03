<script setup lang="ts">
// The grid view of /projects: a white page made of the case studies'
// sections (CaseSections), written by the site: what OneBranding makes
// ("ReBranding & Branding"), why a brandbook, a cover picture, the statement
// block and the way to a brief. It scrolls on its own over the full-screen
// page, under the way home and the view switch.
import { computed } from "vue";
import CaseNext from "~/components/case-study/CaseNext.vue";
import CaseSections from "~/components/case-study/CaseSections.vue";
import { buildCaseSections } from "~/utils/caseStudy";

// The cover, cut from the design until its original is in; the "Onebranding"
// mark is part of it.
const COVER = { url: "/case-study/showcase-cover.webp", width: 804, height: 466 };

const { t } = useI18n();
const caseCopy = useCaseCopy();

const sections = computed(() =>
  buildCaseSections(
    {
      tags: [{ label: t("projectsPage.showcase.title") }, { label: t("projectsPage.showcase.accent") }],
      section1: { projectTitle: t("seo.projects.h1"), text: t("projectsPage.showcase.intro"), images: [COVER] },
    },
    (url) => url || "",
    caseCopy.value
  ).map((section) =>
    section.type === "picture" && section.id === "cover"
      ? { ...section, alt: t("projectsPage.showcase.cover"), ownMark: true }
      : section
  )
);
</script>

<template>
  <div class="projects-showcase">
    <CaseSections class="projects-showcase__column" :sections="sections" />
    <CaseNext class="projects-showcase__column" />
  </div>
</template>

<style scoped>
/* Below the way home and the view switch; the column is the case studies'
   (80% of the screen, the screen less 20px margins on phones). */
.projects-showcase {
  position: fixed;
  z-index: 800;
  inset: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-top: clamp(6.5rem, 9vw, 9.5rem);
  background: #fff;
  color: #111;
}

.projects-showcase__column {
  width: min(100% - 2.5rem, 80 * var(--fvw));
  margin-inline: auto;
}

@media (max-width: 767px) {
  .projects-showcase__column {
    width: calc(100% - 2.5rem);
  }
}
</style>
