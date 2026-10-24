<script setup lang="ts">
// A full-screen project wall: no site footer.
import { computed } from "vue";
import InfiniteProjectsWall from "~/components/projects/InfiniteProjectsWall.vue";

definePageMeta({ footer: false, header: false });

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
    <!-- The page's heading, small over the wall, with the way to the services. -->
    <header class="projects-heading">
      <h1>{{ $t("seo.projects.h1") }}</h1>
      <NuxtLink :to="localePath('/services')">{{ $t("projectsPage.services") }}</NuxtLink>
    </header>

    <InfiniteProjectsWall />
    <NuxtLink :to="localePath('/')" class="projects-back">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14 5-7 7 7 7M8 12h10" /></svg>
      <span>{{ $t("projectsPage.back") }}</span>
    </NuxtLink>
  </div>
</template>

<style scoped>
.projects-back {
  position: fixed;
  z-index: 810;
  top: max(1.25rem, env(safe-area-inset-top));
  left: max(1.25rem, env(safe-area-inset-left));
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.9rem;
  padding: 0.65rem 1.25rem;
  border-radius: 999px;
  background: #fff;
  color: #252525;
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.2);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.projects-back svg {
  width: 1.2rem;
  height: 1.2rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.projects-back:hover,
.projects-back:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 0.8rem 2rem rgb(0 0 0 / 0.28);
}

.projects-back:focus-visible {
  outline: 3px solid #03cb00;
  outline-offset: 3px;
}

.projects-heading {
  position: fixed;
  z-index: 810;
  top: max(1.25rem, env(safe-area-inset-top));
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  max-width: calc(100vw - 2.5rem);
  min-height: 2.9rem;
  padding: 0.55rem 0.6rem 0.55rem 1.25rem;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.72);
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.2);
  color: #fff;
  transform: translateX(-50%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.projects-heading h1 {
  margin: 0;
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.projects-heading a {
  flex: none;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: #03cb00;
  color: #000;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
}

/* Phones: the back button keeps the top-left corner, the heading the bottom. */
@media (max-width: 767px) {
  .projects-heading {
    top: auto;
    bottom: max(1.25rem, env(safe-area-inset-bottom));
  }
}

</style>
