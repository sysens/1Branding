<script setup lang="ts">
import { computed } from "vue";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

type Media = { url?: string | null };

type LandingRes = {
  data?: {
    landingPage?: {
      section9?: Array<{
        name?: string | null;
        icon?: Media | null;
      }> | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const query = `
  query LandingPage {
    landingPage {
      section9 {
        name
        icon { url }
      }
    }
  }
`;

const { data } = await useFetch<LandingRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: { query },
  server: false,
  key: "landing-section9",
});

const page = computed(() => data.value?.data?.landingPage ?? null);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

type MarqueeItem = {
  img: string;
  title: string;
};

const baseItems = computed<MarqueeItem[]>(() => {
  const arr = page.value?.section9 ?? [];
  return (arr || [])
    .map((t) => ({
      img: resolveMedia(t?.icon?.url ?? null),
      title: t?.name ?? "",
    }))
    .filter((x) => x.img || x.title);
});

const MIN_ITEMS_FOR_SMOOTH = 24;

const items = computed<MarqueeItem[]>(() => {
  const arr = baseItems.value;
  if (!arr.length) return [];
  const times = Math.max(2, Math.ceil(MIN_ITEMS_FOR_SMOOTH / arr.length));
  return Array.from({ length: times }, () => arr).flat();
});

const SECONDS_PER_ITEM = 9;

const marqueeDuration = computed(() => {
  const baseLen = Math.max(1, baseItems.value.length);
  const effectiveLen = Math.max(baseLen, MIN_ITEMS_FOR_SMOOTH);
  return `${effectiveLen * SECONDS_PER_ITEM}s`;
});
</script>

<template>
  <section
    class="relative bg-black md:mb-[12.5rem] mb-[230px] h-[320px] mx-auto flex items-end"
  >
    <div class="w-full overflow-hidden">
      <div
        class="flex w-max animate-marquee will-change-transform"
        :style="{ '--marquee-duration': marqueeDuration }"
      >
        <div class="flex items-center md:gap-[5rem] gap-[4px] h-[320px]">
          <div
            v-for="(item, i) in items"
            :key="'a-' + i"
            class="group w-[200px] shrink-0 flex flex-col items-center text-center transition-all duration-500 ease-out hover:scale-110 rounded-2xl relative before:absolute before:inset-[-10px] before:rounded-[28px] before:border before:border-white/35 before:opacity-0 before:transition-all before:duration-500 before:blur-[1px] before:pointer-events-none hover:before:opacity-100"
          >
            <div
              class="md:w-[7.5rem] md:h-[7.5rem] h-[66px] w-[66px] rounded-2xl overflow-hidden transition-all duration-500 ease-out group-hover:border-white/60"
            >
              <img
                :src="item.img"
                alt=""
                class="w-full h-full object-contain pointer-events-none"
                draggable="false"
              />
            </div>

            <p
              class="font-normal text-[#FFFFFF] line-clamp-1 px-1 pt-[60px] text-[24px] leading-[120%] tracking-normal transition-all duration-3000 ease-out group-hover:opacity-100"
            >
              {{ item.title }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-[80px] px-8">
          <div
            v-for="(item, i) in items"
            :key="'b-' + i"
            class="group w-[200px] shrink-0 flex flex-col items-center text-center transition-all duration-500 ease-out hover:scale-110 rounded-2xl relative before:absolute before:inset-[-10px] before:rounded-[28px] before:border before:border-white/35 before:opacity-0 before:transition-all before:duration-500 before:blur-[1px] before:pointer-events-none hover:before:opacity-100"
          >
            <div
              class="w-[160px] h-[100px] rounded-2xl overflow-hidden transition-all duration-500 ease-out group-hover:border-white/60"
            >
              <img
                :src="item.img"
                alt=""
                class="w-full h-full object-contain pointer-events-none"
                draggable="false"
              />
            </div>

            <p
              class="font-normal text-[#FFFFFF] line-clamp-1 px-1 pt-[60px] text-[24px] leading-[120%] tracking-normal transition-all duration-3000 ease-out"
            >
              {{ item.title }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  animation: marquee var(--marquee-duration) linear infinite;
}
</style>
