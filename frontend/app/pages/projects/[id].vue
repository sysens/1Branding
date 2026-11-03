<!-- app/pages/projects/[id].vue -->
<script setup lang="ts">
// A case study: a white page with one centred column of sections (the
// heading, the project's text, its pictures in rounded cards, the palette),
// built from the CMS entry by buildCaseSections() (utils/caseStudy.ts) and
// rendered by CaseSections. The slider and the grid on /projects open it.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import CaseSections from "~/components/case-study/CaseSections.vue";
import { buildCaseSections, casePlainText, type CaseStudyEntry } from "~/utils/caseStudy";
import { isPlaceholderCopy, toMetaDescription } from "~/utils/seo";
import { isSiteLocale } from "~/utils/locales";

const { t } = useI18n();

const GRAPHQL_URL = useGraphqlUrl();
const cmsMedia = useCmsMedia();

const route = useRoute();
// The address carries the case study's slug (or, on old links, its documentId).
const routeKey = computed(() => String(route.params.id || "").trim());
const documentId = await useCmsDocumentId("projectsPages", routeKey);

definePageMeta({ key: (route) => route.fullPath });
if (!documentId.value) {
  throw createError({ statusCode: 404, statusMessage: "Project not found" });
}
if (!GRAPHQL_URL) {
  throw createError({ statusCode: 503, statusMessage: "Project content is unavailable" });
}

type Media = { url: string | null; width?: number | null; height?: number | null };

type ProjectsPage = Omit<CaseStudyEntry, "section1"> & {
  slug?: string | null;
  locale?: string | null;
  localizations?: Array<{ locale?: string | null } | null> | null;
  section1: {
    projectTitle: string;
    text: string;
    images_connection: { nodes: Media[] } | null;
  } | null;
};

type GqlRes = {
  data?: {
    projectsPage?: ProjectsPage | null;
    fallbackProjectsPage?: ProjectsPage | null;
  };
  errors?: Array<{ message: string }>;
};

// Written out in full (no interpolation): scripts/dynamicSeo.test.ts parses it.
const query = `
  query ProjectsPage($documentId: ID!, $locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    projectsPage(documentId: $documentId, locale: $locale) {
      slug
      locale
      localizations { locale }
      category { categoryName }
      tags { label }
      section1 {
        projectTitle
        text
        images_connection {
          nodes { url width height }
        }
      }
      section2 {
        title
        text
        image { url width height }
      }
      section3 {
        title
        text
        colorCard { HexColorCode }
      }
    }
    fallbackProjectsPage: projectsPage(documentId: $documentId, locale: $fallbackLocale) {
      slug
      category { categoryName }
      tags { label }
      section1 {
        projectTitle
        text
        images_connection {
          nodes { url width height }
        }
      }
      section2 {
        title
        text
        image { url width height }
      }
      section3 {
        title
        text
        colorCard { HexColorCode }
      }
    }
  }
`;

const { data, error } = await useCmsQuery<NonNullable<GqlRes["data"]>>(
  () => `project-${documentId.value}`,
  query,
  { variables: () => ({ documentId: documentId.value }) }
);

const page = computed(
  () =>
    data.value?.data?.projectsPage ??
    data.value?.data?.fallbackProjectsPage ??
    null
);

if (error.value || (!page.value && (data.value?.errors?.length || !data.value?.data))) {
  throw createError({ statusCode: 502, statusMessage: "Unable to load project" });
}
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Project not found" });
}

// An old link by documentId moves for good to the readable address.
const slug = computed(() => page.value?.slug?.trim() || "");
if (slug.value && routeKey.value !== slug.value) {
  await navigateTo(useLocalePath()(`/projects/${slug.value}`), { redirectCode: 301 });
}

const section1 = computed(() => page.value?.section1 ?? null);
const images = computed(() => section1.value?.images_connection?.nodes ?? []);

const sections = computed(() =>
  page.value
    ? buildCaseSections(
        { ...page.value, section1: section1.value && { ...section1.value, images: images.value } },
        cmsMedia,
        { palette: t("project.palette") }
      )
    : []
);

