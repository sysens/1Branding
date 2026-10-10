<script setup lang="ts">
import { computed } from "vue";
import Brands from "~/components/home/Brands.vue";
import AwardsStage from "~/components/home/awards/AwardsStage.vue";
import AwardsTransition from "~/components/home/awards/AwardsTransition.vue";

const { t } = useI18n();

// `transition` is the green-to-yellow glow under the stage that led into the
// yellow brand stories; the landing no longer has them, other pages can.
withDefaults(defineProps<{ logos?: string[]; transition?: boolean }>(), { logos: () => [], transition: true });
const fallbackLogos = ["/home/arianespace.webp", "/home/hyperlooptt.webp", "/home/accor.webp", "/home/rakuten.png", "/home/lexus.webp", "/home/sorare.webp", "/home/Vector.webp"];

const year = computed(() => t("home.awards.year") || "2026");
const title = computed(() => t("home.awards.title") || "Awwward");
const subtitle = computed(() => t("home.awards.subtitle") || "built the best brands of Uzbekistan");
</script>

<template>
  <section id="awards" class="awards-section" aria-labelledby="awards-title">
    <div class="awards-section__brands" role="group" aria-label="Our clients">
      <Brands :logos="logos.length ? logos : fallbackLogos" :duration-seconds="160" />
    </div>
    <header class="awards-section__heading">
      <h2 id="awards-title">
        <span class="awards-section__year">{{ year }}</span>
        <span class="awards-section__title">{{ title }}</span>
      </h2>
      <p>{{ subtitle }}</p>
    </header>
    <AwardsStage />
    <AwardsTransition v-if="transition" />
  </section>
</template>

<style scoped>
.awards-section { position: relative; z-index: 30; isolation: isolate; background: #000; color: #fff; }
.awards-section__brands { display: flex; align-items: center; height: 120px; overflow: clip; mask-image: linear-gradient(90deg, transparent, #000 13%, #000 87%, transparent); }
.awards-section__brands :deep(img) { height: 28px; max-width: 135px; filter: grayscale(1); opacity: .64; }
.awards-section__brands :deep(.spaceBetween) { min-height: 50px; }
.awards-section__heading { position: relative; z-index: 2; text-align: center; padding-inline: 20px; }
.awards-section__heading h2 { margin: 0; font-weight: 700; letter-spacing: 0; }
.awards-section__year { display: block; font-size: 320px; line-height: .85; color: transparent; -webkit-text-stroke: 2px #009c22; mask-image: linear-gradient(#000 48%, transparent 99%); }
.awards-section__title { position: relative; display: block; margin-top: -147px; font-size: 210px; line-height: .94; background: linear-gradient(115deg, #005e22 10%, #00e429 46%, #009426 86%); background-clip: text; -webkit-text-fill-color: transparent; }
.awards-section__heading p { margin: -2px 0 0; font-family: var(--app-font-display) !important; font-size: 30px; font-weight: 400; line-height: 36px; letter-spacing: 0; }
@media (min-width: 1600px) {
  .awards-section__year { font-size: 340px; }
  .awards-section__title { font-size: 238px; margin-top: -147px; }
}
@media (max-width: 1199px) {
  .awards-section__year { font-size: 250px; }
  .awards-section__title { font-size: 170px; margin-top: -108px; }
  .awards-section__heading p { font-size: 25px; line-height: 32px; }
}
@media (max-width: 899px) {
  .awards-section__year { font-size: 190px; }
  .awards-section__title { font-size: 132px; margin-top: -82px; }
  .awards-section__heading p { font-size: 22px; line-height: 28px; }
}
@media (max-width: 599px) {
  .awards-section__brands { height: 90px; }
  .awards-section__brands :deep(img) { height: 22px; max-width: 110px; }
  .awards-section__heading { padding-inline: 12px; }
  .awards-section__year { font-size: 114px; -webkit-text-stroke-width: 1px; }
  .awards-section__title { font-size: 80px; margin-top: -49px; }
  .awards-section__heading p { max-width: 310px; margin: 10px auto 0; font-size: 17px; line-height: 22px; }
}
@media (max-width: 374px) {
  .awards-section__year { font-size: 100px; }
  .awards-section__title { font-size: 64px; margin-top: -43px; }
}
</style>
