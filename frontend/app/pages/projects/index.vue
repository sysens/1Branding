<script setup lang="ts">
// The projects, on black, under the site header: a short film into the grid
// of the CMS projects (ProjectsStage), with a bar at the foot that stays on
// screen while the grid does: the page's heading on the left, the categories
// in the middle (they filter the grid), the way to the showcase on the right.
// The showcase (the old ?view=grid) is the Branding & rebranding service page now.
import { computed, ref } from "vue";
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

const categories = computed(() => [...new Set(projects.value.map((project) => project.category).filter(Boolean))]);
const category = ref("");
</script>

<template>
  <div class="work">
    <ProjectsStage :projects="projects" :category="category" />

    <div class="work-bar">
      <h1 class="work-bar__title">{{ t("seo.projects.h1") }}</h1>
      <nav class="work-bar__filters" :aria-label="t('projectsPage.category')">
        <template v-for="(name, index) in ['', ...categories]" :key="name || 'all'">
          <span v-if="index" class="work-bar__divider" aria-hidden="true">/</span>
          <button type="button" :class="{ 'is-active': category === name }" :aria-pressed="category === name" @click="category = name">
            {{ name || t("projectsPage.all") }}
          </button>
        </template>
      </nav>
      <NuxtLink :to="showcasePath" class="work-bar__more">
        {{ t("projectsPage.showcaseLink") }}<span class="work-bar__dash" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
/* overflow-x: clip, not hidden: the bar's sticky place is the screen's. */
.work {
  --side: clamp(1.25rem, 2.6vw, 3rem);
  position: relative;
  overflow-x: clip;
  background: #000;
  color: #ece9e2;
}

/* The foot of the screen while the grid is on it: three parts on one line,
   straight over the page (no shade: the cards pass under it bright, as in
   the reference). */
.work-bar {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 1.5rem;
  margin-top: -5rem;
  padding: 2.5rem var(--side) clamp(1.1rem, 2vw, 1.75rem);
  font-family: var(--app-font-sans);
}

.work-bar__title {
  max-width: 19rem;
  margin: 0;
  color: #d6d3cc;
  font-size: var(--type-caption-size);
  font-weight: 400;
  line-height: 1.4;
}

.work-bar__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem 0.7rem;
}

.work-bar__filters button,
.work-bar__more {
  padding: 0;
  border: 0;
  background: none;
  color: #8d8b86;
  font: inherit;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.25s ease;
}

.work-bar__filters button:hover,
.work-bar__filters button.is-active {
  color: #ece9e2;
}

.work-bar__divider {
  color: #4a4946;
  font-size: 0.75rem;
}

.work-bar__more {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  justify-self: end;
  color: #ece9e2;
  text-decoration: none;
}

.work-bar__dash {
  width: 1.5rem;
  height: 1px;
  background: currentColor;
  transition: width 0.3s ease;
}

.work-bar__more:hover .work-bar__dash {
  width: 2.25rem;
}

.work-bar button:focus-visible,
.work-bar__more:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 0.3rem;
}

/* Phones: the bar at the grid's end (over the one-column grid it covered a
   picture), the categories on their own line above the heading and the link. */
@media (max-width: 767px) {
  .work-bar {
    position: static;
    grid-template-columns: 1fr auto;
    gap: 0.9rem 1rem;
    margin-top: 0;
    padding-top: 0;
    background: none;
  }

  .work-bar__filters {
    grid-column: 1 / -1;
    grid-row: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .work-bar__dash,
  .work-bar button,
  .work-bar__more {
    transition: none;
  }
}
</style>
