<script setup lang="ts">
import { computed } from "vue";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

type Media = { url?: string | null };

type LandingRes = {
  data?: {
    landingPage?: {
      section3?: {
        partnersLogo?: Media[] | null;
      } | null;
    } | null;
  };
};

const query = `
  query LandingPage {
    landingPage {
      section3 {
        partnersLogo { url }
      }
    }
  }
`;

const { data } = await useFetch<LandingRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: { query },
  server: false,
  key: "landing-section3",
});

const page = computed(() => data.value?.data?.landingPage ?? null);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

const baseLogos = computed(() =>
  (page.value?.section3?.partnersLogo ?? [])
    .map((l) => resolveMedia(l.url))
    .filter(Boolean)
);

const MIN_ITEMS_FOR_SMOOTH = 24;

const logos = computed(() => {
  const arr = baseLogos.value;
  if (!arr.length) return [];
  const times = Math.max(2, Math.ceil(MIN_ITEMS_FOR_SMOOTH / arr.length));
  return Array.from({ length: times }, () => arr).flat();
});

const SECONDS_PER_ITEM = 0.1;

const marqueeDuration = computed(() => {
  const baseLen = Math.max(1, baseLogos.value.length);
  const effectiveLen = Math.max(baseLen, MIN_ITEMS_FOR_SMOOTH);
  return `${effectiveLen * SECONDS_PER_ITEM}s`;
});
</script>

<template>
  <section class="spaceBetween relative z-[5] flex h-auto w-full items-center overflow-visible">
    <div class="w-full overflow-hidden">
      <div
        class="flex w-max animate-marquee will-change-transform"
        :style="{ '--marquee-duration': marqueeDuration }"
      >
        <div class="flex items-center gap-16 px-8">
          <img
            v-for="(src, i) in logos"
            :key="'a-' + i"
            :src="src"
            alt=""
            class="h-[27px] w-auto max-w-[150px] md:max-w-[250px] shrink-0 object-contain md:h-[3.0625rem] opacity-90 select-none pointer-events-none"
            draggable="false"
          />
        </div>

        <div class="flex items-center gap-16 px-8" aria-hidden="true">
          <img
            v-for="(src, i) in logos"
            :key="'b-' + i"
            :src="src"
            alt=""
            class="h-[27px] w-auto max-w-[150px] md:max-w-[250px] shrink-0 object-contain md:h-[3.0625rem] opacity-90 select-none pointer-events-none"
            draggable="false"
          />
        </div>
      </div>
    </div>
  </section>
</template>
<style scoped>
.spaceBetween {
  min-height: clamp(3rem, 5vw, 5.5rem);
}
</style>
