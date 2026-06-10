<script setup lang="ts">
import { computed, ref, watch } from "vue";

type AppLocale = "ru" | "en";

type Media = { url: string | null };

type ProjectNode = {
  documentId: string;
  projectColor?: string | null;
  projectLogo?: Media | null;
  tags?: Array<{ label?: string | null } | null> | null;
  section1: {
    projectTitle?: string | null;
    text?: string | null;
    images?: Media[] | null;
  } | null;
  category?: { categoryName?: string | null } | null;
} | null;

type GqlRes = {
  data?: {
    projectsPages_connection?: { nodes?: ProjectNode[] } | null;
  };
  errors?: Array<{ message: string }>;
};

type Props = {
  pageSize?: number;
};

const props = withDefaults(defineProps<Props>(), {
  pageSize: 5,
});

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

const { locale } = useI18n();
const localePath = useLocalePath();

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);
const fallbackLocale: AppLocale = "en";

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

const BRAND_ACCENT = "#03CB00";

const sanitizeColor = (value?: string | null) => {
  const color = String(value || "").trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : BRAND_ACCENT;
};

const page = ref(1);
const isLoading = ref(false);
const hasMore = ref(true);
const allProjects = ref<ProjectNode[]>([]);

// `projectLogo` / `tags` only exist after the backend deploy — fall back to the
// base query when the production schema rejects them.
const extendedSupported = ref(true);

const makeQuery = (p: number, ps: number, extended: boolean) => `
  query ProjectsShowcase($locale: I18NLocaleCode) {
    projectsPages_connection(pagination: { page: ${p}, pageSize: ${ps} }, locale: $locale) {
      nodes {
        documentId
        projectColor
        ${extended ? "projectLogo { url }" : ""}
        ${extended ? "tags { label }" : ""}
        section1 {
          projectTitle
          text
          images { url }
        }
        category {
          categoryName
        }
      }
    }
  }
`;

const runQuery = async (p: number, localeValue: AppLocale, extended: boolean) => {
  const res = await $fetch<GqlRes>(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      query: makeQuery(p, props.pageSize, extended),
      variables: { locale: localeValue },
    },
  });
  return res;
};

const fetchProjectsPage = async (p: number, localeValue: AppLocale) => {
  let res: GqlRes | null = null;

  if (extendedSupported.value) {
    try {
      res = await runQuery(p, localeValue, true);
      if (res?.errors?.length && !res?.data?.projectsPages_connection) {
        extendedSupported.value = false;
        res = null;
      }
    } catch {
      extendedSupported.value = false;
      res = null;
    }
  }

  if (!res) {
    res = await runQuery(p, localeValue, false);
  }

  const nodes = res?.data?.projectsPages_connection?.nodes ?? [];
  return nodes.filter(Boolean) as ProjectNode[];
};

const fetchPage = async (p: number) => {
  if (!GRAPHQL_URL) return;
  if (isLoading.value) return;
  if (!hasMore.value && p !== 1) return;

  isLoading.value = true;
  try {
    let clean = await fetchProjectsPage(p, gqlLocale.value);
    if (!clean.length && gqlLocale.value !== fallbackLocale) {
      clean = await fetchProjectsPage(p, fallbackLocale);
    }

    if (p === 1) {
      allProjects.value = clean;
      hasMore.value = true;
    } else {
      allProjects.value = [...allProjects.value, ...clean];
    }

    if (clean.length < props.pageSize) hasMore.value = false;
    page.value = p;
  } finally {
    isLoading.value = false;
  }
};

await fetchPage(1);

const loadMore = async () => {
  if (!hasMore.value) return;
  await fetchPage(page.value + 1);
};

const prevLocale = ref<AppLocale>(gqlLocale.value);
if (process.client) {
  watch(gqlLocale, async (v) => {
    if (prevLocale.value === v) return;
    prevLocale.value = v;
    page.value = 1;
    hasMore.value = true;
    await fetchPage(1);
  });
}

