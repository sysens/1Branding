<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed } from "vue";

const localePath = useLocalePath();
const router = useRouter();

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

type Media = { url?: string | null };

type LandingRes = {
  data?: {
    landingPage?: {
      slogan?: Media | null;
      sloganMobile?: Media | null;
    } | null;
  };
};

const query = `
  query LandingPage($locale: I18NLocaleCode) {
    landingPage(locale: $locale) {
      slogan { url }
      sloganMobile { url }
    }
  }
`;

const { locale } = useI18n();
const gqlLocale = computed(() => (locale.value === "en" ? "en" : "ru"));

const { data } = await useFetch<LandingRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: computed(() => ({ query, variables: { locale: gqlLocale.value } })),
  server: false,
  key: "landing-slogan",
  watch: [gqlLocale],
});

const page = computed(() => data.value?.data?.landingPage ?? null);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

const sloganImg = computed(() => resolveMedia(page.value?.slogan?.url ?? null));
const sloganMobileImg = computed(() =>
  resolveMedia(page.value?.sloganMobile?.url ?? null)
);

let ctx: any = null;

const isModifiedEvent = (event: MouseEvent) => {
  return !!(
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
};

const onContactFabClick = async (event: MouseEvent) => {
  if (!process.client) return;
  if (isModifiedEvent(event)) return;

  event.preventDefault();
  event.stopPropagation();

  const target = localePath("/ContactPage");

  try {
    await navigateTo(target);
    return;
  } catch {
    try {
      await router.push(target);
      return;
    } catch {
      window.location.href = target;
    }
  }
};

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    const main = document.querySelector<HTMLElement>(".products");
    if (!main) return;

    gsap.fromTo(
      main,
      { x: -160, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
    );
  });
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div class="md:h-[120vh] h-[116vh] overflow-hidden">
    <div class="pt-[41px]"></div>

    <div class="relative md:top-[22%] top-[30%]">
      <div class="flex max-w-[1500px] mx-auto justify-center md:justify-start products">
        <picture>
          <source media="(max-width: 767px)" :srcset="sloganMobileImg || sloganImg" />
          <img
            class="mainImg md:w-[41.5625rem] md:h-[19.5625rem] w-[363px] h-[187px]"
            :src="sloganImg"
            alt="mainImg"
          />
        </picture>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <NuxtLink
      :to="localePath('/ContactPage')"
      class="contact-fab fixed md:right-[10%] right-[40px] md:bottom-[6.25rem] bottom-[65px] z-[2147483646] group"
      @click="onContactFabClick"
    >
      <img
        src="/home/Frame 2147223311.png"
        alt=""
        class="transition-all duration-500 ease-out md:h-[6.25rem] md:w-[6.25rem] w-[80px] h-[80px] group-hover:scale-110 group-hover:drop-shadow-[0_0_60px_#03CB00] group-hover:brightness-110"
      />
    </NuxtLink>
  </Teleport>
</template>

<style scoped>
.contact-fab {
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  will-change: transform;
}
</style>
