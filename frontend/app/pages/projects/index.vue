<script setup lang="ts">
// The projects (after mathildedechiara.com). Two views, switched at the
// bottom right: the slider (one endless column of the projects, the default,
// which opens with them assembling into a diamond), full screen without the
// site header or footer, and the grid, a white page in the case studies'
// design (ProjectsShowcase) that scrolls like any page, under the site
// header. In the slider the category filter at the top right greys out the
// other projects, the way home and the page's heading sit at the top left
// and "About" on the right; they come in once the slider has taken over.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ProjectsShowcase from "~/components/projects/ProjectsShowcase.vue";
import ProjectsSlider from "~/components/projects/ProjectsSlider.vue";

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

const { projects } = await useProjectsWallData();

const categories = computed(() => [...new Set(projects.value.map((project) => project.category).filter(Boolean))]);
const category = ref("");
// Phones: the category list opens from its label.
const filtersOpen = ref(false);
const pickCategory = (name: string) => {
  category.value = name;
  filtersOpen.value = false;
};

const mode = ref<"slider" | "grid">("slider");
// The controls stay hidden through the opening, and step aside (up and out)
// while a slide is revealed, coming back from below after.
const live = ref(false);
const nuxtApp = useNuxtApp();
watch(mode, async (value) => {
  if (value === "grid") live.value = true;
  // Either view starts at the top: the grid scrolls the document, the
  // slider holds it still.
  nuxtApp.$lenis?.scrollTo(0, { immediate: true, force: true });
  await nextTick();
  measureAbout();
});
const aside = ref<"" | "out" | "reset">("");
const onReveal = async (shown: boolean) => {
  if (shown) {
    aside.value = "out";
    return;
  }
  aside.value = "reset";
  await nextTick();
  // Laid out below the mask first, so the way back is a rise.
  void page.value?.offsetHeight;
  aside.value = "";
};

// "About"'s left edge, where the slider's right crosshair ends.
const about = ref<{ $el?: HTMLElement } | null>(null);
const page = ref<HTMLElement | null>(null);
const measureAbout = () => {
  const element = about.value?.$el;
  if (element) page.value?.style.setProperty("--about-start", `${element.getBoundingClientRect().left}px`);
};
onMounted(async () => {
  await nextTick();
  measureAbout();
  window.addEventListener("resize", measureAbout);
});
onBeforeUnmount(() => window.removeEventListener("resize", measureAbout));

// The slider holds the document still; the grid is a white page that scrolls.
const documentClass = computed(() => (mode.value === "grid" ? "projects-grid-document" : "projects-document"));
useHead({
  htmlAttrs: { class: documentClass },
  bodyAttrs: { class: documentClass },
});
</script>

<template>
  <div ref="page" class="projects-page" :class="{ 'is-live': live, [`is-aside-${aside}`]: Boolean(aside) }">
    <Transition name="projects-view" mode="out-in">
      <ProjectsSlider v-if="mode === 'slider'" key="slider" :projects="projects" :category="category" :opening="!live" @live="live = true" @reveal="onReveal" />
      <ProjectsShowcase v-else key="grid" @slider="mode = 'slider'" />
    </Transition>
    <p v-if="!projects.length && mode === 'slider'" class="projects-empty">{{ $t("projectsPage.unavailable") }}</p>

    <!-- The grid is under the site header (the page's meta leaves it out for
         the slider; it is teleported to <body>). -->
    <Header v-if="mode === 'grid'" />

    <header v-else class="projects-brand">
      <NuxtLink :to="localePath('/')" class="projects-brand__name projects-line" :aria-label="$t('projectsPage.back')">
        <span><span class="projects-brand__one">{{ $t("brand.one") }}</span>Branding</span>
      </NuxtLink>
      <h1 class="projects-line"><span>{{ $t("seo.projects.h1") }}</span></h1>
      <NuxtLink :to="localePath('/services')" class="projects-brand__link projects-line"><span>{{ $t("projectsPage.services") }}</span></NuxtLink>
    </header>

    <nav v-if="mode === 'slider'" class="projects-filters" :class="{ 'is-open': filtersOpen }" :aria-label="$t('projectsPage.category')">
      <span class="projects-filters__label projects-line" aria-hidden="true" style="--i: 0"><span>{{ $t("projectsPage.category") }}</span></span>
      <button
        type="button"
        class="projects-filters__trigger"
        :aria-expanded="filtersOpen"
        aria-controls="projects-filters-list"
        @click="filtersOpen = !filtersOpen"
      >
        <span>{{ $t("projectsPage.category") }}</span><span class="projects-filters__sign" aria-hidden="true" />
      </button>
      <ul id="projects-filters-list" class="projects-filters__list">
        <li class="projects-line" style="--i: 1">
          <button type="button" :class="{ 'is-active': !category }" :aria-pressed="!category" @click="pickCategory('')">
            {{ $t("projectsPage.allCategories") }}
          </button>
        </li>
        <li v-for="(name, index) in categories" :key="name" class="projects-line" :style="{ '--i': index + 2 }">
          <button type="button" :class="{ 'is-active': category === name }" :aria-pressed="category === name" @click="pickCategory(name)">
            {{ name }}
          </button>
        </li>
      </ul>
    </nav>

    <div class="projects-mode" :class="{ 'projects-mode--grid': mode === 'grid' }" role="group" :aria-label="$t('projectsPage.displayMode')">
      <span class="projects-mode__label projects-line" aria-hidden="true"><span>{{ $t("projectsPage.displayMode") }}</span></span>
      <span class="projects-mode__options projects-line">
        <span>
          <button type="button" :class="{ 'is-active': mode === 'slider' }" :aria-pressed="mode === 'slider'" @click="mode = 'slider'">
            {{ $t("projectsPage.slider") }}
          </button>
          <span class="projects-mode__divider" aria-hidden="true">/</span>
          <button type="button" :class="{ 'is-active': mode === 'grid' }" :aria-pressed="mode === 'grid'" @click="mode = 'grid'">
            {{ $t("projectsPage.grid") }}
          </button>
        </span>
      </span>
    </div>

    <NuxtLink v-if="mode === 'slider'" ref="about" :to="localePath('/about')" class="projects-about projects-line"><span>{{ $t("projectsPage.about") }}</span></NuxtLink>
  </div>
