<script setup lang="ts">
// The small uppercase line over a heading.
withDefaults(defineProps<{ tone?: "accent" | "hero" | "seal" }>(), { tone: "accent" });

const TONES = {
  accent: "text-[12px] tracking-[.135em] text-ertex-blue",
  hero: "mb-5 text-[11px] tracking-[.15em] text-[#c3d2e5] max-[690px]:mb-3",
  seal: "text-[12px] tracking-[.135em] text-[#a1b9db]",
};
</script>

<template>
  <p class="font-[640] uppercase leading-[1.45]" :class="TONES[tone]">
    <slot />
  </p>
</template>
