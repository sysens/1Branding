<script setup lang="ts">
import NetworkGlobe from "~/components/ui/NetworkGlobe.vue";
</script>

<template>
  <section
    id="globe-preview"
    class="globe-preview"
    aria-label="Global network globe"
  >
    <NetworkGlobe />
  </section>
</template>

<style scoped>
.globe-preview {
  position: relative;
  height: 90svh;
  min-height: 560px;
  max-height: 980px;
  width: 100%;
  background: #040507;
  isolation: isolate;
}
@media (max-width: 767px) {
  .globe-preview {
    height: 70svh;
    min-height: 460px;
  }
}
</style>
