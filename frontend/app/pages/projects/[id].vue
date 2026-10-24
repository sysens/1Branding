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
const documentId = computed(() => String(route.params.id || "").trim());

definePageMeta({ key: (route) => route.fullPath });
if (!documentId.value) {
  throw createError({ statusCode: 404, statusMessage: "Project not found" });
}
if (!GRAPHQL_URL) {
  throw createError({ statusCode: 503, statusMessage: "Project content is unavailable" });
}

type Media = { url: string | null; documentId?: string | null };

type ProjectsPage = {
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

const section1 = computed(() => page.value?.section1 ?? null);
const section2 = computed(() => page.value?.section2 ?? null);
const section3 = computed(() => page.value?.section3 ?? null);

const projectName = computed(() => section1.value?.projectTitle?.trim() || "");
const seoTitle = computed(() =>
  projectName.value ? `${projectName.value} — ${t("seo.project")}` : t("seo.projects.title")
);
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
        <div class="relative md:pt-[60px] pt-[30px]">
          <div
            class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 -z-10 h-[140px] w-[92%] max-w-[1400px] rounded-full"
            :style="headerGlowStyle"
          />
          <div class="m"/>

          <div
            class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1 -z-10 h-[440px] w-[92%] max-w-[1400px] rounded-full"
            :style="headerGlowStyle"
          />
        </div>

        <div class="md:py-[115px] md:pt-[114px] pt-[20px]">
          <div
            v-if="section1"
            class="md:flex containerr gap-[147px] mt-[120px] items-center justify-between"
          >
            <div class="flex-1">
              <h1
                class="hero-title flex-1 font-normal text-[#FFFFFF] md:text-[62px] leading-[120%] tracking-[0] text-[40px] md:text-start text-center md:pb-0 pb-[40px]"
              >
                {{ section1.projectTitle }}
              </h1>
            </div>

            <div class="flex-1">
              <p
                class="hero-text font-normal md:text-[16px] text-[#FFFFFF] md:tracking-[0] text-[13px] leading-[120%] tracking-normal md:text-start text-center md:pb-0 pb-[50px] font-['Poppins','Inter',sans-serif]"
              >
                {{ section1.text }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1 -z-10 h-[440px] w-[92%] max-w-[1400px] rounded-full"
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
          <NuxtLink :to="`${localePath('/contact')}#contact-request`" class="project-next__cta">{{ $t("project.contact") }}</NuxtLink>
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
  padding-bottom: 120px;
  text-align: center;
}

.project-next h2 {
  margin: 0 0 28px;
  color: #fff;
  font-size: clamp(2rem, 3.4vw, 3.5rem);
  font-weight: 400;
}

.project-next p {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px 28px;
  align-items: center;
}

.project-next a {
  color: #fff;
  font-size: 18px;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.project-next a.project-next__cta {
  padding: 16px 32px;
  border-radius: 32px;
  background: url("/home/Component3.png") 100% 50% / 120%;
  text-decoration: none;
}
</style>
