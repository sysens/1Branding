<script setup lang="ts">
import { media } from "../../media";

// The lit 3D logo: behind the hero text on larger screens, above it on phones.
</script>

<template>
  <picture
    class="pointer-events-none absolute inset-0 -z-[2] max-[690px]:relative max-[690px]:inset-auto max-[690px]:z-0 max-[690px]:block"
    aria-hidden="true"
  >
    <source media="(max-width: 690px)" :srcset="media('proposal/cover-mobile.webp')">
    <img
      :src="media('proposal/cover-studio.webp')"
      width="1832"
      height="858"
      alt=""
      fetchpriority="high"
      class="h-full w-full object-contain object-[right_center] max-[690px]:aspect-[2.55] max-[690px]:h-auto max-[690px]:object-center"
    >
  </picture>
</template>
