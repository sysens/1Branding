<script setup lang="ts">
import { computed } from "vue";
import MovementClock from "./MovementClock.vue";
import CinematicAction from "./CinematicAction.vue";

const localePath = useLocalePath();

const { locale } = useI18n();
const copy = computed(() => locale.value === "ru" ? {
  first: "Создадим",
  second: "будущее.",
  description: "Новая глава вашего бренда начинается с One Branding.",
  detail: "Давайте сделаем следующий шаг вместе.",
  action: "Смотреть проекты",
  copyright: "Все права защищены.",
} : {
  first: "Join the",
  second: "Movement",
  description: "Build your next chapter with One Branding.",
  detail: "Your brand's future starts here.",
  action: "See in Action",
  copyright: "All rights reserved.",
});
const year = new Date().getFullYear();

</script>

<template>
  <footer class="movement-footer">
    <section class="movement-footer__stage" aria-labelledby="movement-title">
      <MovementClock />
      <div class="movement-footer__content">
        <h2 id="movement-title">{{ copy.first }}<br />{{ copy.second }}</h2>
        <p>{{ copy.description }}<br />{{ copy.detail }}</p>
        <CinematicAction :to="localePath('/Projects')">{{ copy.action }}</CinematicAction>
      </div>
    </section>
    <div class="movement-footer__legal">
      <small>Copyright &copy; {{ year }} One Branding. {{ copy.copyright }}</small>
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
