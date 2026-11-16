<script setup lang="ts">
// The frame every page shares: the page and, under it, the footer, which
// hydrates when it scrolls near. A page without the footer sets
// definePageMeta({ footer: false }). (The site header is in app.vue, before
// <main>: it hangs from a sticky line at the top of the whole page.)
const route = useRoute();
const showFooter = computed(() => route.meta.footer !== false);
const FOOTER_HYDRATION = { rootMargin: "600px 0px" };
</script>

<template>
  <div>
    <slot />
    <LazyFooter v-if="showFooter" :hydrate-on-visible="FOOTER_HYDRATION" />
  </div>
</template>
