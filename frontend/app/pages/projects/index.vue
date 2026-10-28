<script setup lang="ts">
// A full-screen project wall: no site footer.
import { computed, ref } from "vue";
import InfiniteProjectsWall from "~/components/projects/InfiniteProjectsWall.vue";

definePageMeta({ footer: false, header: false });

const { t, locale } = useI18n();
const route = useRoute();
// PROTOTYPE (utils/prototypes.ts): a 3D showroom as a second way to view the
// work; ?view=showroom opens it directly.
const showroomPrototype = usePrototype("showroom");
const showroomOpen = ref(route.query.view === "showroom");
// The showroom renders only in the browser, where the CMS refuses origins
// other than the live site (local and preview hosts). The projects are fetched
// here, on the server, and handed to it.
const showroomProjects = showroomPrototype.value ? (await useProjectsWallData()).projects : null;
const SHOWROOM_LABEL: Record<string, { open: string; close: string }> = {
  en: { open: "3D Showroom", close: "Project wall" },
  ru: { open: "3D-шоурум", close: "Стена проектов" },
  uz: { open: "3D shourum", close: "Loyihalar devori" },
};
const showroomLabel = computed(() => SHOWROOM_LABEL[locale.value] ?? SHOWROOM_LABEL.en!);
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

    <ClientOnly v-if="showroomPrototype && showroomOpen">
      <LazyPrototypeOneShowroom :projects="showroomProjects?.value" @close="showroomOpen = false" />
    </ClientOnly>
    <InfiniteProjectsWall v-else />
    <button v-if="showroomPrototype" type="button" class="projects-mode" @click="showroomOpen = !showroomOpen">
      {{ showroomOpen ? showroomLabel.close : showroomLabel.open }}
    </button>
    <NuxtLink :to="localePath('/')" class="projects-back">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14 5-7 7 7 7M8 12h10" /></svg>
      <span>{{ $t("projectsPage.back") }}</span>
    </NuxtLink>
  </div>
</template>

<style scoped>
/* PROTOTYPE: switch between the project wall and the 3D showroom. */
.projects-mode {
  position: fixed;
  z-index: 810;
  top: max(1.25rem, env(safe-area-inset-top));
  right: max(1.25rem, env(safe-area-inset-right));
  min-height: 2.9rem;
  padding: 0.65rem 1.25rem;
  border: 1px solid #03cb00;
  border-radius: 62.4375rem;
  background: rgb(0 0 0 / 0.72);
  color: #20e848;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  font-weight: 600;
  line-height: var(--type-body-lh);
  cursor: pointer;
  backdrop-filter: blur(0.75rem);
  -webkit-backdrop-filter: blur(0.75rem);
  transition: transform 0.2s ease, background 0.2s ease;
}

.projects-mode:hover,
.projects-mode:focus-visible {
  transform: translateY(-2px);
  background: rgb(3 203 0 / 0.16);
}

.projects-mode:focus-visible {
  outline: 0.1875rem solid #03cb00;
  outline-offset: 0.1875rem;
}

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
  border-radius: 62.4375rem;
  background: #fff;
  color: #252525;
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.2);
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  font-weight: 600;
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
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
  outline: 0.1875rem solid #03cb00;
  outline-offset: 0.1875rem;
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
  border-radius: 62.4375rem;
  background: rgb(0 0 0 / 0.72);
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.2);
  color: #fff;
  transform: translateX(-50%);
  backdrop-filter: blur(0.75rem);
  -webkit-backdrop-filter: blur(0.75rem);
}

.projects-heading h1 {
  margin: 0;
  overflow: hidden;
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
  line-height: var(--type-small-lh);
  letter-spacing: var(--type-small-ls);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.projects-heading a {
  flex: none;
  /* The caption step's taller line (1.4) takes the place of the old padding,
     so the green pill keeps its height. */
  padding: 0.3rem 0.9rem;
  border-radius: 62.4375rem;
  background: #03cb00;
  color: #000;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  font-weight: 600;
  line-height: var(--type-caption-lh);
  letter-spacing: var(--type-caption-ls);
  text-decoration: none;
}

/* Phones: the back button keeps the top-left corner, the heading the bottom. */
@media (max-width: 767px) {
  .projects-heading {
    top: auto;
    bottom: max(1.25rem, env(safe-area-inset-bottom));
  }

  /* PROTOTYPE: under the back pill, so the two never overlap on narrow screens. */
  .projects-mode {
    top: calc(max(1.25rem, env(safe-area-inset-top)) + 3.6rem);
    right: auto;
    left: max(1.25rem, env(safe-area-inset-left));
  }
}

</style>
