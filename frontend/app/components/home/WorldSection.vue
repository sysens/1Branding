<script setup lang="ts">
import NetworkGlobe from "~/components/ui/NetworkGlobe.vue";

const { t } = useI18n();
</script>

<template>
  <section id="world" class="world-section" aria-labelledby="world-title">
    <header class="world-section__heading">
      <h2 id="world-title">
        <span class="world-section__eyebrow">{{ t("home.world.eyebrow") }}</span>
        <span class="world-section__word">{{ t("home.world.word") }}</span>
      </h2>
    </header>
    <div class="world-section__globe">
      <NetworkGlobe :show-labels="false" />
    </div>
    <h3 class="world-section__statement">
      <span class="world-section__lead">{{ t("home.world.lead") }}</span>
      <strong>{{ t("home.world.strong") }}</strong>
      <span class="world-section__closing">{{ t("home.world.closing") }}</span>
    </h3>
  </section>
</template>

<style scoped>
.world-section { position: relative; isolation: isolate; width: 100%; padding: 48px 0 220px; overflow: clip; background: #000; color: #fff; text-align: center; }
.world-section__heading { position: relative; z-index: 0; padding-inline: 20px; }
.world-section__heading h2 { margin: 0; font-weight: 700; letter-spacing: 0; }
.world-section__eyebrow { display: block; font-size: 42px; line-height: 48px; font-weight: 600; }
.world-section__word { display: block; margin-top: -12px; font-size: 268px; line-height: .9; background: linear-gradient(110deg, #00ed28 20%, #00b42c 58%, #008c29 85%); background-clip: text; color: transparent; }
.world-section__globe { position: relative; z-index: 1; width: min(1160px, 100%); height: 760px; margin: -140px auto 0; }
.world-section__statement { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; margin: 0 auto; padding-inline: 24px; font-weight: 400; letter-spacing: 0; }
.world-section__lead { font-size: 29px; line-height: 36px; }
.world-section__statement strong { display: block; font-size: 98px; font-weight: 700; line-height: 1.04; background: linear-gradient(100deg, #007e2a, #00e728 48%, #006322); background-clip: text; color: transparent; }
.world-section__closing { font-size: 36px; line-height: 44px; }
@media (min-width: 768px) and (max-width: 1199px) {
  .world-section__word { font-size: 200px; }
  .world-section__globe { height: 650px; margin-top: -116px; }
  .world-section__statement strong { font-size: 68px; }
  .world-section__lead { font-size: 24px; }
  .world-section__closing { font-size: 30px; }
}
@media (max-width: 767px) {
  .world-section { padding: 40px 0 112px; }
  .world-section__eyebrow { font-size: 24px; line-height: 32px; }
  .world-section__word { margin-top: 4px; font-size: 128px; }
  .world-section__globe { height: auto; aspect-ratio: 1; margin-top: -48px; }
  .world-section__statement { margin-top: 24px; padding-inline: 20px; }
  .world-section__lead { max-width: 480px; font-size: 20px; line-height: 28px; }
  .world-section__statement strong { margin-block: 8px; font-size: 48px; line-height: 1; }
  .world-section__closing { font-size: 24px; line-height: 32px; }
}
@media (max-width: 539px) {
  .world-section__eyebrow { font-size: 20px; line-height: 28px; }
  .world-section__word { font-size: 94px; }
  .world-section__globe { margin-top: -32px; }
  .world-section__statement strong { font-size: 42px; }
}
@media (max-width: 374px) {
  .world-section__heading { padding-inline: 12px; }
  .world-section__word { font-size: 80px; }
  .world-section__statement strong { font-size: 36px; }
}
</style>
