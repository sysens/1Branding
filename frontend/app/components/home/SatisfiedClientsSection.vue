<script setup lang="ts">
import ManifestoScroll from "./ManifestoScroll.vue";
import ServiceBand from "./ServiceBand.vue";
import ThreeLayer from "./ThreeLayer.vue";

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
        <!-- What we design, tilted with the collage under it. -->
        <ServiceBand />
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
