<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";
import { computed, ref } from "vue";
import ImageCompare from "~/components/ui/ImageCompare.vue";

// "Make your brand look better with character identity": a carousel of
// before/after pairs, each split by a draggable divider (ui/ImageCompare).
// The pairs below are stand-ins from our own projects until the real
// before/after shots of the rebrandings arrive.

type Pair = { before: string; after: string };
const PAIRS: Pair[] = [
  { before: "/home/threeLayerLocal/16.webp", after: "/home/threeLayerLocal/17.webp" },
  { before: "/home/threeLayerLocal/21.webp", after: "/home/threeLayerLocal/23.webp" },
  { before: "/home/threeLayerLocal/31.webp", after: "/home/threeLayerLocal/33.webp" },
  { before: "/home/threeLayerLocal/36.webp", after: "/home/threeLayerLocal/37.webp" },
];

const { t } = useI18n();
const localePath = useLocalePath();
// The frame is 1243 of the 2000px design frame (62.15vw), the full width less
// the gutters on phones; the 16:9 photos fill it (object-fit: cover).
const SIZES = "(max-width: 767px) calc(100vw - 2.5rem), 63vw";

const index = ref(0);
const direction = ref<1 | -1>(1);
const divider = ref(50);
const pair = computed(() => PAIRS[index.value]!);

const go = (step: 1 | -1) => {
  direction.value = step;
  index.value = (index.value + step + PAIRS.length) % PAIRS.length;
  divider.value = 50;
};
</script>

<template>
  <section class="compare-section" aria-labelledby="compare-title" aria-roledescription="carousel">
    <h2 id="compare-title" class="compare-section__title">
      <span v-blur-reveal>{{ `${t("home.compare.titleFirst")} ` }}</span>
      <span v-blur-reveal>{{ t("home.compare.titleLead") }}<span class="compare-section__accent">{{ t("home.compare.titleAccent") }}</span></span>
    </h2>
    <p v-rise class="compare-section__hint">{{ t("home.compare.hint") }}</p>

    <div v-rise class="compare-section__stage">
      <button type="button" class="compare-section__arrow" :aria-label="t('home.compare.prev')" @click="go(-1)">
        <svg viewBox="0 0 40 64" aria-hidden="true" focusable="false"><path d="M34 4 6 32l28 28" /></svg>
      </button>

      <div class="compare-section__frame" :aria-label="`${index + 1} / ${PAIRS.length}`" role="group" aria-roledescription="slide">
        <Transition :name="direction > 0 ? 'pair-next' : 'pair-prev'">
          <ImageCompare
            :key="index"
            v-model:position="divider"
            class="compare-section__compare"
            :labels="[t('home.compare.before'), t('home.compare.after')]"
            :label="t('home.compare.label')"
          >
            <template #before>
              <OptImage :src="pair.before" :sizes="SIZES" :alt="t('home.compare.before')" width="1243" height="696" decoding="async" loading="lazy" draggable="false" />
            </template>
            <template #after>
              <OptImage :src="pair.after" :sizes="SIZES" :alt="t('home.compare.after')" width="1243" height="696" decoding="async" loading="lazy" draggable="false" />
            </template>
          </ImageCompare>
        </Transition>
      </div>

      <button type="button" class="compare-section__arrow compare-section__arrow--next" :aria-label="t('home.compare.next')" @click="go(1)">
        <svg viewBox="0 0 40 64" aria-hidden="true" focusable="false"><path d="M6 4l28 28L6 60" /></svg>
      </button>
    </div>

    <NuxtLink v-rise :to="localePath('/projects')" class="compare-section__button ob-button ob-button--dark">{{ t("home.compare.cta") }}</NuxtLink>
  </section>
</template>

<style scoped>
/* --u is one pixel of the 2000px design frame. */
.compare-section {
  --u: calc(0.05 * var(--fvw));
  position: relative;
  /* Same layer as the dark sections' edge fades but later: they stay off
     this white section; the fixed header (31) stays on top. */
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(110 * var(--u)) 0 calc(120 * var(--u));
  background: #fff;
  color: #0a0a0a;
}

/* The section heading: the h1 step (--section-title-size). */
.compare-section__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  padding-inline: 1.25rem;
  font-family: var(--app-font-display);
  font-size: var(--section-title-size);
  font-weight: 600;
  line-height: var(--type-h1-lh);
  letter-spacing: var(--type-h1-ls);
  text-align: center;
}

