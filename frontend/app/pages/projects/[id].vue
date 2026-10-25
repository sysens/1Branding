<!-- app/pages/projects/[id].vue -->
<script setup lang="ts">
import Spinner from "~/components/Spinner.vue";

import ColorSection from "~/components/project/ColorSection.vue";
import ProjectBigPic from "~/components/project/ProjectBigPic.vue";
import ProjectGrid from "~/components/project/ProjectGrid.vue";
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { isPlaceholderCopy, toMetaDescription } from "~/utils/seo";
import { isSiteLocale } from "~/utils/locales";

const { t } = useI18n();

const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap }) => {
    const el = root.value;
    if (!el) return;

    const title = el.querySelector<HTMLElement>(".hero-title");
    const text = el.querySelector<HTMLElement>(".hero-text");

    if (title) {
      gsap.fromTo(
        title,
        { x: -160, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
      );
    }

    if (text) {
      gsap.fromTo(
        text,
        { x: 160, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
      );
    }
  });

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

type Media = { url: string | null; documentId?: string | null };

type ProjectsPage = {
  slug?: string | null;
  locale?: string | null;
  localizations?: Array<{ locale?: string | null } | null> | null;
  projectColor?: string | null;

  section1: {
    projectTitle: string;
    text: string;
    images_connection: { nodes: Media[] } | null;
  } | null;

  section2: {
    title: string;
    text: string;
    id: string;
    image: Media | null;
  } | null;

  section3: {
    id: string;
    title: string;
    text: string;
    colorCard: Array<{ HexColorCode: string; id: string }> | null;
  } | null;
};

type GqlRes = {
  data?: {
    projectsPage?: ProjectsPage | null;
    fallbackProjectsPage?: ProjectsPage | null;
  };
  errors?: Array<{ message: string }>;
};

const query = `
  query ProjectsPage($documentId: ID!, $locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    projectsPage(documentId: $documentId, locale: $locale) {
      slug
      locale
      localizations { locale }
      projectColor
      section1 {
        projectTitle
        text
        images_connection {
          nodes { url }
        }
      }
      section2 {
        title
        text
        id
        image {
          documentId
          url
        }
      }
      section3 {
        id
        title
        text
        colorCard {
          HexColorCode
          id
        }
      }
    }
    fallbackProjectsPage: projectsPage(documentId: $documentId, locale: $fallbackLocale) {
      slug
      projectColor
      section1 {
        projectTitle
        text
        images_connection {
          nodes { url }
        }
      }
      section2 {
        title
        text
        id
        image {
          documentId
          url
        }
      }
      section3 {
        id
        title
        text
        colorCard {
          HexColorCode
          id
        }
      }
    }
  }
`;

const { data, error, pending } = await useCmsQuery<NonNullable<GqlRes["data"]>>(
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
const section2 = computed(() => page.value?.section2 ?? null);
const section3 = computed(() => page.value?.section3 ?? null);

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
  toMetaDescription(section1.value?.text || section2.value?.text) ||
  t("seo.projectDescription", { title: projectName.value || "OneBranding" })
);
// The languages this case study is written in (its hreflang alternates).
const projectLocales = computed(() => {
  const own = data.value?.data?.projectsPage;
  if (!own) return [];
  return [own.locale, ...(own.localizations ?? []).map((entry) => entry?.locale)].filter(isSiteLocale);
});
const seoImage = computed(() => cmsMedia(
  section1.value?.images_connection?.nodes?.[0]?.url || section2.value?.image?.url
));

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

const resolveMedia = cmsMedia;

const images = computed(() => {
  const nodes = section1.value?.images_connection?.nodes ?? [];
  return nodes.map((m) => resolveMedia(m?.url ?? "")).filter(Boolean);
});

const s2Image = computed(() => resolveMedia(section2.value?.image?.url ?? null));

const gqlErrors = computed(
  () => data.value?.errors?.map((e) => e.message).join(" | ") || ""
);

const topSrc = computed(() => images.value[0] || "");
const bottomLeftSrc = computed(() => images.value[1] || "");
const bottomRightSrc = computed(() => images.value[2] || "");

const projectImages = computed(() => images.value);

const normalizedColor = computed(() => {
  const c = (page.value?.projectColor || "").trim();
  if (!c) return "";
  if (c.startsWith("#")) return c;
  return "#" + c;
});

const headerGlowStyle = computed(() => {
  const c = normalizedColor.value;
  if (!c) return {};
  return {
    background: `radial-gradient(ellipse at center, ${c}70 0%, ${c}35 35%, transparent 70%)`,
    filter: "blur(26px)",
    opacity: "0.9",
  } as Record<string, string>;
});

// A partial GraphQL error must not keep the full-screen spinner up forever.
const loading = computed(() => pending.value || !data.value);
</script>

<template>
  <div ref="root" class="relative overflow-x-hidden bg-black">
    <Spinner v-if="loading" :size="542" />

    <div class="edge-gradient edge-gradient-left edge-gradient-strong"/>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"/>

    <div class="relative z-10">
      <div class="bg-cover bg-center bg-no-repeat">
        <div class="relative md:pt-[3.75rem] pt-[1.875rem]">
          <div
            class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 -z-10 h-[8.75rem] w-[92%] max-w-[87.5rem] rounded-full"
            :style="headerGlowStyle"
          />
          <div class="m"/>

          <div
            class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1 -z-10 h-[27.5rem] w-[92%] max-w-[87.5rem] rounded-full"
            :style="headerGlowStyle"
          />
        </div>

        <div class="md:py-[7.1875rem] md:pt-[7.125rem] pt-[1.25rem]">
          <div
            v-if="section1"
            class="md:flex containerr gap-[9.1875rem] mt-[7.5rem] items-center justify-between"
          >
            <div class="flex-1">
              <h1
                class="hero-title type-h2 flex-1 text-[#FFFFFF] md:text-start text-center md:pb-0 pb-[2.5rem]"
              >
                {{ section1.projectTitle }}
              </h1>
            </div>

            <!-- The project's description is running text: left-aligned on
                 phones too, at a reading measure. -->
            <div class="flex-1">
              <p
                class="hero-text type-body type-measure text-[#FFFFFF] text-left md:pb-0 pb-[3.125rem]"
              >
                {{ section1.text }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1 -z-10 h-[27.5rem] w-[92%] max-w-[87.5rem] rounded-full"
        :style="headerGlowStyle"
      />

      <div>
        <ProjectGrid
          v-if="!loading"
          :title="projectName"
          :images="projectImages"
          :top-src="topSrc"
          :bottom-left-src="bottomLeftSrc"
          :bottom-right-src="bottomRightSrc"
        />

        <ProjectBigPic
          v-if="!loading"
          :title="section2?.title"
          :text="section2?.text"
          :image="s2Image"
        />
      </div>

      <ColorSection
        v-if="!loading"
        :title="section3?.title"
        :text="section3?.text"
        :colors="section3?.colorCard"
      />

      <!-- From a case study to the services behind it and to a brief. -->
      <section v-if="!loading" class="containerr project-next" aria-labelledby="project-next-title">
        <h2 id="project-next-title">{{ $t("project.more") }}</h2>
        <p>
          <NuxtLink :to="localePath('/services')">{{ $t("project.services") }}</NuxtLink>
          <NuxtLink :to="`${localePath('/contact')}#contact-request`" class="project-next__cta ob-button">{{ $t("project.contact") }}</NuxtLink>
        </p>
      </section>

      <div v-if="!GRAPHQL_URL || error || gqlErrors" class="hidden">
        {{ !GRAPHQL_URL ? $t("common.graphqlUrlEmpty") : "" }}
        {{ (error as any)?.message || "" }}
        {{ gqlErrors }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-next {
  padding-bottom: 7.5rem;
  text-align: center;
}

.project-next h2 {
  margin: 0 0 1.75rem;
  color: #fff;
  font-family: var(--app-font-display);
  font-size: var(--type-h3-size);
  line-height: var(--type-h3-lh);
  letter-spacing: var(--type-h3-ls);
  font-weight: 600;
}

.project-next p {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem 1.75rem;
  align-items: center;
}

/* The text links (the call to action is the shared .ob-button). */
.project-next a:not(.ob-button) {
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
</style>
