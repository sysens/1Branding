<script setup lang="ts">
import { computed } from "vue";
import FooterBrandSparkles from "~/components/FooterBrandSparkles.vue";
import FooterRobotScene from "~/components/FooterRobotScene.vue";

// The robot with the green "1" on its chest above "Onebranding" and the
// sparkling line, then "A strong brand is not created by chance." This used to
// be the site footer; on the landing it is now its own section above it.

const props = withDefaults(defineProps<{ sceneUrl?: string | null }>(), { sceneUrl: null });
const DEFAULT_SCENE_URL = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";
const scene = computed(() => props.sceneUrl?.trim() || DEFAULT_SCENE_URL);

const { locale } = useI18n();
const copy = computed(() => String(locale.value) === "ru"
  ? {
      lead: "Сильный бренд не создается",
      accent: "случайно.",
      description: "Он строится через понятную систему, точную стратегию и сильные дизайн-решения.",
      support: "Onebranding помогает бизнесу стать узнаваемее, понятнее и ближе к выбору клиента.",
    }
  : {
      lead: "A strong brand is not created by",
      accent: "chance.",
      description: "It is built through a smart system, clear strategy, and powerful design decisions.",
      support: "Onebranding helps your business become easier to recognize, trust, and choose.",
    });
</script>

<template>
  <section class="robot" aria-labelledby="robot-title">
    <div class="robot__scene">
      <FooterRobotScene :scene="scene" />
    </div>
    <div class="robot__brand">
      <FooterBrandSparkles />
    </div>
    <div class="robot__copy">
      <h2 id="robot-title" class="robot__title">{{ copy.lead }} <span class="robot__green">{{ copy.accent }}</span></h2>
      <p class="robot__text">{{ copy.description }}</p>
      <p class="robot__support">{{ copy.support }}</p>
    </div>
  </section>
</template>

<style scoped>
/* --u is one pixel of the 2000px design frame. */
.robot {
  --u: 0.05vw;
  position: relative;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: clip;
  padding: calc(24 * var(--u)) 1.25rem calc(130 * var(--u));
  background: #000;
  color: #fff;
  text-align: center;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

/* The robot stands on the wordmark: its base runs behind the letters. The
   Spline camera fits the smaller side of the canvas, so this box (1000 x 900)
   sets the robot's size, with the robot centred in it. */
.robot__scene {
  position: relative;
  z-index: 1;
  width: min(100%, calc(1000 * var(--u)));
  /* The canvas starts above the section: its top is empty black, clipped. */
  margin-top: calc(-126 * var(--u));
}

.robot__scene :deep(.footer-robot-scene) {
  height: calc(900 * var(--u));
}

.robot__brand {
  position: relative;
  z-index: 2;
  width: 100%;
  margin-top: calc(-143 * var(--u));
  pointer-events: none;
}

.robot__brand :deep(.footer-brand-sparkles__title) {
  font-size: calc(205 * var(--u));
  letter-spacing: -0.02em;
  background: linear-gradient(100deg, #b9b9b9 0%, #ffffff 28%, #ffffff 70%, #e6e6e6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.robot__brand :deep(.footer-brand-sparkles__title span) {
  background: linear-gradient(180deg, #19f03b 0%, #00c72d 60%, #069b2a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.robot__brand :deep(.footer-brand-sparkles__stage) {
  width: min(94vw, calc(1450 * var(--u)));
  height: calc(300 * var(--u));
}

.robot__copy {
  position: relative;
  z-index: 3;
  max-width: calc(1150 * var(--u));
  margin-top: calc(-30 * var(--u));
}

.robot__title {
  margin: 0;
  font-size: calc(113 * var(--u));
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.robot__green {
  background: linear-gradient(180deg, #19f03b, #08b437);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.robot__text,
.robot__support {
  margin: 0;
  font-size: calc(41 * var(--u));
  line-height: 1.38;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.robot__text {
  margin-top: calc(80 * var(--u));
}

.robot__support {
  margin-top: calc(10 * var(--u));
  color: #19d03d;
}

@media (max-width: 767px) {
  .robot {
    padding: 2rem 1.25rem 4rem;
  }

  .robot__scene :deep(.footer-robot-scene) {
    height: clamp(20rem, 92vw, 26rem);
  }

  .robot__brand {
    margin-top: -1.5rem;
  }

  .robot__brand :deep(.footer-brand-sparkles__title) {
    font-size: 16vw;
  }

  .robot__brand :deep(.footer-brand-sparkles__stage) {
    height: 8rem;
  }

  .robot__copy {
    max-width: none;
    margin-top: 0;
  }

  .robot__title {
    font-size: 8.4vw;
  }

  .robot__text,
  .robot__support {
    font-size: 1.05rem;
  }

  .robot__text {
    margin-top: 1.25rem;
  }
}
</style>