.compare-section__accent {
  background: linear-gradient(90deg, #1b6b33 0%, #2c9c48 22%, #46f26b 52%, #22dc4d 76%, #1e9c3a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* "*slide": the lead step. #737373 passes 4.5:1 on the white section (4.7:1;
   #7c7c7c was 4.2:1). */
.compare-section__hint {
  margin: calc(28 * var(--u)) 0 0;
  color: #737373;
  font-family: var(--app-font-sans);
  font-size: var(--type-lead-size);
  font-weight: 600;
  line-height: var(--type-lead-lh);
  letter-spacing: var(--type-lead-ls);
}

.compare-section__stage {
  display: flex;
  align-items: center;
  gap: calc(122 * var(--u));
  margin-top: calc(14 * var(--u));
}

.compare-section__frame {
  position: relative;
  width: calc(1243 * var(--u));
  aspect-ratio: 1243 / 696;
  overflow: hidden;
  border-radius: calc(40 * var(--u));
  background: #ececec;
}

.compare-section__compare {
  --compare-line: #00ff01;
  --compare-line-width: max(2px, calc(3 * var(--u)));
  position: absolute;
  inset: 0;
}

/* Slides: the new pair comes in from the side of the arrow pressed. */
.pair-next-enter-active,
.pair-next-leave-active,
.pair-prev-enter-active,
.pair-prev-leave-active {
  transition: transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.55s ease;
}

.pair-next-enter-from { transform: translateX(100%); }
.pair-next-leave-to { transform: translateX(-30%); opacity: 0; }
.pair-prev-enter-from { transform: translateX(-100%); }
.pair-prev-leave-to { transform: translateX(30%); opacity: 0; }

.compare-section__arrow {
  display: grid;
  place-items: center;
  /* About half the first draft's 75 x 100: the chevrons no longer outweigh
     the pictures. */
  width: max(2rem, calc(40 * var(--u)));
  height: max(2.6rem, calc(56 * var(--u)));
  padding: 0;
  border: 0;
  background: none;
  color: #023435;
  cursor: pointer;
  transition: transform 0.25s ease, color 0.25s ease;
}

.compare-section__arrow svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 7;
  stroke-linecap: square;
}

.compare-section__arrow:hover,
.compare-section__arrow:focus-visible {
  color: #00b82e;
  transform: translateX(calc(-6 * var(--u)));
}

.compare-section__arrow--next:hover,
.compare-section__arrow--next:focus-visible {
  transform: translateX(calc(6 * var(--u)));
}

.compare-section__arrow:focus-visible {
  outline: 2px solid #00c936;
  outline-offset: 4px;
}

/* The shared .ob-button under the stage. */
.compare-section__button {
  margin-top: calc(70 * var(--u));
}

/* Phones: the frame takes the width and the arrows sit inside the picture,
   at its left and right edges: round dark buttons that read on any image. */
@media (max-width: 767px) {
  .compare-section {
    padding: 4rem 0 4.5rem;
  }

  .compare-section__hint {
    margin-top: 0.75rem;
  }

  .compare-section__button {
    margin-top: 2rem;
  }

  .compare-section__stage {
    position: relative;
    display: block;
    width: 100%;
    margin-top: 1.25rem;
    padding-inline: 1.25rem;
  }

  .compare-section__frame {
    width: 100%;
    border-radius: 1.1rem;
  }

  .compare-section__compare {
    --compare-line-width: 2px;
  }

  .compare-section__arrow {
    position: absolute;
    z-index: 2;
    top: 50%;
    left: calc(1.25rem + 0.625rem);
    width: 2.75rem;
    height: 2.75rem;
    padding: 0.8rem 0.95rem;
    border-radius: 50%;
    background: rgb(0 0 0 / 0.45);
    color: #fff;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    transform: translateY(-50%);
  }

  .compare-section__arrow--next {
    right: calc(1.25rem + 0.625rem);
    left: auto;
  }

  .compare-section__arrow svg {
    stroke-width: 9;
  }

  .compare-section__arrow:hover,
  .compare-section__arrow:focus-visible,
  .compare-section__arrow--next:hover,
  .compare-section__arrow--next:focus-visible {
    background: rgb(0 0 0 / 0.65);
    color: #fff;
    transform: translateY(-50%);
  }

  .compare-section__arrow:focus-visible {
    outline-offset: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pair-next-enter-active,
  .pair-next-leave-active,
  .pair-prev-enter-active,
  .pair-prev-leave-active {
    transition: none;
  }
}
</style>
