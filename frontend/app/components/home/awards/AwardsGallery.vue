<script setup lang="ts">
import { ref, toRef } from "vue";
import { useAwardsGallery } from "~/composables/useAwardsGallery";

const props = defineProps<{ paused: boolean }>();
const root = ref<HTMLElement | null>(null);
const surface = ref<HTMLElement | null>(null);
const { ready } = useAwardsGallery(root, surface, toRef(props, "paused"));
</script>

<template>
  <div ref="root" class="awards-gallery" :data-ready="ready" role="img" aria-label="Seven curved rows of OneBranding projects">
    <div ref="surface" class="awards-gallery__surface" aria-hidden="true" />
  </div>
</template>

<style src="./AwardsGallery.css" />
