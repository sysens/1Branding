<script setup lang="ts">
// The frame every page shares: the site header (teleported to <body>, so its
// place here does not affect the layout) and the footer, which hydrates when
// it scrolls near. A page without the footer sets definePageMeta({ footer: false }).
const route = useRoute();
const showHeader = computed(() => route.meta.header !== false);
const showFooter = computed(() => route.meta.footer !== false);
const FOOTER_HYDRATION = { rootMargin: "600px 0px" };
</script>

<template>
  <div>
    <Header v-if="showHeader" />
    <slot />
    <LazyFooter v-if="showFooter" :hydrate-on-visible="FOOTER_HYDRATION" />
  </div>
</template>
