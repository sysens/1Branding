<!-- app/pages/projects/[id].vue -->
<script setup lang="ts">
// A case study: a white page with one centred column of sections (the
// heading, the project's text, its pictures in rounded cards, the statement
// beside its illustration, the palette),
// built from the CMS entry by buildCaseSections() (utils/caseStudy.ts) and
// rendered by CaseSections. The slider and the grid on /projects open it.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import CaseNext from "~/components/case-study/CaseNext.vue";
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

// The block under the cover (CaseStatement) is asked for on its own: while
// the CMS has no such fields yet (Railway deploys the site and the CMS side
// by side) this request alone fails and the block shows the site's own copy.
// Once the CMS has them, the fields can join the query above.
const statementQuery = `
  query ProjectStatement($documentId: ID!, $locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    projectsPage(documentId: $documentId, locale: $locale) {
      brandSystem {
        statement
        title
        text
        image { url width height alternativeText }
      }
    }
    fallbackProjectsPage: projectsPage(documentId: $documentId, locale: $fallbackLocale) {
      brandSystem {
        statement
        title
        text
        image { url width height alternativeText }
      }
    }
  }
`;

type StatementRes = {
  projectsPage?: Pick<CaseStudyEntry, "brandSystem"> | null;
  fallbackProjectsPage?: Pick<CaseStudyEntry, "brandSystem"> | null;
};

const [{ data, error }, { data: statementData }] = await Promise.all([
  useCmsQuery<NonNullable<GqlRes["data"]>>(
    () => `project-${documentId.value}`,
    query,
    { variables: () => ({ documentId: documentId.value }) }
  ),
  useCmsQuery<StatementRes>(
    () => `project-statement-${documentId.value}`,
    statementQuery,
    { variables: () => ({ documentId: documentId.value }) }
  ),
]);

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

// The statement block of the same entry as the rest of the page; its picture
// is the same in every language, so the English one fills in.
const brandSystem = computed(() => {
  const own = statementData.value?.data?.projectsPage;
  const fallback = statementData.value?.data?.fallbackProjectsPage?.brandSystem;
  const system = own ? own.brandSystem : fallback;
  return system?.image?.url || !fallback?.image?.url ? system : { ...system, image: fallback.image };
});

const caseCopy = useCaseCopy();
const sections = computed(() =>
  page.value
    ? buildCaseSections(
        { ...page.value, section1: section1.value && { ...section1.value, images: images.value }, brandSystem: brandSystem.value },
        cmsMedia,
        caseCopy.value
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
    <CaseNext class="case-study__column" />
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

:global(body.case-study-document) {
  background: #fff;
}
</style>
