<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import GradualBlur from "./components/GradualBlur.vue";

const route = useRoute();
const showPageBlur = computed(() => !route.path.endsWith("/Projects"));
const showBottomBlur = computed(() =>
  showPageBlur.value && !route.path.replace(/\/$/, "").endsWith("/ContactPage")
);

// Bottom blur must not sit over the footer once the page is scrolled to its end
const isPageEnd = ref(false);

const updateIsPageEnd = () => {
  const doc = document.documentElement;
  const maxScroll = doc.scrollHeight - window.innerHeight;
  isPageEnd.value = maxScroll <= 8 || window.scrollY >= maxScroll - 8;
};

onMounted(() => {
  window.addEventListener("scroll", updateIsPageEnd, { passive: true });
  window.addEventListener("resize", updateIsPageEnd, { passive: true });
  updateIsPageEnd();
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateIsPageEnd);
  window.removeEventListener("resize", updateIsPageEnd);
});

watch(
  () => route.path,
  async () => {
    await nextTick();
    requestAnimationFrame(updateIsPageEnd);
  }
);
</script>

<template>
  <div class="app-shell min-h-screen overscroll-y-none">
    <NuxtLoadingIndicator color="#03cb00" :height="4" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <GradualBlur
      v-if="showBottomBlur"
      target="page"
      position="bottom"
      height="6rem"
      :strength="2"
      :divCount="5"
      curve="bezier"
      :exponential="true"
      :opacity="1"
      :z-index="700"
      :style="{ opacity: isPageEnd ? 0 : 1 }"
    />

    <GradualBlur
      v-if="showPageBlur"
      target="page"
      position="top"
      height="6rem"
      :strength="2"
      :divCount="5"
      curve="bezier"
      :exponential="true"
      :opacity="1"
      :z-index="700"
    />
  </div>
</template>

<style scoped>
.app-shell {
  overflow-x: clip;
}
</style>
