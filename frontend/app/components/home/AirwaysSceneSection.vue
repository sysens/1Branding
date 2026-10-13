<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useViewportActivity } from "~/composables/useViewportActivity";
import { optEntry, optUrl } from "~/utils/optImage";

const { t } = useI18n();

// A CSS background is fetched as soon as the element is laid out, even at the
// very bottom of the page; attach it only once the section is ~1.5 screens away.
const { targetRef, isActive } = useViewportActivity({ rootMargin: "1200px 0px" });
const loaded = ref(false);
watch(isActive, (active) => { if (active) loaded.value = true; });

// The stage photo from the build-time copies (utils/optImage.ts): AVIF where
// supported, WebP otherwise, at 1200 / 1600 / 2560px for phones, laptops and
// larger or high-density screens (see the media queries in the CSS).
const SCENE = "/home/scene.jpg";
const sceneVars = computed(() => {
  const entry = optEntry(SCENE);
  const vars: Record<string, string> = {};
  for (const [size, width] of [["sm", 1200], ["md", 1600], ["lg", Infinity]] as const) {
    const pick = entry ? (entry.widths.find((w) => w >= width) ?? entry.w) : 0;
    const url = (format: "avif" | "webp") => (entry ? optUrl(SCENE, entry, pick, format) : SCENE);
    vars[`--scene-webp-${size}`] = `url("${url("webp")}")`;
    vars[`--scene-${size}`] = `image-set(url("${url("avif")}") type("image/avif"), url("${url("webp")}") type("image/webp"))`;
  }
  return vars;
});
</script>

<template>
  <section id="airways-scene" ref="targetRef" class="airways-scene" aria-labelledby="airways-title">
    <!-- The copy is English in both locales. -->
    <h2 id="airways-title" class="airways-scene__title" lang="en">
      <span v-blur-reveal class="airways-scene__strong">{{ t("home.airways.strong") }}</span>
      <span v-blur-reveal="0.2" class="airways-scene__rest">
        <span>{{ t("home.airways.rest1") }}</span>
        <span>{{ t("home.airways.rest2") }}</span>
      </span>
    </h2>
    <div class="airways-scene__stage">
      <div
        class="airways-scene__image"
        :class="{ 'is-loaded': loaded }"
        :style="loaded ? sceneVars : undefined"
        role="img"
        aria-label="Uzbekistan Airways: New Horizons Together, aircraft branding displayed on a panoramic stage"
      />
    </div>
  </section>
</template>

<style scoped>
.airways-scene {
  position: relative;
  padding-top: clamp(3rem, 7vw, 8rem);
  background: #000;
}

/* "strong" with the two short lines standing on its baseline, as in the design. */
.airways-scene__title {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: last baseline;
  justify-content: center;
  gap: 0.16em;
  margin: 0 0 clamp(-4rem, -4vw, -1rem);
  padding-inline: 1.25rem;
  color: #fff;
  font-family: var(--app-font-display) !important;
  font-size: clamp(4.25rem, 10vw, 12rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}

.airways-scene__strong {
  padding-bottom: 0.08em;
  background: linear-gradient(105deg, #1aff3c 8%, #00db32 40%, #00a02e 72%, #006b27 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.airways-scene__rest {
  display: flex;
  flex-direction: column;
  font-size: 0.235em;
  font-weight: 600;
  line-height: 1.12;
  letter-spacing: -0.01em;
}

.airways-scene__stage {
  position: relative;
}

.airways-scene__image {
  width: 100%;
  aspect-ratio: 8192 / 4611;
  /* Ultra-wide screens: one screen tall, cropped around the banner. */
  max-height: 100svh;
  background: #000 center 30% / cover no-repeat;
}

/* WebP by screen size; browsers that take image-set() with type() get AVIF. */
.airways-scene__image.is-loaded {
  background-image: var(--scene-webp-lg);
}

@media (max-width: 1440px) and (max-resolution: 1.4dppx) {
  .airways-scene__image.is-loaded {
    background-image: var(--scene-webp-md);
  }
}

@media (max-width: 767px) {
  .airways-scene__image.is-loaded {
    background-image: var(--scene-webp-sm);
  }
}

@supports (background-image: image-set(url("x.avif") type("image/avif"))) {
  .airways-scene__image.is-loaded {
    background-image: var(--scene-lg);
  }

  @media (max-width: 1440px) and (max-resolution: 1.4dppx) {
    .airways-scene__image.is-loaded {
      background-image: var(--scene-md);
    }
  }

  @media (max-width: 767px) {
    .airways-scene__image.is-loaded {
      background-image: var(--scene-sm);
    }
  }
}

/* Only the big screen stays lit: the ceiling, the side panels and the seats
   sink into black, and the top melts into the heading. */
.airways-scene__stage::after {
  position: absolute;
  inset: 0;
  content: "";
  pointer-events: none;
  background:
    linear-gradient(to bottom, rgb(0 0 0 / 0.92) 0%, rgb(0 0 0 / 0.5) 6%, rgb(0 0 0 / 0) 14%, rgb(0 0 0 / 0) 56%, rgb(0 0 0 / 0.7) 80%, rgb(0 0 0 / 0.92) 100%),
    radial-gradient(ellipse 60% 58% at 50% 32%, rgb(0 0 0 / 0) 62%, rgb(0 0 0 / 0.5) 82%, rgb(0 0 0 / 0.82) 100%);
}

@media (max-width: 767px) {
  .airways-scene__title {
    margin-bottom: 0;
  }
}
</style>
