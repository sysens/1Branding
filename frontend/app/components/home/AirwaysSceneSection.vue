<script setup lang="ts">
import { ref, watch } from "vue";
import { useViewportActivity } from "~/composables/useViewportActivity";

// A CSS background is fetched as soon as the element is laid out, even at the
// very bottom of the page; attach it only once the section is ~1.5 screens away.
const { targetRef, isActive } = useViewportActivity({ rootMargin: "1200px 0px" });
const loaded = ref(false);
watch(isActive, (active) => { if (active) loaded.value = true; });
</script>

<template>
  <section id="airways-scene" ref="targetRef" class="airways-scene" aria-label="Uzbekistan Airways branding showcase">
    <div
      class="airways-scene__image"
      :class="{ 'is-loaded': loaded }"
      role="img"
      aria-label="Uzbekistan Airways: New Horizons Together, aircraft branding displayed on a panoramic stage"
    />
  </section>
</template>

<style scoped>
.airways-scene {
  position: relative;
  background: #000;
}
.airways-scene__image {
  width: 100%;
  aspect-ratio: 8192 / 4611;
  background: #000 center / cover no-repeat;
}
.airways-scene__image.is-loaded {
  background-image: url("/home/scene.jpg");
}
</style>
