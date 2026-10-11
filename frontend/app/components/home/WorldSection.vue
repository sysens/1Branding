<script setup lang="ts">
import NetworkGlobe from "~/components/ui/NetworkGlobe.vue";
import WorldStarfield from "./WorldStarfield.vue";

const { t } = useI18n();
</script>

<template>
  <section id="world" class="world-section" aria-labelledby="world-title">
    <ClientOnly><WorldStarfield /></ClientOnly>
    <header class="world-section__heading">
      <h2 id="world-title">
        <span class="world-section__eyebrow">{{ t("home.world.eyebrow") }}</span>
        <span class="world-section__word">{{ t("home.world.word") }}</span>
      </h2>
    </header>
    <div class="world-section__globe">
      <NetworkGlobe :show-labels="false" />
    </div>
  </section>
</template>

<style scoped>
.world-section { position: relative; isolation: isolate; width: 100%; padding: 160px 0 0; overflow: clip; background: #000; color: #fff; text-align: center; }
.world-section__heading { position: relative; z-index: 1; padding-inline: 20px; }
.world-section__heading h2 { margin: 0; font-weight: 700; letter-spacing: 0; }
.world-section__eyebrow { display: block; font-size: 42px; line-height: 48px; font-weight: 600; }
.world-section__word { display: block; margin-top: -12px; font-size: 268px; line-height: .9; background: linear-gradient(110deg, #00ed28 20%, #00b42c 58%, #008c29 85%); background-clip: text; color: transparent; }
.world-section__globe { position: relative; z-index: 1; width: min(1160px, 100%); height: 760px; margin: -140px auto 0; }
@media (min-width: 768px) and (max-width: 1199px) {
  .world-section__word { font-size: 200px; }
  .world-section__globe { height: 650px; margin-top: -116px; }
}
@media (max-width: 767px) {
  .world-section { padding: 96px 0 0; }
  .world-section__eyebrow { font-size: 24px; line-height: 32px; }
  .world-section__word { margin-top: 4px; font-size: 128px; }
  .world-section__globe { height: auto; aspect-ratio: 1; margin-top: -48px; }
}
@media (max-width: 539px) {
  .world-section__eyebrow { font-size: 20px; line-height: 28px; }
  .world-section__word { font-size: 94px; }
  .world-section__globe { margin-top: -32px; }
}
@media (max-width: 374px) {
  .world-section__heading { padding-inline: 12px; }
  .world-section__word { font-size: 80px; }
}
</style>