type ShowcaseItem = {
  key: string;
  title: string;
  text: string;
  tags: string[];
  accent: string;
  logo: string;
  image: string;
  to: string;
};

const projectsView = computed<ShowcaseItem[]>(() => {
  return (allProjects.value ?? [])
    .map((p, idx) => {
      const id = p?.documentId?.trim() || "";
      if (!id) return null;

      const cmsTags = (p?.tags ?? [])
        .map((t) => t?.label?.trim() || "")
        .filter(Boolean);
      const category = p?.category?.categoryName?.trim() || "";
      const tags = cmsTags.length ? cmsTags : category ? [category] : [];

      return {
        key: `${idx}-${id}`,
        title: p?.section1?.projectTitle?.trim() || "",
        text: p?.section1?.text?.trim() || "",
        tags,
        accent: sanitizeColor(p?.projectColor),
        logo: resolveMedia(p?.projectLogo?.url),
        image: resolveMedia(p?.section1?.images?.[0]?.url),
        to: localePath({ path: `/ProjectSlug/${id}` }),
      };
    })
    .filter(Boolean) as ShowcaseItem[];
});
</script>

<template>
  <section class="projects-showcase">
    <div class="projects-showcase__list">
      <article
        v-for="item in projectsView"
        :key="item.key"
        class="project-feature"
        :style="{ '--accent': item.accent }"
      >
        <div class="project-feature__info">
          <div v-if="item.logo" class="project-feature__logo">
            <img :src="item.logo" :alt="item.title" loading="lazy" draggable="false" />
          </div>

          <h2 v-if="item.title" class="project-feature__title">{{ item.title }}</h2>

          <p v-if="item.text" class="project-feature__text">{{ item.text }}</p>

          <NuxtLink :to="item.to" class="project-feature__btn">
            {{ $t("projectsPage.viewProject") }}
          </NuxtLink>

          <div v-if="item.tags.length" class="project-feature__tags">
            <span v-for="tag in item.tags" :key="tag" class="project-feature__tag">
              {{ tag }}
            </span>
          </div>
        </div>

        <NuxtLink
          :to="item.to"
          class="project-feature__media"
          :aria-label="item.title || $t('projectsPage.viewProject')"
        >
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.title"
            loading="lazy"
            draggable="false"
          />
        </NuxtLink>
      </article>
    </div>

    <div v-if="hasMore" class="projects-showcase__more">
      <button
        type="button"
        :disabled="isLoading"
        @click="loadMore"
        class="text-white bg-[url('/home/Component3.png')] md:w-[260px] w-[219px] md:h-[60px] h-[50px] rounded-[32px] bg-[size:120%] bg-[position:100%_50%] transition-[background-position,background-size,box-shadow] duration-1000 ease-[cubic-bezier(.4,0,.2,1)] hover:bg-[size:140%] hover:bg-[position:0%_50%] hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] disabled:opacity-60 disabled:cursor-not-allowed font-['Poppins','Inter',sans-serif]"
      >
        <span v-if="!isLoading">{{ $t("common.showMore") }}</span>
        <span v-else>{{ $t("common.loading") }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.projects-showcase {
  position: relative;
  z-index: 1;
  width: min(100%, 1680px);
  margin-inline: auto;
  padding: clamp(2.5rem, 5vw, 5rem) clamp(0.6rem, 1.6vw, 1.5rem) clamp(3rem, 5vw, 5rem);
}

.projects-showcase__list {
  display: flex;
  flex-direction: column;
  gap: clamp(0.85rem, 1.6vw, 1.4rem);
}

/* ---------- one project row: narrow info card + wide media, full-screen tall ---------- */
.project-feature {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: clamp(0.35rem, 0.5rem, 1.4rem);
  min-height: clamp(34rem, 88vh, 58rem);
}

/* ---------- info card (left) ---------- */
.project-feature__info {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 1.7vw, 1.5rem);
  padding: clamp(5rem, 7vw, 7rem) clamp(1.25rem, 2.2vw, 2.25rem) clamp(1.75rem, 3vw, 3rem);
  border-radius: clamp(1.4rem, 2vw, 1.9rem);
  text-align: center;
  background:
    radial-gradient(130% 70% at 50% -12%, rgba(255, 255, 255, 0.22), transparent 62%),
    linear-gradient(
      180deg,
      var(--accent) 0%,
      color-mix(in srgb, var(--accent) 78%, #000000) 62%,
      color-mix(in srgb, var(--accent) 52%, #000000) 100%
    );
}

/* company logo slot pinned to the top of the card */
.project-feature__logo {
  position: absolute;
  top: clamp(1.75rem, 3vw, 2.75rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 70%;
}

.project-feature__logo img {
  max-height: clamp(2rem, 3vw, 3rem);
  max-width: 100%;
  object-fit: contain;
}

.project-feature__title {
  margin: 0;
  color: #ffffff;
  font-family: var(--app-font-display, "SF Pro Display", sans-serif);
  font-size: clamp(1.8rem, 2.6vw, 2.8rem);
  font-weight: 600;
  line-height: 1.12;
  text-wrap: balance;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-feature__text {
  margin: 0;
  max-width: 22rem;
  color: rgba(255, 255, 255, 0.86);
  font-family: "Poppins", "Inter", sans-serif;
  font-size: clamp(0.9rem, 1.05vw, 1.05rem);
  font-weight: 300;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-feature__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.7rem 1.9rem;
  border-radius: 9999px;
  background: #ffffff;
  color: #050505;
  font-family: "Poppins", "Inter", sans-serif;
  font-size: clamp(0.9rem, 1vw, 1.05rem);
  font-weight: 500;
  text-decoration: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.project-feature__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.6rem 1.8rem rgba(0, 0, 0, 0.35);
}

.project-feature__tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  max-width: 24rem;
  margin-top: clamp(0.6rem, 1.4vw, 1.4rem);
}

.project-feature__tag {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.92);
  font-family: "Poppins", "Inter", sans-serif;
  font-size: clamp(0.78rem, 0.9vw, 0.95rem);
  font-weight: 400;
  backdrop-filter: blur(4px);
}

/* ---------- media card (right) ---------- */
.project-feature__media {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: clamp(1.4rem, 2vw, 1.9rem);
  background:
    radial-gradient(
      110% 110% at 78% 18%,
      color-mix(in srgb, var(--accent) 52%, #000000) 0%,
      color-mix(in srgb, var(--accent) 26%, #000000) 64%,
      color-mix(in srgb, var(--accent) 14%, #000000) 100%
    );
}

.project-feature__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

/* colored glow rising from the bottom-left corner over the image */
.project-feature__media::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(
      95% 80% at 0% 100%,
      color-mix(in srgb, var(--accent) 72%, transparent) 0%,
      color-mix(in srgb, var(--accent) 38%, transparent) 34%,
      transparent 62%
    ),
    linear-gradient(
      200deg,
      transparent 55%,
      color-mix(in srgb, var(--accent) 28%, transparent) 100%
    );
  pointer-events: none;
}

.project-feature__media:hover img {
  transform: scale(1.03);
}

/* ---------- show more ---------- */
.projects-showcase__more {
  display: flex;
  justify-content: center;
  padding-top: clamp(2rem, 3.5vw, 3.5rem);
}

/* ---------- mobile ---------- */
@media (max-width: 900px) {
  .project-feature {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .project-feature__info {
    order: 2;
    padding: 5rem 1.25rem 2rem;
  }

  .project-feature__media {
    order: 1;
    aspect-ratio: 16 / 10;
  }

  .project-feature__media img {
    position: absolute;
  }
}
</style>
