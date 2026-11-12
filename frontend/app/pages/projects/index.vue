<script setup lang="ts">
// The projects, on black, under the site header: a short film into the grid
// of the CMS projects (ProjectsStage). The page's heading is there for screen
// readers and search engines only; nothing is written over the grid.
// The showcase (the old ?view=grid) is the Branding & rebranding service page now.
import { computed } from "vue";
import ProjectsStage from "~/components/projects/ProjectsStage.vue";
import { toSiteLocale } from "~/utils/locales";
import { servicePath } from "~/utils/servicePages";

const { t, locale } = useI18n();
const localePath = useLocalePath();
const origin = useSiteOrigin();
const showcasePath = computed(() => servicePath("branding", toSiteLocale(locale.value)));

const route = useRoute();
if (route.query.view === "grid") {
  await navigateTo(showcasePath.value, { redirectCode: 301, replace: true });
}

usePageSeo({
  title: computed(() => t("seo.projects.title")),
  description: computed(() => t("seo.projects.description")),
  breadcrumbs: computed(() => [{ name: t("nav.projects"), path: localePath("/projects") }]),
  structuredData: computed(() => ({
    "@type": "CollectionPage",
    name: t("seo.projects.title"),
    description: t("seo.projects.description"),
    isPartOf: { "@id": `${origin}/#website` },
  })),
});

const { projects } = await useProjectsWallData();
</script>

<template>
  <div class="work">
    <h1 class="sr-only">{{ t("seo.projects.h1") }}</h1>
    <ProjectsStage :projects="projects" category="" />
  </div>
</template>

<style scoped>
/* overflow-x: clip, not hidden. */
.work {
  position: relative;
  overflow-x: clip;
  background: #000;
  color: #ece9e2;
}
</style>