</template>

<style scoped>
/* The overlay in the original's numbers: margins clamp(12px, 3vw, 48px),
   text 1vw (12-16px), labels 1.25vw (14-18px) in the site's display face
   (the original's serif); the controls are
   white in difference mode, so they read as ink on the page and invert over
   a picture passing under them. */
.projects-page {
  --edge: clamp(0.75rem, 3vw, 3rem);
  /* Left and right, the corners are those of the centred content frame:
     the screen's up to 120rem (1920px at 16px), on an ultrawide screen the
     frame in its middle (--frame-side is 0 until the screen is wider). */
  --edge-x: calc(var(--edge) + var(--frame-side));
  /* The site's own faces: SF Pro Display where the original sets its
     serif, SF Pro Text for the rest. */
  --serif: var(--app-font-display);
  --sans: var(--app-font-sans);
  --text: clamp(0.75rem, 1vw, 1rem);
  --label: clamp(0.875rem, 1.25vw, 1.125rem);
  --ink: #111;
  --muted: #6e6e6e;
  font-family: var(--sans);
}

/* Each control comes in as a masked line rising (0.5 s), once the slider
   is live: the filters from 0.12 s, 0.04 s apart, the mode at 0.12 s,
   "About" at 0.14 s (0.5 s after the slider takes over). */
.projects-line {
  display: block;
  overflow: hidden;
}

.projects-line > * {
  display: inline-block;
  translate: 0 100%;
}

.projects-page.is-live .projects-line > * {
  translate: 0 0;
  transition: translate 0.5s cubic-bezier(0.5, 1, 0.89, 1) var(--delay, 0.12s);
}

.projects-filters .projects-line {
  --delay: calc(0.12s + var(--i, 0) * 0.04s);
}

/* A slide revealed: every control slides up out of its mask (0.3 s), and
   comes back from below when it closes. */
.projects-page.is-live.is-aside-out .projects-line > * {
  translate: 0 -100%;
  transition: translate 0.3s cubic-bezier(0.32, 0, 0.67, 0);
}

.projects-page.is-live.is-aside-reset .projects-line > * {
  translate: 0 100%;
  transition: none;
}

.projects-page.is-aside-out .projects-filters,
.projects-page.is-aside-out .projects-mode,
.projects-page.is-aside-out .projects-about,
.projects-page.is-aside-out .projects-brand {
  pointer-events: none;
}

.projects-about {
  --delay: 0.14s;
}

.projects-filters,
.projects-mode,
.projects-about {
  position: fixed;
  z-index: 810;
  color: #fff;
  mix-blend-mode: difference;
}

.projects-filters button,
.projects-mode button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: var(--text);
  letter-spacing: 0.12em;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.3s;
}

.projects-filters button:hover {
  color: #b4b4b4;
}

.projects-filters button.is-active,
.projects-mode button.is-active {
  color: #fff;
}

.projects-filters button:focus-visible,
.projects-mode button:focus-visible,
.projects-about:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 0.25rem;
}

/* "PROJECT CATEGORY", "DISPLAY MODE". */
.projects-filters__label,
.projects-mode__label {
  color: #fff;
  font-family: var(--serif);
  font-size: var(--label);
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: 0.06em;
  text-decoration: underline 1px #6e6e6e;
  text-underline-offset: 5px;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}

