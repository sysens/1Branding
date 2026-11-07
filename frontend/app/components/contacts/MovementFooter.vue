<script setup lang="ts">
// The end of the contact page: the copyright line only. (The "movement" clock
// and call to action moved to the top of the page: ContactHero.vue.)
const { t } = useI18n();
const year = new Date().getFullYear();
</script>

<template>
  <footer class="movement-footer">
    <small>Copyright &copy; {{ year }} OneBranding. {{ t("movement.copyright") }}</small>
  </footer>
</template>

<style scoped>
.movement-footer {
  position: relative;
  z-index: 31;
  width: 100%;
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
  .movement-footer { padding-inline: 2rem; }
}
@media (max-width: 767px) {
  .movement-footer { padding: 1.5rem; text-align: center; }
}
</style>
