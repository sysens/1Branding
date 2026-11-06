<script setup lang="ts">
// /showcase (pages/showcase.vue): a white page made of the case studies'
// sections (CaseSections), written by the site: what OneBranding makes
// ("ReBranding & Branding"), why a brandbook, a cover picture and the
// statement block; then, on black, the clients' work on a 3D marquee
// (ShowcaseMarquee), the packaging wall with the way to the projects
// (ShowcaseGallery), "The ONE approach" arc (ApproachArc), "Logo / Brand
// identity" (IdentityCompare), the brandbook's 30 chapters (BrandbookIndex),
// and the landing's "Fresh projects", questions and robot, with the site
// footer at the end. The document scrolls it, under the site header.
import { computed } from "vue";
import CaseSections from "~/components/case-study/CaseSections.vue";
import ApproachArc from "~/components/projects/ApproachArc.vue";
import BrandbookIndex from "~/components/projects/BrandbookIndex.vue";
import IdentityCompare from "~/components/projects/IdentityCompare.vue";
import ShowcaseGallery from "~/components/projects/ShowcaseGallery.vue";
import ShowcaseMarquee from "~/components/projects/ShowcaseMarquee.vue";
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
      section1: { projectTitle: t("seo.showcase.h1"), text: t("projectsPage.showcase.intro"), images: [COVER] },
    },
    (url) => url || "",
    caseCopy.value
  ).map((section) =>
    section.type === "picture" && section.id === "cover"
      ? { ...section, alt: t("projectsPage.showcase.cover"), ownMark: true }
      : section
  )
);

const FOOTER_HYDRATION = { rootMargin: "600px 0px" };
</script>

<template>
  <div class="projects-showcase">
    <CaseSections class="projects-showcase__column" :sections="sections" />
    <ShowcaseMarquee class="projects-showcase__marquee" />
    <div class="projects-showcase__dark">
      <ShowcaseGallery />
      <ApproachArc />
      <IdentityCompare />
      <BrandbookIndex />
      <LazyHomeFreshProjects />
      <HomeFaqAccordion />
      <LazyHomeRobotShowcase />
    </div>
    <LazyFooter :hydrate-on-visible="FOOTER_HYDRATION" />
  </div>
</template>

<style scoped>
/* Below the site's floating header, as a case study; the column is theirs
   (80% of the screen, the screen less 20px margins on phones). */
.projects-showcase {
  min-height: 100vh;
  padding-top: clamp(8.5rem, 9vw, 9.5rem);
  background: #fff;
  color: #111;
}

.projects-showcase__column {
  width: min(100% - 2.5rem, 80 * var(--fvw));
  margin-inline: auto;
}

/* A full-width section, the case sections' step below the statement. */
.projects-showcase__marquee {
  margin-top: clamp(2.5rem, 5.5vw, 6rem);
}

/* The black run from the packaging wall to the robot, as the landing's. */
.projects-showcase__dark {
  position: relative;
  background: #000;
  color: #fff;
}

@media (max-width: 767px) {
  .projects-showcase__column {
    width: calc(100% - 2.5rem);
  }
}
</style>
