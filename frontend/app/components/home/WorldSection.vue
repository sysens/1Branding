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
        <span v-blur-reveal class="world-section__eyebrow">{{ `${t("home.world.eyebrow")} ` }}</span>
        <span v-blur-reveal class="world-section__word">{{ t("home.world.word") }}</span>
      </h2>
    </header>
    <div v-rise class="world-section__globe">
      <NetworkGlobe :show-labels="false" :controls="false" />
    </div>
    <h3 class="world-section__statement">
      <span v-blur-reveal class="world-section__lead">{{ `${t("home.world.lead")} ` }}</span>
      <strong v-blur-reveal>{{ `${t("home.world.strong")} ` }}</strong>
      <span v-blur-reveal class="world-section__closing">{{ t("home.world.closing") }}</span>
    </h3>
  </section>
</template>

<style scoped>
/* Type: the eyebrow is h3, "WORLD" display-xl (uppercase: caps tracking), the
   statement h4 / display-s / h3. The lead and closing keep weight 400 on
   purpose: the light lines frame the bold green word. */
.world-section { position: relative; isolation: isolate; width: 100%; padding: 160px 0 140px; overflow: clip; background: #000; color: #fff; text-align: center; }
.world-section__heading { position: relative; z-index: 1; padding-inline: 20px; }
.world-section__heading h2 { margin: 0; }
.world-section__eyebrow { display: block; font-family: var(--app-font-display); font-size: var(--type-h3-size); font-weight: 600; line-height: var(--type-h3-lh); letter-spacing: var(--type-h3-ls); }
/* margin-top in em of the word: its tighter step line height already pulls it
   up towards the eyebrow, as the old -12px did. */
.world-section__word { display: block; margin-top: -0.02em; font-family: var(--app-font-display); font-size: var(--type-display-xl-size); font-weight: 700; line-height: var(--type-display-xl-lh); letter-spacing: var(--type-caps-ls); background: linear-gradient(110deg, #00ed28 20%, #00b42c 58%, #008c29 85%); background-clip: text; color: transparent; }
/* The globe rises behind "WORLD": its overlap is a share of the word's size. */
.world-section__globe { position: relative; z-index: 1; width: min(1160px, 100%); height: 760px; margin: calc(-0.52 * var(--type-display-xl-size)) auto 0; }
/* The line under the globe: lead, the bright green word, closing. */
.world-section__statement { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; margin: 12px auto 0; padding-inline: 24px; color: #e4e4e4; font-family: var(--app-font-display); font-weight: 400; }
.world-section__lead { font-size: var(--type-h4-size); line-height: var(--type-h4-lh); letter-spacing: var(--type-h4-ls); }
.world-section__statement strong { display: block; color: #00ff00; font-size: var(--type-display-s-size); font-weight: 700; line-height: var(--type-display-s-lh); letter-spacing: var(--type-display-s-ls); }
.world-section__closing { font-size: var(--type-h3-size); line-height: var(--type-h3-lh); letter-spacing: var(--type-h3-ls); }
@media (min-width: 768px) and (max-width: 1199px) {
  .world-section__globe { height: 650px; margin-top: calc(-0.58 * var(--type-display-xl-size)); }
}
@media (max-width: 767px) {
  .world-section { padding: 96px 0 96px; }
  .world-section__statement { margin-top: 24px; padding-inline: 20px; }
  .world-section__lead { max-width: 480px; }
  .world-section__statement strong { margin-block: 0.1em; }
  .world-section__word { margin-top: 0.05em; }
  .world-section__globe { height: auto; aspect-ratio: 1; margin-top: calc(-0.375 * var(--type-display-xl-size)); }
}
@media (max-width: 539px) {
  .world-section__globe { margin-top: calc(-0.34 * var(--type-display-xl-size)); }
}
@media (max-width: 374px) {
  .world-section__heading { padding-inline: 12px; }
}
/* Under 360px the 88px floor of display-xl no longer fits "WORLD" on the
   screen: one step down. */
@media (max-width: 359px) {
  .world-section__word { font-size: var(--type-display-l-size); line-height: var(--type-display-l-lh); }
  .world-section__globe { margin-top: calc(-0.34 * var(--type-display-l-size)); }
}
</style>
