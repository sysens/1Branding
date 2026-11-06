<script setup lang="ts">
// The showcase: how OneBranding builds brands, with more of its work
// (ProjectsShowcase), a white page under the site header. It was the grid
// view of /projects (?view=grid, which now redirects here).
import { computed } from "vue";
import ProjectsShowcase from "~/components/projects/ProjectsShowcase.vue";

// The showcase ends with the site footer itself.
definePageMeta({ footer: false });

const { t } = useI18n();
const localePath = useLocalePath();
const origin = useSiteOrigin();
usePageSeo({
  title: computed(() => t("seo.showcase.title")),
  description: computed(() => t("seo.showcase.description")),
  breadcrumbs: computed(() => [
    { name: t("nav.projects"), path: localePath("/projects") },
    { name: t("projectsPage.showcaseName"), path: localePath("/showcase") },
  ]),
  structuredData: computed(() => ({
    "@type": "WebPage",
    name: t("seo.showcase.h1"),
    description: t("seo.showcase.description"),
    isPartOf: { "@id": `${origin}/#website` },
  })),
});

useHead({
  htmlAttrs: { class: "showcase-document" },
  bodyAttrs: { class: "showcase-document" },
});
</script>

<template>
  <ProjectsShowcase />
</template>

<style scoped>
:global(html.showcase-document),
:global(body.showcase-document) {
  background: #fff;
}
</style>
