<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed, ref, watch } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Brands from "./Brands.vue";
import StaticOutlineNumber from "./StaticOutlineNumber.vue";

gsap.registerPlugin(ScrollTrigger);

type GsapContext = { revert: () => void };
type AppLocale = "ru" | "en";
type CurveScrollState = { isActive: boolean };
type SectionTitleParts = {
  highlight: string;
  rest: string;
};

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

const { t, locale } = useI18n();

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
const s2DescText = computed(() => s2Desc.value || t("home.numberText.desc"));

const splitTitleWords = (title: string) => title.trim().split(/\s+/).filter(Boolean);
const getTitleLocale = () => (gqlLocale.value === "ru" ? "ru-RU" : "en-US");

const toDisplayTitleWord = (word: string, isFirstWord: boolean) => {
  const lowerCasedWord = word.toLocaleLowerCase(getTitleLocale());

  if (!isFirstWord) {
    return lowerCasedWord;
  }

  const [firstLetter = "", ...restLetters] = Array.from(lowerCasedWord);

  return `${firstLetter.toLocaleUpperCase(getTitleLocale())}${restLetters.join("")}`;
};

const toDisplayTitleParts = (words: string[]): SectionTitleParts => {
  const [firstWord = "", ...restWords] = words;

  return {
    highlight: toDisplayTitleWord(firstWord, true),
    rest: restWords.map((word) => toDisplayTitleWord(word, false)).join(" "),
  };
};

const s2TitleParts = computed<SectionTitleParts>(() => {
  const cmsTitleWords = splitTitleWords(s2Title.value);

  if (cmsTitleWords.length > 0) {
    return toDisplayTitleParts(cmsTitleWords);
  }

  return toDisplayTitleParts([
    ...splitTitleWords(t("home.numberText.titleGreen")),
    ...splitTitleWords(t("home.numberText.titleWhite")),
  ]);
});

const root = ref<HTMLElement | null>(null);
let ctx: GsapContext | null = null;

