<script setup lang="ts">
import { computed, ref } from "vue";
import Brands from "./Brands.vue";
import StaticOutlineNumber from "./StaticOutlineNumber.vue";
import ThreeLayer from "./threeLayer.vue";
import type { LandingSection2 } from "~/types/landingPayload";

type TitleParts = {
  highlight: string;
  rest: string;
};

const props = withDefaults(
  defineProps<{
    collageRows?: string[][];
    partnerLogos?: string[];
    section?: LandingSection2 | null;
  }>(),
  {
    collageRows: () => [],
    partnerLogos: () => [],
    section: null,
  }
);

const { locale, t } = useI18n();
const localeCode = computed(() => (locale.value === "ru" ? "ru-RU" : "en-US"));
const titleSource = computed(() => {
  const cmsTitle = props.section?.title?.trim();
  return cmsTitle || `${t("home.numberText.titleGreen")} ${t("home.numberText.titleWhite")}`;
});

const titleParts = computed<TitleParts>(() => {
  const [firstWord = "", ...remainingWords] = titleSource.value.split(/\s+/).filter(Boolean);
  const lowerFirst = firstWord.toLocaleLowerCase(localeCode.value);
  const [firstLetter = "", ...restLetters] = Array.from(lowerFirst);

  return {
    highlight: `${firstLetter.toLocaleUpperCase(localeCode.value)}${restLetters.join("")}`,
    rest: remainingWords
      .map((word) => word.toLocaleLowerCase(localeCode.value))
      .join(" "),
  };
});

const description = computed(
  () => props.section?.description?.trim() || t("home.numberText.desc")
);
const displayTitle = computed(() =>
  [titleParts.value.highlight, titleParts.value.rest].filter(Boolean).join(" ")
);

const rootRef = ref<HTMLElement | null>(null);
const windowRef = ref<HTMLElement | null>(null);
const logosRef = ref<HTMLElement | null>(null);
const copyRef = ref<HTMLElement | null>(null);
const numberRef = ref<HTMLElement | null>(null);

useCinematicRevealMotion({ copyRef, logosRef, numberRef, rootRef, windowRef });
</script>

<template>
  <section ref="rootRef" class="clients-reveal">
    <div ref="windowRef" class="clients-reveal__window">
      <div class="clients-section">
        <div class="clients-section__curve" aria-hidden="true"></div>

        <div ref="logosRef" class="clients-section__logos">
          <Brands :logos="partnerLogos" />
        </div>

        <div class="clients-section__content">
          <header ref="copyRef" class="clients-section__copy">
            <h2 class="clients-section__title" :aria-label="displayTitle">
              <span class="clients-section__title-highlight" aria-hidden="true">
                {{ titleParts.highlight }}
              </span>
              <span
                v-if="titleParts.rest"
                class="clients-section__title-rest"
                aria-hidden="true"
              >
                {{ titleParts.rest }}
              </span>
            </h2>
            <p class="clients-section__description">{{ description }}</p>
          </header>

          <div ref="numberRef" class="clients-section__number">
            <StaticOutlineNumber text="2500" />
          </div>
        </div>
      </div>
    </div>

    <div class="clients-section__collage-band">
      <div class="clients-section__collage">
        <ThreeLayer
          :rows="3"
          :row-sets="collageRows"
          :show-title="false"
          :show-button="false"
        />
      </div>
    </div>
  </section>
</template>

<style scoped src="./SatisfiedClientsSection.css"></style>
