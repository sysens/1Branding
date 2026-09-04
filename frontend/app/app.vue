<script setup lang="ts">
import { computed } from "vue";
import GradualBlur from "./components/GradualBlur.vue";

const route = useRoute();
const showPageBlur = computed(() => !route.path.endsWith("/Projects"));
</script>

<template>
  <div class="app-shell min-h-screen overscroll-y-none">
    <NuxtLoadingIndicator color="#03cb00" :height="4" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <GradualBlur
      v-if="showPageBlur"
      target="page"
      position="bottom"
      height="6rem"
      :strength="2"
      :divCount="5"
      curve="bezier"
      :exponential="true"
      :opacity="1"
      :z-index="700"
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
