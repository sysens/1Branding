<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed, ref, watch } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Brands from "./Brands.vue";

gsap.registerPlugin(ScrollTrigger);

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

type AppLocale = "ru" | "en";
const { t, locale } = useI18n<{ message: any }, AppLocale>();
const localePath = useLocalePath();
const router = useRouter();

type Media = { url?: string | null };

type LandingRes = {
  data?: {
    landingPage?: {
      section2?: {
        countImage?: Media | null;
        title?: string | null;
        description?: string | null;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

const query = `
  query LandingPage($locale: I18NLocaleCode) {
    landingPage(locale: $locale) {
      section2 {
        countImage { url }
        title
        description
      }
    }
  }
`;

const { data } = await useFetch<LandingRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: computed(() => ({
    query,
    variables: { locale: gqlLocale.value },
  })),
  server: false,
  key: "landing-section2",
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

const s2 = computed(() => page.value?.section2 ?? null);
const s2Img = computed(() => resolveMedia(s2.value?.countImage?.url ?? null));
const s2Title = computed(() => (s2.value?.title ?? "").trim());
const s2Desc = computed(() => (s2.value?.description ?? "").trim());
const s2TitleGreen = computed(() => s2Title.value || t("home.numberText.titleGreen"));
const s2TitleWhite = computed(() =>
  s2Title.value ? "" : t("home.numberText.titleWhite")
);
const s2DescText = computed(() => s2Desc.value || t("home.numberText.desc"));

const s2TitleLines = computed(() => {
  const words = (s2TitleGreen.value || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return { top: words[0], bottom: words.slice(1).join(" ") };
  }
  return { top: s2TitleGreen.value, bottom: "" };
});

const root = ref<HTMLElement | null>(null);
let ctx: any = null;

const init = async () => {
  await nextTick();
  await nextTick();

  ctx?.revert();
  ctx = null;

  if (!root.value) return;

  ctx = gsap.context(() => {
    const left = root.value!.querySelector<HTMLElement>(".left-block");
    const right = root.value!.querySelector<HTMLElement>(".right-block");

    if (!left || !right) return;

    gsap.set(left, { x: -280, opacity: 0 });
    gsap.set(right, { x: 280, opacity: 0 });

    ScrollTrigger.create({
      trigger: root.value,
      start: "top 30%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        tl.to(
          left,
          {
            x: 0,
            opacity: 1,
            duration: 0.9,
          },
          0
        ).to(
          right,
          {
            x: 0,
            opacity: 1,
            duration: 0.9,
          },
          0.14
        );
      },
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
  }, root.value);
};

const isModifiedEvent = (event: MouseEvent) => {
  return !!(
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
};

const onLearnMoreClick = async (event: MouseEvent) => {
  if (!process.client) return;
  if (isModifiedEvent(event)) return;

  event.preventDefault();
  event.stopPropagation();

  const target = localePath("/About");

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
  await init();
});

watch(gqlLocale, async () => {
  await init();
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div ref="root" class="section-two-root ]">
    <div class="section-two-bg">
      <div class="ichkidiv">
        <div class="section-two-wrap containerr relative md:top-20 bottom-32">
          <img src="/home/BirImage.png" class="section-two-center-image" alt="" />

          <div class="section-two-left main left-block">
            <img class="section-two-left-image" src="/home/ikkimun.png" alt="" />
          </div>

          <div class="section-two-right main right-block">
            <h1 class="section-two-title">
              <span class="section-two-title-top">
                {{ s2TitleLines.top }}
              </span>

              <span v-if="s2TitleLines.bottom" class="section-two-title-bottom">
                {{ s2TitleLines.bottom }}
              </span>
            </h1>

            <p class="section-two-desc">
              {{ s2DescText }}
            </p>

            <button type="button" class="section-two-button" @click="onLearnMoreClick">
              {{ $t("common.learnMore") }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="section-two-brands">
      <Brands :rows="1" :showTitle="false" :showButton="false" />
    </div>
  </div>
</template>

<style scoped>
.section-two-root {
  position: relative;
  z-index: 0;
}

.section-two-bg {
  height: 100vh;
  display: flex;
  justify-content: center;
  width: 100%;
  background-image: url("/home/Sukaground.svg");
  background-repeat: no-repeat;
  background-position: top;
  background-size: cover;
}

.section-two-wrap {
  position: relative;
  z-index: 0;
  display: flex;
  justify-content: center;
  justify-items: center;
  gap: clamp(0.5rem, 1.2vw, 1.5rem);
  padding-top: clamp(7rem, 8vw, 8.75rem);
  min-height: 100vh;
}

.section-two-center-image {
  position: absolute;
  left: 39%;
  top: 56%;
  z-index: 0;
  width: clamp(18rem, 24vw, 26.25rem);
  height: auto;
  max-height: 46.1875rem;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  transform: translate(-50%, -50%);
}

.section-two-left,
.section-two-right {
  position: relative;
  z-index: 0;
  flex: 1 1 0%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.section-two-left {
  padding-bottom: 0;
}

.section-two-left-image {
  display: block;
  width: min(100%, 38rem);
  height: auto;
  max-width: 100%;
}

.section-two-title {
  margin: 0;
  padding-top: 0;
  font-weight: 400;
  font-size: 4rem;
  line-height: 100%;
  letter-spacing: 0;
  text-transform: uppercase;
  color: #03cb00;
  vertical-align: middle;
}

.section-two-title-top {
  display: block;
  font-family: "Oswald", sans-serif;
  font-weight: 400;
  font-size: clamp(2.8rem, 4.5vw, 4rem);
  line-height: 100%;
  letter-spacing: clamp(-2px, -0.25vw, -4px);
  vertical-align: middle;
  text-transform: uppercase;
  color: #03cb00;
}

.section-two-title-bottom {
  display: block;
  font-family: "Oswald", sans-serif;
  font-weight: 400;
  font-size: clamp(4rem, 6.7vw, 6rem);
  line-height: 100%;
  letter-spacing: clamp(-0.08rem, -0.2vw, -0.25rem);
  vertical-align: middle;
  text-transform: uppercase;
  color: #ffffff;
}

.section-two-desc {
  margin: 0;
  padding-top: clamp(1.2rem, 2.5vw, 2.5rem);
  padding-bottom: clamp(1.2rem, 2.5vw, 2.5rem);
  font-family: "Poppins", "Inter", sans-serif;
  font-weight: 300;
  font-size: clamp(0.95rem, 1.1vw, 1rem);
  line-height: 120%;
  letter-spacing: 0;
  color: #cccccc;
  max-width: 36rem;
}

.section-two-button {
  width: 280px;
  max-width: 100%;
  height: 60px;
  margin-bottom: clamp(1rem, 4vw, 3.5rem);
  border: 2px solid #03cb00;
  border-radius: 9999px;
  background: #000000;
  color: #ffffff;
  box-shadow: 0 0 20px rgba(3, 203, 0, 0.6);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.section-two-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(3, 203, 0, 0.9);
}

.section-two-brands {
  position: relative;
  z-index: 0;
  margin-top: clamp(3.5rem, 6vw, 7.5rem);
}

/* 1400 dan past */
@media (max-width: 1400px) {
  .section-two-wrap {
    min-height: 52rem;
  }

  .section-two-center-image {
    left: 39%;
    top: 48%;
  }

  .section-two-left-image {
    width: min(100%, 34rem);
  }
}

/* 1200 dan past */
@media (max-width: 1200px) {
  .section-two-wrap {
    gap: 1rem;
    min-height: 48rem;
  }

  .section-two-center-image {
    left: 39%;
    top: 52%;
    width: clamp(16rem, 22vw, 22rem);
  }

  .section-two-left-image {
    width: min(100%, 30rem);
  }

  .section-two-desc {
    max-width: 30rem;
  }
}

/* TABLET FIX: 769 - 1024 */
@media (min-width: 769px) and (max-width: 1024px) {
  .section-two-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0;
    padding-top: 7rem;
    min-height: 44rem;
  }

  .section-two-left,
  .section-two-right {
    flex: 0 0 50%;
    max-width: 50%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .section-two-left {
    align-items: flex-start;
    padding-bottom: 0;
  }

  .section-two-left-image {
    display: block;
    width: 100%;
    max-width: 25rem;
    height: auto;
  }

  .section-two-right {
    position: relative;
    z-index: 2;
    align-items: flex-start;
    justify-content: center;
    text-align: left;
    padding-left: 1rem;
    margin-left: 0;
  }

  .section-two-title,
  .section-two-title-top,
  .section-two-title-bottom,
  .section-two-desc {
    width: 100%;
    text-align: left;
  }

  .section-two-button {
    align-self: flex-start;
  }

  .section-two-center-image {
    left: 39%;
    top: 44%;
    width: 18rem;
    height: auto;
  }

  .section-two-title {
    padding-top: 0;
  }

  .section-two-title-top {
    font-size: 2.9rem;
    letter-spacing: -2px;
    line-height: 0.95;
  }

  .section-two-title-bottom {
    font-size: 4.8rem;
    letter-spacing: -0.08rem;
    line-height: 0.95;
  }

  .section-two-desc {
    max-width: 25rem;
    font-size: 0.95rem;
    padding-top: 1.25rem;
    padding-bottom: 1.5rem;
  }

  .section-two-button {
    width: 240px;
    height: 56px;
    margin-bottom: 1rem;
  }
}

/* 991 dan past */
@media (max-width: 991px) {
  .section-two-wrap {
    gap: 0.75rem;
    padding-top: 7rem;
    min-height: 44rem;
  }

  .section-two-center-image {
    left: 40%;
    top: 46%;
    width: 18rem;
  }

  .section-two-left {
    padding-bottom: 0;
  }

  .section-two-left-image {
    width: min(100%, 24rem);
  }

  .section-two-title-top {
    font-size: 2.75rem;
    letter-spacing: -2px;
  }

  .section-two-title-bottom {
    font-size: 4.5rem;
    letter-spacing: -0.08rem;
  }

  .section-two-desc {
    font-size: 0.95rem;
    max-width: 24rem;
  }

  .section-two-button {
    width: 240px;
    height: 56px;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .section-two-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 1.25rem;
    padding-top: 110px;
    min-height: auto;
    height: auto;
  }

  .section-two-center-image {
    left: 50%;
    top: 20rem;
    width: min(240px, 145vw);
    height: auto;
    max-height: none;
  }

  .section-two-left {
    display: flex;
    justify-content: center;
    width: 100%;
    padding-bottom: 0;
    margin-top: 24rem;
  }

  .section-two-left-image {
    display: block;
    width: 100%;
    max-width: 420px;
    height: auto;
    object-fit: contain;
  }

  .section-two-right {
    width: 100%;
  }

  .section-two-title {
    padding-top: 33px;
  }

  .section-two-title-top {
    font-size: 40px;
    letter-spacing: -4px;
  }

  .section-two-title-bottom {
    font-size: 64px;
    letter-spacing: normal;
  }

  .section-two-desc {
    font-size: 14px;
    max-width: 100%;
  }

  .section-two-button {
    width: 280px;
    margin-bottom: 0;
  }

  .section-two-brands {
    margin-top: 55px;
  }
}

/* Kichik mobile */
@media (max-width: 575px) {
  .section-two-wrap {
    padding-top: 100px;
    gap: 1rem;
  }

  .section-two-center-image {
    top: 59%;
    width: min(280px, 100vw);
  }

  .section-two-left {
    margin-top: 20rem;
  }

  .section-two-left-image {
    max-width: 360px;
  }

  .section-two-title {
    padding-top: 18px;
  }

  .section-two-title-top {
    font-size: 34px;
    letter-spacing: -2px;
  }

  .section-two-title-bottom {
    font-size: 52px;
  }

  .section-two-desc {
    padding-top: 1.25rem;
    padding-bottom: 1.5rem;
    font-size: 14px;
  }

  .section-two-button {
    width: 100%;
    max-width: 280px;
    height: 56px;
  }
}

/* Juda kichik mobile */
@media (max-width: 390px) {
  .section-two-center-image {
    top: 52%;
    width: min(220px, 155vw);
  }

  .section-two-left {
    margin-top: 17.5rem;
  }

  .section-two-left-image {
    max-width: 320px;
  }

  .section-two-title-top {
    font-size: 30px;
  }

  .section-two-title-bottom {
    font-size: 46px;
  }
}
</style>
