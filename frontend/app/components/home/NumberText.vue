<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed, ref, watch } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Brands from "./Brands.vue";
import TextHoverEffect from "./TextHoverEffect.vue";

gsap.registerPlugin(ScrollTrigger);

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

type AppLocale = "ru" | "en";
const { t, locale } = useI18n<{ message: any }, AppLocale>();
const localePath = useLocalePath();
const router = useRouter();

type LandingRes = {
  data?: {
    landingPage?: {
      section2?: {
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

const s2 = computed(() => page.value?.section2 ?? null);
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
  <div ref="root" class="section-two-root">
    <div class="section-two-bg">
      <div class="ichkidiv">
        <div class="section-two-wrap containerr relative md:top-20 bottom-32">
          <div class="section-two-left main left-block">
            <TextHoverEffect text="2500" class="section-two-number" />
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
  align-items: center;
  justify-content: center;
  justify-items: center;
  gap: clamp(2rem, 4vw, 5rem);
  padding-top: clamp(7rem, 8vw, 8.75rem);
  min-height: 100vh;
}

.section-two-left,
.section-two-right {
  position: relative;
  flex: 1 1 0%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.section-two-left {
  z-index: 0;
  align-items: center;
  pointer-events: auto;
}

.section-two-number {
  width: min(52vw, 42rem);
  height: clamp(11rem, 21vw, 17rem);
  opacity: 0.88;
  transform: translateX(-2vw);
}

.section-two-right {
  z-index: 1;
  align-items: center;
  text-align: center;
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
  text-align: center;
}

.section-two-button {
  width: 280px;
  max-width: 100%;
  height: 60px;
  margin-bottom: clamp(1rem, 4vw, 3.5rem);
  align-self: center;
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

  .section-two-number {
    width: min(50vw, 36rem);
    height: clamp(10rem, 20vw, 15rem);
  }
}

/* 1200 dan past */
@media (max-width: 1200px) {
  .section-two-wrap {
    gap: 2rem;
    min-height: 48rem;
  }

  .section-two-number {
    width: min(50vw, 32rem);
    height: clamp(9rem, 19vw, 13rem);
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
    justify-content: center;
    gap: 1.25rem;
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
    align-items: center;
  }

  .section-two-number {
    width: min(48vw, 27rem);
    height: 10rem;
    transform: translateX(-1vw);
  }

  .section-two-right {
    position: relative;
    z-index: 2;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding-left: 1rem;
    margin-left: 0;
  }

  .section-two-title,
  .section-two-title-top,
  .section-two-title-bottom,
  .section-two-desc {
    width: 100%;
    text-align: center;
  }

  .section-two-button {
    align-self: center;
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
    gap: 1.25rem;
    padding-top: 7rem;
    min-height: 44rem;
  }

  .section-two-number {
    width: min(48vw, 24rem);
    height: 9rem;
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
    gap: 2rem;
    padding-top: 110px;
    min-height: auto;
    height: auto;
  }

  .section-two-left {
    display: flex;
    justify-content: center;
    width: 100%;
    margin-top: 0;
  }

  .section-two-number {
    width: min(94vw, 28rem);
    height: 10rem;
    transform: none;
  }

  .section-two-right {
    width: 100%;
    align-items: center;
    text-align: center;
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
    text-align: center;
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

  .section-two-number {
    width: min(94vw, 23rem);
    height: 8.5rem;
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
  .section-two-number {
    width: min(96vw, 20rem);
    height: 7.5rem;
  }

  .section-two-title-top {
    font-size: 30px;
  }

  .section-two-title-bottom {
    font-size: 46px;
  }
}
</style>
