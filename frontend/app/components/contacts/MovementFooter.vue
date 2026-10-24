<script setup lang="ts">
import MovementClock from "./MovementClock.vue";

const localePath = useLocalePath();

const { t } = useI18n();
const year = new Date().getFullYear();

</script>

<template>
  <footer class="movement-footer">
    <section class="movement-footer__stage" aria-labelledby="movement-title">
      <MovementClock />
      <div class="movement-footer__content">
        <h2 id="movement-title">{{ t("movement.first") }}<br >{{ t("movement.second") }}</h2>
        <p>{{ t("movement.description") }}<br >{{ t("movement.detail") }}</p>
        <NuxtLink :to="localePath('/projects')" class="ob-button">{{ t("movement.action") }}</NuxtLink>
      </div>
    </section>
    <div class="movement-footer__legal">
      <small>Copyright &copy; {{ year }} OneBranding. {{ t("movement.copyright") }}</small>
    </div>
  </footer>
</template>

<style scoped>
.movement-footer {
  position: relative;
  z-index: 31;
  width: 100%;
  overflow: hidden;
  background: #080a0a;
  color: #fff;
}
.movement-footer__stage {
  position: relative;
  width: min(100%, 108rem);
  min-height: 36.875rem;
  margin-inline: auto;
  padding: 7.1875rem 4rem 5rem;
  isolation: isolate;
}
.movement-footer__content {
  position: relative;
  z-index: 1;
  width: min(31.875rem, 48%);
  margin-left: 46%;
}
/* Type: the title is the h2 step (56px at 1440, 66 at 1920), the text the
   body step, the copyright the caption step. */
h2 {
  margin: 0;
  color: #f3f3fb;
  font-family: var(--app-font-display);
  font-size: var(--type-h2-size);
  font-weight: 600;
  line-height: var(--type-h2-lh);
  letter-spacing: var(--type-h2-ls);
}
p {
  margin: 0.75rem 0 1.75rem;
  color: #d9d9dd;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
}
.movement-footer__legal {
  position: relative;
  max-width: 85rem;
  margin: auto;
  padding: 1.5rem 4rem 2rem;
  /* At least #8f8f8f on the near-black background (was #7b8086). */
  color: #8f9399;
}
small {
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  letter-spacing: var(--type-caption-ls);
}
@media (max-width: 1199px) {
  .movement-footer__stage { padding-inline: 2rem; }
  .movement-footer__content { margin-left: 50%; }
}
@media (max-width: 767px) {
  .movement-footer__stage {
    padding: 16.875rem 1.25rem 3rem;
    min-height: 36.875rem;
  }
  .movement-footer__content {
    width: 100%;
    margin: 0;
    text-align: center;
  }
  .movement-footer__legal { padding: 1.5rem; text-align: center; }
}
</style>
