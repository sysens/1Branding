<script setup lang="ts">
import MovementClock from "./MovementClock.vue";
import CinematicAction from "./CinematicAction.vue";

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
        <CinematicAction :to="localePath('/projects')">{{ t("movement.action") }}</CinematicAction>
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
  width: min(100%, 1728px);
  min-height: 590px;
  margin-inline: auto;
  padding: 115px 4rem 5rem;
  isolation: isolate;
}
.movement-footer__content {
  position: relative;
  z-index: 1;
  width: min(510px, 48%);
  margin-left: 46%;
}
h2 {
  margin: 0;
  color: #f3f3fb;
  font-size: 72px;
  font-weight: 500;
  line-height: 0.98;
  letter-spacing: 0;
}
p {
  margin: 0.75rem 0 1.75rem;
  color: #d9d9dd;
  font-size: 1rem;
  line-height: 1.45;
  letter-spacing: 0;
}
.movement-footer__legal {
  position: relative;
  max-width: 1360px;
  margin: auto;
  padding: 1.5rem 4rem 2rem;
  color: #7b8086;
}
small { font-size: 0.875rem; }
@media (max-width: 1199px) {
  h2 { font-size: 56px; }
  .movement-footer__stage { padding-inline: 2rem; }
  .movement-footer__content { margin-left: 50%; }
}
@media (max-width: 767px) {
  .movement-footer__stage {
    padding: 270px 1.25rem 3rem;
    min-height: 590px;
  }
  .movement-footer__content {
    width: 100%;
    margin: 0;
    text-align: center;
  }
  h2 { font-size: 44px; }
  p { font-size: 0.9375rem; }
  .movement-footer__legal { padding: 1.5rem; text-align: center; }
}
</style>
