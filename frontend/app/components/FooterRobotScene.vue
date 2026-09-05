<script setup lang="ts">
import BrandedRobotScene from "~/components/home/BrandedRobotScene.vue";
defineProps<{ scene: string }>();
</script>

<template>
  <div class="footer-robot-scene">
    <ClientOnly>
      <BrandedRobotScene :scene="scene" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.footer-robot-scene {
  position: relative;
  width: 100%;
  height: clamp(27rem, 43vw, 40rem);
}
@media (max-width: 900px) {
  .footer-robot-scene { height: clamp(23rem, 85vw, 32rem); }
}
</style>
