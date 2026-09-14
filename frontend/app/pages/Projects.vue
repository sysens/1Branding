<script setup lang="ts">
import { computed } from "vue";
import InfiniteProjectsWall from "~/components/Projects/InfiniteProjectsWall.vue";
import Header from "~/components/Header.vue";

const { t } = useI18n();
const route = useRoute();
const runtimeConfig = useRuntimeConfig();

const seoTitle = computed(() => t("seo.projects"));
const seoDescription = computed(() => t("seo.description"));
const siteUrl = String(runtimeConfig.public.siteUrl || "").replace(/\/$/, "");
const canonical = computed(() => (siteUrl ? `${siteUrl}${route.path}` : ""));

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogType: "website",
  ogUrl: () => canonical.value || undefined,
  twitterCard: "summary",
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
});

useHead(() => ({
  link: canonical.value ? [{ rel: "canonical", href: canonical.value }] : [],
}));
</script>

<template>
  <div>
    <nav class="projects-navbar" aria-label="Main navigation">
      <div class="projects-navbar__inner">
        <Header />
      </div>
    </nav>

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