const projectName = computed(() => section1.value?.projectTitle?.trim() || "");
// Search results show about 60 characters: a case study's name already says
// what was made ("Raviosta: logo and identity for an Italian restaurant"), so
// "— branding case study" is added only when it still fits.
const seoTitle = computed(() => {
  if (!projectName.value) return t("seo.projects.title");
  const withKind = `${projectName.value} — ${t("seo.project")}`;
  return withKind.length <= 60 ? withKind : projectName.value;
});
const seoDescription = computed(() =>
  toMetaDescription(casePlainText(section1.value?.text || page.value?.section2?.text)) ||
  t("seo.projectDescription", { title: projectName.value || "OneBranding" })
);
// The languages this case study is written in (its hreflang alternates).
const projectLocales = computed(() => {
  const own = data.value?.data?.projectsPage;
  if (!own) return [];
  return [own.locale, ...(own.localizations ?? []).map((entry) => entry?.locale)].filter(isSiteLocale);
});
const seoImage = computed(() => cmsMedia(images.value[0]?.url || page.value?.section2?.image?.url));

const localePath = useLocalePath();
const origin = useSiteOrigin();
usePageSeo({
  title: seoTitle,
  description: seoDescription,
  type: "website",
  image: seoImage,
  imageAlt: projectName,
  breadcrumbs: computed(() => [
    { name: t("nav.projects"), path: localePath("/projects") },
    { name: projectName.value || t("seo.project"), path: route.path },
  ]),
  structuredData: computed(() => ({
    "@type": "CreativeWork",
    name: projectName.value || seoTitle.value,
    description: seoDescription.value,
    url: `${origin}${route.path}`,
    ...(seoImage.value ? { image: seoImage.value } : {}),
    inLanguage: page.value?.locale || "en",
    creator: { "@id": `${origin}/#organization` },
  })),
  // Dummy case studies ("Lorem ipsum…") stay out of the index until filled in.
  indexable: computed(() =>
    !("preview" in route.query || "draft" in route.query) &&
    !!data.value?.data?.projectsPage &&
    !isPlaceholderCopy(`${projectName.value} ${seoDescription.value}`)
  ),
  alternates: projectLocales,
});

// The page is white to its edges, also where the browser overscrolls.
useHead({ bodyAttrs: { class: "case-study-document" } });
</script>

<template>
  <div class="case-study">
    <CaseSections class="case-study__column" :sections="sections" />

    <!-- From a case study to the services behind it and to a brief. -->
    <section class="case-study__column case-next" aria-labelledby="project-next-title">
      <h2 id="project-next-title">{{ $t("project.more") }}</h2>
      <p>
        <NuxtLink :to="localePath('/services')">{{ $t("project.services") }}</NuxtLink>
        <NuxtLink :to="`${localePath('/contact')}#contact-request`" class="case-next__cta ob-button">{{ $t("project.contact") }}</NuxtLink>
      </p>
    </section>
  </div>
</template>

<style scoped>
/* Below the site's floating header; the column is 80% of the screen (the
   design's 1152px at 1440), the screen less 20px margins on phones. */
.case-study {
  min-height: 100vh;
  padding-top: clamp(8.5rem, 9vw, 9.5rem);
  background: #fff;
  color: #111;
}

.case-study__column {
  width: min(100% - 2.5rem, 80 * var(--fvw));
  margin-inline: auto;
}

@media (max-width: 767px) {
  .case-study__column {
    width: calc(100% - 2.5rem);
  }
}

.case-next {
  padding-block: clamp(5rem, 9vw, 9rem) clamp(5rem, 8vw, 8rem);
  text-align: center;
}

.case-next h2 {
  margin: 0 0 1.75rem;
  color: #111;
  font-family: var(--app-font-display);
  font-size: var(--type-h3-size);
  line-height: var(--type-h3-lh);
  letter-spacing: var(--type-h3-ls);
  font-weight: 600;
}

.case-next p {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem 1.75rem;
  align-items: center;
  margin: 0;
}

/* The text link (the call to action is the shared .ob-button). */
.case-next a:not(.ob-button) {
  color: #111;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

:global(body.case-study-document) {
  background: #fff;
}
</style>
