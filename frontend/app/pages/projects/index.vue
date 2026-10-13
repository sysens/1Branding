<script setup lang="ts">
// A full-screen project wall: no site footer.
import { computed } from "vue";
import InfiniteProjectsWall from "~/components/projects/InfiniteProjectsWall.vue";

definePageMeta({ footer: false });

const { t } = useI18n();
const localePath = useLocalePath();
const origin = useSiteOrigin();
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
</script>

<template>
  <div>
    <h1 class="sr-only">{{ $t("seo.projects.h1") }}</h1>

    <InfiniteProjectsWall />
  </div>
</template>

<style scoped>

</style>
