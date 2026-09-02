<script setup lang="ts">
import SatisfiedClientsSection from "./SatisfiedClientsSection.vue";
import type { LandingSection2 } from "~/types/landingPayload";

withDefaults(
  defineProps<{
    collageRows?: string[][];
    partnerLogos?: string[];
    section?: LandingSection2 | null;
  }>(),
  {
    collageRows: () => [],
    partnerLogos: () => [],
    section: null,
  }
);
</script>

<template>
  <SatisfiedClientsSection
    :section="section"
    :partner-logos="partnerLogos"
    :collage-rows="collageRows"
  />
</template>