.projects-filters {
  top: var(--edge);
  right: var(--edge-x);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.projects-filters__label {
  margin-bottom: 0.875rem;
}

.projects-filters__trigger {
  display: none !important;
}

.projects-filters__list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.projects-mode {
  right: var(--edge-x);
  bottom: var(--edge);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.875rem;
}

.projects-mode__options > span {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
}

/* Over the grid's white page the switch is a dark pill. */
.projects-mode--grid {
  padding: 0.55rem 1.1rem;
  border-radius: 62.4375rem;
  background: rgb(0 0 0 / 0.72);
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.2);
  mix-blend-mode: normal;
  backdrop-filter: blur(0.75rem);
  -webkit-backdrop-filter: blur(0.75rem);
}

.projects-mode--grid .projects-mode__label {
  display: none;
}

.projects-mode__divider {
  color: #3c3c3c;
  font-size: var(--text);
}

.projects-about {
  --delay: 0.14s;
  top: 50%;
  right: var(--edge-x);
  font-size: var(--text);
  letter-spacing: 0.12em;
  text-decoration: none;
  text-transform: uppercase;
  translate: 0 -50%;
  transition: opacity 0.3s;
}

.projects-about:hover {
  opacity: 0.55;
}

/* Top left: the wordmark (home), the page's heading and the services. */
.projects-brand {
  position: fixed;
  z-index: 810;
  top: var(--edge);
  left: var(--edge-x);
  display: grid;
  justify-items: start;
  gap: 0.375rem;
  max-width: min(18rem, 42vw);
  color: var(--ink);
}

.projects-brand .projects-line {
  --delay: 0.1s;
}

.projects-brand__name {
  color: var(--ink);
  font-family: var(--app-font-display);
  font-size: var(--type-h4-size);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: var(--type-h4-ls);
  text-decoration: none;
}

.projects-brand__one {
  color: #03cb00;
}

.projects-brand h1 {
  margin: 0;
  color: var(--muted);
  font-size: var(--type-caption-size);
  font-weight: 400;
  line-height: var(--type-caption-lh);
  letter-spacing: var(--type-caption-ls);
}

.projects-brand__link {
  color: var(--ink);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  letter-spacing: var(--type-caption-ls);
  text-decoration: underline;
  text-underline-offset: 0.1875rem;
}

.projects-brand a:focus-visible {
  outline: 0.125rem solid #03cb00;
  outline-offset: 0.25rem;
}

.projects-empty {
  position: fixed;
  z-index: 805;
  top: 50%;
  left: 50%;
  margin: 0;
  color: var(--muted);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  translate: -50% -50%;
}

.projects-view-enter-active,
.projects-view-leave-active {
  transition: opacity 0.35s ease;
}

.projects-view-enter-from,
.projects-view-leave-to {
  opacity: 0;
}

/* Phones (the original's layout): the categories open from a label with a
   plus; "About" goes under them; the mode sits on one line. */
@media (max-width: 768px) {
  .projects-filters__label:not(.projects-filters__trigger),
  .projects-mode__label {
    display: none;
  }

  .projects-filters__trigger {
    display: inline-flex !important;
    align-items: center;
    color: #fff !important;
    font-family: var(--serif) !important;
    font-size: max(0.875rem, 1.25vw) !important;
    font-weight: 600;
    line-height: 1.6;
    letter-spacing: 0.06em !important;
    text-transform: uppercase;
  }

  .projects-filters__sign {
    position: relative;
    width: 0.56em;
    height: 0.56em;
    margin-left: 0.4em;
  }

  .projects-filters__sign::before,
  .projects-filters__sign::after {
    content: "";
    position: absolute;
    top: calc(50% - 0.5px);
    left: 0;
    width: 100%;
    height: 1px;
    background: currentColor;
    transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  .projects-filters__sign::after {
    transform: rotate(90deg);
  }

  .projects-filters.is-open .projects-filters__sign::after {
    transform: rotate(0deg);
  }

  .projects-filters__list li {
    max-height: 0;
    opacity: 0;
    transition: max-height 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.25s;
  }

  .projects-filters.is-open .projects-filters__list li {
    max-height: 2em;
    margin-top: 0.625rem;
    opacity: 1;
  }

  .projects-mode {
    flex-direction: row;
    bottom: calc(var(--edge) + env(safe-area-inset-bottom, 0px));
  }

  .projects-about {
    top: calc(var(--edge) + 2.5rem);
    translate: none;
  }

  .projects-filters.is-open ~ .projects-about {
    visibility: hidden;
  }

  /* The phone's category label waits for the opening, as the others do. */
  .projects-page:not(.is-live) .projects-filters__trigger,
  .projects-page.is-aside-out .projects-filters__trigger {
    visibility: hidden;
  }
}

@media (prefers-reduced-motion: reduce) {
  .projects-view-enter-active,
  .projects-view-leave-active,
  .projects-page.is-live .projects-line > * {
    transition: none;
  }
}

:global(html.projects-document),
:global(body.projects-document) {
  overflow: hidden;
  overscroll-behavior: none;
  background: #f7f5f2;
}

:global(html.projects-grid-document),
:global(body.projects-grid-document) {
  background: #fff;
}
</style>