const DEFAULT_CURVE_HEIGHT = 522;
const getCurveHeight = (element: HTMLElement) => {
  const rawValue = getComputedStyle(element)
    .getPropertyValue("--section-two-curve-height")
    .trim();
  const parsedValue = Number.parseFloat(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_CURVE_HEIGHT;
};

const getCurveFlattenDistance = (element: HTMLElement) => {
  return Math.min(getCurveHeight(element), window.innerHeight * 0.65);
};

const setCurvePinned = (element: HTMLElement, isPinned: boolean) => {
  element.classList.toggle("section-two-bg--curve-pinned", isPinned);
};

const init = async () => {
  await nextTick();
  await nextTick();

  ctx?.revert();
  ctx = null;

  if (!root.value) return;

  ctx = gsap.context(() => {
    const left = root.value!.querySelector<HTMLElement>(".left-block");
    const right = root.value!.querySelector<HTMLElement>(".right-block");
    const bg = root.value!.querySelector<HTMLElement>(".section-two-bg");

    if (bg) {
      gsap.set(bg, {
        "--section-two-radius-left-x": "50%",
        "--section-two-radius-right-x": "62%",
        "--section-two-radius-left-y": "25%",
        "--section-two-radius-right-y": "22%",
      });

      gsap.to(bg, {
        "--section-two-radius-left-x": "0%",
        "--section-two-radius-right-x": "0%",
        "--section-two-radius-left-y": "0%",
        "--section-two-radius-right-y": "0%",
        ease: "none",
        scrollTrigger: {
          trigger: bg,
          start: () => `bottom-=${getCurveHeight(bg)} top`,
          end: () => `+=${getCurveFlattenDistance(bg)}`,
          scrub: true,
          invalidateOnRefresh: true,
          onEnter: () => setCurvePinned(bg, true),
          onEnterBack: () => setCurvePinned(bg, true),
          onLeave: () => setCurvePinned(bg, false),
          onLeaveBack: () => setCurvePinned(bg, false),
          onUpdate: (state: CurveScrollState) => setCurvePinned(bg, state.isActive),
        },
      });
    }

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

onMounted(async () => {
  await init();
});

watch(gqlLocale, async () => {
  await init();
});

onBeforeUnmount(() => {
  const bg = root.value?.querySelector<HTMLElement>(".section-two-bg");

  if (bg) {
    setCurvePinned(bg, false);
  }

  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div ref="root" class="section-two-root">
    <div class="section-two-bg">
      <div class="ichkidiv">
        <div class="section-two-wrap containerr">
          <div class="section-two-number-layer main left-block">
            <StaticOutlineNumber text="2500" class="section-two-number" />
          </div>

          <div class="section-two-right main right-block">
            <h1 class="section-two-title">
              <span class="section-two-title-highlight">
                {{ s2TitleParts.highlight }}
              </span>

              {{ " " }}

              <span v-if="s2TitleParts.rest" class="section-two-title-rest">
                {{ s2TitleParts.rest }}
              </span>
            </h1>

            <p class="section-two-desc">
              {{ s2DescText }}
            </p>
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
  --section-two-curve-height: 522px;
  --section-two-radius-left-x: 50%;
  --section-two-radius-right-x: 62%;
  --section-two-radius-left-y: 25%;
  --section-two-radius-right-y: 22%;
  position: relative;
  height: 100vh;
  display: flex;
  justify-content: center;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
  background-repeat: no-repeat;
  background-position: top;
  background-size: cover;
}

.section-two-bg::before,
.section-two-bg::after {
  position: absolute;
  width: 100%;
  height: var(--section-two-curve-height);
  border-radius:
    var(--section-two-radius-left-x) var(--section-two-radius-right-x) 0 0 /
    var(--section-two-radius-left-y) var(--section-two-radius-right-y) 0 0;
  bottom: 0;
  content: "";
  pointer-events: none;
}

.section-two-bg::before {
  z-index: 1;
  background-color: black;
  border-top: 3px solid #03cb00;
  border-bottom: none;
}

.section-two-bg::after {
  z-index: 0;
  box-shadow: 0px 0rem 7rem 2rem rgba(21, 224, 1, 0.95);
  clip-path: inset(-9rem 0 0 0);
}

.section-two-bg--curve-pinned::before,
.section-two-bg--curve-pinned::after {
  position: fixed;
  top: 0;
  bottom: auto;
  left: 0;
}

.section-two-wrap {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-inline: clamp(1rem, 4vw, 4rem);
  padding-top: clamp(3rem, 5vw, 5rem);
  min-height: 100vh;
}

.section-two-right {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.section-two-number-layer {
  position: absolute;
  left: 50%;
  top: clamp(15rem, 42vh, 24rem);
  z-index: 0;
  width: min(132vw, 104rem);
  height: clamp(17rem, 40vw, 34rem);
  pointer-events: none;
  translate: -50% -30%;
}

.section-two-number-layer::after {
  position: absolute;
  inset: 50% -4% -16%;
  content: "";
  pointer-events: none;
  background:
    linear-gradient(
      180deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.48) 34%,
      rgba(0, 0, 0, 0.9) 70%,
      #000000 100%
    );
}

.section-two-number {
  width: 100%;
  height: 100%;
}

.section-two-right {
  width: min(90vw, 72rem);
  z-index: 2;
  align-items: center;
  text-align: center;
  margin-right: 0;
  transform: translateY(clamp(0.75rem, 9vh, 5.8rem));
}

.section-two-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  column-gap: clamp(0.45rem, 1.2vw, 1rem);
  row-gap: 0.15em;
  margin: 0;
  padding-top: 0;
  font-family: "Poppins", "Inter", sans-serif;
  font-weight: 700;
  font-size: clamp(3rem, 4.6vw, 4.6rem);
  line-height: 0.98;
  letter-spacing: 0;
  text-transform: none;
  color: #ffffff;
  vertical-align: middle;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.72);
}

.section-two-title-highlight {
  display: block;
  color: transparent;
  background:
    linear-gradient(180deg, #59ff48 0%, #03cb00 54%, #017c00 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}

.section-two-title-rest {
  display: block;
  color: transparent;
  background:
    linear-gradient(180deg, #ffffff 0%, #e8e8e8 48%, #8b8b8b 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}

.section-two-desc {
  margin: 0;
  padding-top: clamp(0.45rem, 0.9vw, 0.8rem);
  padding-bottom: 0;
  font-family: "Poppins", "Inter", sans-serif;
  font-weight: 300;
  font-size: clamp(0.72rem, 0.86vw, 0.9rem);
  line-height: 120%;
  letter-spacing: 0;
  color: #cccccc;
  width: min(86vw, 66rem);
  max-width: 66rem;
  text-align: center;
}

.section-two-brands {
  position: relative;
  z-index: 0;
  margin-top: clamp(3.5rem, 6vw, 7.5rem);
}

@media (max-width: 1400px) {
  .section-two-wrap {
    min-height: 52rem;
  }

  .section-two-number-layer {
    width: min(134vw, 96rem);
    height: clamp(16rem, 39vw, 31rem);
  }
}

@media (max-width: 1200px) {
  .section-two-wrap {
    min-height: 48rem;
  }

  .section-two-number-layer {
    top: clamp(14rem, 40vh, 22rem);
    width: min(136vw, 86rem);
    height: clamp(15rem, 38vw, 29rem);
  }

  .section-two-right {
    width: min(90vw, 58rem);
  }

  .section-two-desc {
    max-width: 58rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .section-two-wrap {
    padding-top: 7rem;
    min-height: 44rem;
  }

  .section-two-right {
    width: min(92vw, 52rem);
    min-width: 0;
    transform: translateY(4.3rem);
  }

  .section-two-number-layer {
    top: 18rem;
    width: min(138vw, 70rem);
    height: 21rem;
  }

  .section-two-title,
  .section-two-desc {
    width: 100%;
    text-align: center;
  }

  .section-two-title {
    padding-top: 0;
    font-size: clamp(2.8rem, 6.5vw, 4rem);
    line-height: 0.95;
  }

  .section-two-desc {
    max-width: 46rem;
    font-size: 0.86rem;
    padding-top: 0.75rem;
  }
}

@media (max-width: 991px) {
  .section-two-wrap {
    padding-top: 7rem;
    min-height: 44rem;
  }

  .section-two-number-layer {
    top: 17.2rem;
    width: min(140vw, 62rem);
    height: 19rem;
  }

  .section-two-right {
    width: min(92vw, 46rem);
    transform: translateY(4rem);
  }

  .section-two-desc {
    font-size: 0.84rem;
    max-width: 39rem;
  }
}

@media (max-width: 767px) {
  .section-two-wrap {
    padding-top: 7rem;
    min-height: 38rem;
  }

  .section-two-number-layer {
    top: 15.5rem;
    width: min(150vw, 48rem);
    height: 15rem;
  }

  .section-two-right {
    width: 100%;
    transform: translateY(3.3rem);
  }

  .section-two-title {
    font-size: clamp(2.1rem, 10vw, 3.2rem);
    line-height: 0.95;
  }

  .section-two-desc {
    font-size: 14px;
    max-width: 34rem;
  }

  .section-two-brands {
    margin-top: 55px;
  }
}

@media (max-width: 575px) {
  .section-two-wrap {
    padding-inline: 1rem;
    padding-top: 6.5rem;
    min-height: 35rem;
  }

  .section-two-number-layer {
    top: 14.8rem;
    width: min(158vw, 40rem);
    height: 12.5rem;
  }

  .section-two-title {
    font-size: clamp(2.15rem, 12vw, 3.25rem);
  }

  .section-two-desc {
    padding-top: 0.85rem;
    font-size: 14px;
    max-width: 29rem;
  }
}

@media (max-width: 390px) {
  .section-two-number-layer {
    top: 14rem;
    width: min(164vw, 34rem);
    height: 11rem;
  }

  .section-two-title {
    font-size: 2.05rem;
  }
}
</style>
