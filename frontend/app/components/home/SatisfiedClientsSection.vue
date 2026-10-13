<script setup lang="ts">
import ManifestoScroll from "./ManifestoScroll.vue";
import ThreeLayer from "./threeLayer.vue";

withDefaults(
  defineProps<{
    collageRows?: string[][];
    partnerLogos?: string[];
  }>(),
  {
    collageRows: () => [],
    partnerLogos: () => [],
  },
);
</script>

<template>
  <section class="clients-reveal">
    <ManifestoScroll />

    <div class="clients-section__gallery">
      <div class="clients-section__collage">
        <ThreeLayer
          :rows="3"
          :row-sets="collageRows"
          :show-title="false"
          :show-button="false"
        />
      </div>
    </div>
  </section>
</template>

<style scoped src="./SatisfiedClientsSection.css"></style>
