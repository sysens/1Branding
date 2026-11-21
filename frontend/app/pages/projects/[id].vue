<!-- app/pages/projects/[id].vue -->
<script setup lang="ts">
// A case study from the CMS, laid out as the Art-Anor page (its blocks and
// their order: utils/caseStories.ts): the logo or the name, the project's text,
// its pictures edge to edge, the old logo and the new one, the mark beside a few
// large lines, a large heading, the palette, the guideline pages, the closing
// line. buildCmsStory() (utils/cmsStory.ts) makes the blocks from the entry's
// fields ("Project: Art-Anor template" in the CMS holds most of them) and
// leaves out what is empty; CaseStory draws them; a click on a picture opens
// it large. The grid on /projects opens the page.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import CaseNext from "~/components/case-study/CaseNext.vue";
import CaseStory from "~/components/case-study/CaseStory.vue";
import { casePlainText, type CaseStudyEntry } from "~/utils/caseStudy";
import { buildCmsStory, type CmsStoryEntry } from "~/utils/cmsStory";
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

// What the page can do without is asked for on its own: the project's colour
// and logo (the heading's) and the statement block. Railway deploys the site
// and the CMS side by side, so a field may not be in the CMS yet: then this
// request alone fails, and the page takes the colour from the palette, sets
// the heading in type and shows the site's own statement.
const extrasQuery = `
  query ProjectExtras($documentId: ID!, $locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    projectsPage(documentId: $documentId, locale: $locale) {
      projectColor
      projectLogo { url width height }
      brandSystem {
        statement
        title
        text
        image { url width height alternativeText }
      }
    }
    fallbackProjectsPage: projectsPage(documentId: $documentId, locale: $fallbackLocale) {
      projectColor
      projectLogo { url width height }
      brandSystem {
        statement
        title
        text
        image { url width height alternativeText }
      }
    }
  }
`;

type Extras = Pick<CmsStoryEntry, "brandSystem" | "projectColor" | "projectLogo">;
type ExtrasRes = {
  projectsPage?: Extras | null;
  fallbackProjectsPage?: Extras | null;
};

// The Art-Anor template's parts ("Project: Art-Anor template"), asked for on
// their own like the extras above, for the same reason: a CMS without them
// yet fails this request alone and the page shows what it has.
const storyQuery = `
  query ProjectStory($documentId: ID!, $locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    projectsPage(documentId: $documentId, locale: $locale) {
      story {
        logoBefore { url width height alternativeText }
        logoAfter { url width height alternativeText }
        logoText
        gallery(pagination: { limit: 60 }) { url width height alternativeText }
        mark { url width height alternativeText }
        statement
        moreGallery(pagination: { limit: 60 }) { url width height alternativeText }
        detailsTitle
        detailsText
        guidePages(pagination: { limit: 60 }) { url width height alternativeText }
        closing
      }
    }
    fallbackProjectsPage: projectsPage(documentId: $documentId, locale: $fallbackLocale) {
      story {
        logoBefore { url width height alternativeText }
        logoAfter { url width height alternativeText }
        gallery(pagination: { limit: 60 }) { url width height alternativeText }
        mark { url width height alternativeText }
        moreGallery(pagination: { limit: 60 }) { url width height alternativeText }
        guidePages(pagination: { limit: 60 }) { url width height alternativeText }
      }
    }
  }
`;

type Story = NonNullable<CmsStoryEntry["story"]>;
type StoryRes = {
  projectsPage?: { story?: Story | null } | null;
  fallbackProjectsPage?: { story?: Story | null } | null;
};

const [{ data, error }, { data: extrasData }, { data: storyData }] = await Promise.all([
  useCmsQuery<NonNullable<GqlRes["data"]>>(
    () => `project-${documentId.value}`,
    query,
    { variables: () => ({ documentId: documentId.value }) }
  ),
  useCmsQuery<ExtrasRes>(
    () => `project-extras-${documentId.value}`,
    extrasQuery,
    { variables: () => ({ documentId: documentId.value }) }
  ),
  useCmsQuery<StoryRes>(
    () => `project-story-${documentId.value}`,
    storyQuery,
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

// The extras of the same entry as the rest of the page. Pictures and the
// colour are the same in every language, so the English entry fills in what
// this one lacks.
const extras = computed<Extras>(() => {
  const own = extrasData.value?.data?.projectsPage;
  const fallback = extrasData.value?.data?.fallbackProjectsPage;
  const system = own ? own.brandSystem : fallback?.brandSystem;
  const picture = fallback?.brandSystem?.image;
  return {
    projectColor: own?.projectColor || fallback?.projectColor,
    projectLogo: own?.projectLogo?.url ? own.projectLogo : fallback?.projectLogo,
    brandSystem: system?.image?.url || !picture?.url ? system : { ...system, image: picture },
  };
});

// The template's parts: the words of this language's entry; its pictures,
// the same in every language, from the English one where this one has none.
const storyParts = computed<Story | null>(() => {
  const own = storyData.value?.data?.projectsPage?.story ?? null;
  const fallback = storyData.value?.data?.fallbackProjectsPage?.story ?? null;
  if (!fallback) return own;
  const one = (key: "logoBefore" | "logoAfter" | "mark") => (own?.[key]?.url ? own[key] : fallback[key]);
  const many = (key: "gallery" | "moreGallery" | "guidePages") => (own?.[key]?.length ? own[key] : fallback[key]);
  return {
    ...own,
    logoBefore: one("logoBefore"),
    logoAfter: one("logoAfter"),
    mark: one("mark"),
    gallery: many("gallery"),
    moreGallery: many("moreGallery"),
    guidePages: many("guidePages"),
  };
});

const story = computed(() =>
  buildCmsStory(
    { ...page.value, section1: section1.value && { ...section1.value, images: images.value }, ...extras.value, story: storyParts.value },
    cmsMedia,
    { untitled: t("project.untitled"), palette: t("project.palette"), before: t("project.logoBefore"), after: t("project.logoAfter") }
  )
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
    <CaseStory :story="story" />
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
