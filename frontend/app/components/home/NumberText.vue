<script setup lang="ts">
import SatisfiedClientsSection from "./SatisfiedClientsSection.vue";

withDefaults(
  defineProps<{
    collageRows?: string[][];
    partnerLogos?: string[];
  }>(),
  {
    collageRows: () => [],
    partnerLogos: () => [],
  }
);
</script>

<template>
  <SatisfiedClientsSection
    :partner-logos="partnerLogos"
    :collage-rows="collageRows"
  />
</template>
