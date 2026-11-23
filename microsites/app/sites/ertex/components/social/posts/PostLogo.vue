<script setup lang="ts">
import { media } from "../../../media";

// The ERTEX logo in a post's corner: the dark version on blue and photo
// posts, the light one on the paper post.
defineProps<{ light?: boolean }>();
</script>

<template>
  <img
    :src="media(light ? 'logo-light.png' : 'logo-dark.png')"
    alt="ERTEX Group"
    loading="lazy"
    width="1503"
    height="476"
    class="relative z-[3] h-auto w-[29%]"
  >
</template>
