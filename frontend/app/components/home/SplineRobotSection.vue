<script setup lang="ts">
import { computed } from "vue";
import SplineSceneViewer from "./SplineSceneViewer.vue";
import SplitTextReveal from "./SplitTextReveal.vue";

type AppLocale = "ru" | "en";

type SplineRobotContent = {
  title?: string | null;
  description?: string | null;
  sceneUrl?: string | null;
};

type LandingSplineRobotRes = {
  data?: {
    landingPage?: {
      splineRobot?: SplineRobotContent | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const DEFAULT_SCENE_URL =
  "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

const DEFAULT_CONTENT = {
  title: "Interactive 3D",
  description:
    "Bring your UI to life with beautiful 3D scenes. Create immersive experiences that capture attention and enhance your design.",
  sceneUrl: DEFAULT_SCENE_URL,
};

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { locale } = useI18n();

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

const query = `
  query LandingSplineRobot($locale: I18NLocaleCode) {
    landingPage(locale: $locale) {
      splineRobot {
        title
        description
        sceneUrl
      }
    }
  }
`;

const fetchSplineRobot = async (): Promise<LandingSplineRobotRes> => {
  if (!GRAPHQL_URL) {
    return {};
  }

  const response = await $fetch<LandingSplineRobotRes>(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      query,
      variables: { locale: gqlLocale.value },
    },
  });

  if (response.errors?.length) {
    throw new Error(response.errors[0]?.message || "Landing spline robot query failed");
  }

  return response;
};

const { data } = await useAsyncData<LandingSplineRobotRes>(
  "landing-spline-robot",
  async () => {
    try {
      return await fetchSplineRobot();
    } catch {
      return {};
    }
  },
  { watch: [gqlLocale] }
);

const content = computed(() => data.value?.data?.landingPage?.splineRobot ?? null);
const title = computed(() => content.value?.title?.trim() || DEFAULT_CONTENT.title);
const description = computed(
  () => content.value?.description?.trim() || DEFAULT_CONTENT.description
);
const sceneUrl = computed(() => content.value?.sceneUrl?.trim() || DEFAULT_CONTENT.sceneUrl);
</script>

<template>
  <section class="spline-robot-section">
    <div class="spline-robot-card">
      <div class="spline-robot-card__content">
        <SplitTextReveal
          :text="title"
          tag="h2"
          class-name="spline-robot-card__title"
          split-type="chars"
          :delay="34"
          :duration="0.62"
          ease="power3.out"
          :from="{ opacity: 0, y: 34 }"
          :to="{ opacity: 1, y: 0 }"
          :threshold="0.1"
          root-margin="-90px"
          text-align="left"
        />
        <SplitTextReveal
          :text="description"
          tag="p"
          class-name="spline-robot-card__description"
          split-type="words"
          :delay="24"
          :duration="0.58"
          ease="power3.out"
          :from="{ opacity: 0, y: 24 }"
          :to="{ opacity: 1, y: 0 }"
          :threshold="0.1"
          root-margin="-90px"
          text-align="left"
        />
      </div>

      <div class="spline-robot-card__scene">
        <ClientOnly>
          <SplineSceneViewer :scene="sceneUrl" />
          <template #fallback>
            <div class="spline-robot-card__loader"></div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </section>
</template>

<style scoped>
.spline-robot-section {
  position: relative;
  z-index: 4;
  width: 100%;
  overflow: visible;
  padding: clamp(2.5rem, 5vw, 5rem) clamp(0.875rem, 4vw, 4rem);
  background: #000000;
}

.spline-robot-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(18rem, 0.82fr) minmax(24rem, 1.18fr);
  align-items: stretch;
  gap: clamp(1.5rem, 4vw, 4rem);
  width: min(100%, 90rem);
  min-height: clamp(28rem, 44vw, 34rem);
  margin-inline: auto;
  overflow: visible;
  background: #000000;
}

.spline-robot-card__content,
.spline-robot-card__scene {
  position: relative;
  z-index: 2;
}

.spline-robot-card__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  padding-block: clamp(2rem, 5vw, 4rem);
  padding-left: clamp(0rem, 2vw, 2rem);
}

.spline-robot-card :deep(.spline-robot-card__title) {
  margin: 0;
  color: transparent;
  background: linear-gradient(180deg, #ffffff 0%, #d8d8d8 52%, #8b8b8b 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: clamp(2.25rem, 4vw, 4rem);
  font-weight: 800;
  line-height: 1.02;
}

.spline-robot-card :deep(.spline-robot-card__description) {
  max-width: 34rem;
  margin: clamp(1rem, 1.7vw, 1.5rem) 0 0;
  color: rgba(244, 244, 245, 0.78);
  font-size: clamp(1rem, 1.2vw, 1.125rem);
  line-height: 1.45;
}

.spline-robot-card__loader {
  width: 2.25rem;
  height: 2.25rem;
  margin: auto;
  border: 2px solid rgba(255, 255, 255, 0.18);
  border-top-color: #ffffff;
  border-radius: 9999px;
  animation: robot-loader-spin 0.85s linear infinite;
}

@media (max-width: 900px) {
  .spline-robot-card {
    display: flex;
    min-height: auto;
    flex-direction: column;
  }

  .spline-robot-card__content {
    width: 100%;
    text-align: center;
    align-items: center;
    padding-inline: 0;
  }

  .spline-robot-card__scene {
    position: relative;
    width: 100%;
    height: clamp(20rem, 68vw, 28rem);
  }

  .spline-robot-card :deep(.spline-robot-card__title),
  .spline-robot-card :deep(.spline-robot-card__description) {
    text-align: center !important;
  }
}

@keyframes robot-loader-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
