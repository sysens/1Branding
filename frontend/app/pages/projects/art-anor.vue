<script setup lang="ts">
// The Art-Anor case story: a project page designed block by block
// (utils/caseStories.ts, drawn by CaseStory), then the way to the services
// and to a brief. It lives beside the CMS case studies (pages/projects/[id].vue,
// laid out the same way); this fixed address takes the route before [id] does.
// The card on /projects that opens it comes from the same story
// (composables/useProjectsWallData.ts).
import { computed } from "vue";
import CaseNext from "~/components/case-study/CaseNext.vue";
import CaseStory from "~/components/case-study/CaseStory.vue";
import { ART_ANOR, resolveStory } from "~/utils/caseStories";

const story = ART_ANOR;

const { t, locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const origin = useSiteOrigin();

const copy = (path: string) => t(`caseStories.${story.key}.${path}`);
// The story with its words in the page's language.
const view = computed(() => resolveStory(story, copy));
const name = computed(() => copy("name"));
// As on the CMS case studies: the project's name, then what the page is.
const seoTitle = computed(() => `${name.value} — ${t("seo.project")}`);
const seoDescription = computed(() => copy("description"));
const seoImage = `${origin}${story.cover}`;

usePageSeo({
  title: seoTitle,
  description: seoDescription,
  type: "website",
  image: seoImage,
  imageAlt: computed(() => copy("alt.packaging")),
  breadcrumbs: computed(() => [
    { name: t("nav.projects"), path: localePath("/projects") },
    { name: name.value, path: route.path },
  ]),
  structuredData: computed(() => ({
    "@type": "CreativeWork",
    name: copy("title"),
    description: seoDescription.value,
    url: `${origin}${route.path}`,
    image: seoImage,
    inLanguage: locale.value,
    creator: { "@id": `${origin}/#organization` },
  })),
});

// The page is white to its edges, also where the browser overscrolls.
useHead({ bodyAttrs: { class: "case-study-document" } });
</script>

<template>
  <div class="case-study">
    <CaseStory :story="view" />
    <CaseNext class="case-study__next" />
  </div>
</template>

<style scoped>
.case-study {
  min-height: 100vh;
  background: #fff;
  color: #111;
}

.case-study__next {
  width: min(100% - 2.5rem, 80 * var(--fvw));
  margin-inline: auto;
}

:global(body.case-study-document) {
  background: #fff;
}
</style>
