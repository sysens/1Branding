<script setup lang="ts">
import { computed } from "vue";
import InfiniteProjectsWall from "~/components/Projects/InfiniteProjectsWall.vue";
import Header from "~/components/Header.vue";

const { t } = useI18n();
const localePath = useLocalePath();
const origin = useSiteOrigin();
usePageSeo({
  title: computed(() => t("seo.projects.title")),
  description: computed(() => t("seo.projects.description")),
  breadcrumbs: computed(() => [{ name: t("nav.projects"), path: localePath("/Projects") }]),
  structuredData: computed(() => ({
    "@type": "CollectionPage",
    name: t("seo.projects.title"),
    description: t("seo.projects.description"),
    isPartOf: { "@id": `${origin}/#website` },
  })),
});
</script>

<template>
  <div>
    <nav class="projects-navbar" aria-label="Main navigation">
      <div class="projects-navbar__inner">
        <Header />
      </div>
    </nav>

    <h1 class="sr-only">{{ $t("seo.projects.h1") }}</h1>

    <InfiniteProjectsWall />
  </div>
</template>

<style scoped>
.projects-navbar {
  position: fixed;
  top: clamp(1.25rem, 4vw, 3.75rem);
  left: 0;
  z-index: 1000;
  width: 100%;
  pointer-events: none;
}

.projects-navbar__inner {
  pointer-events: auto;
}
</style>
