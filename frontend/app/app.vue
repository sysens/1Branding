<script setup lang="ts">
import GradualBlur from "./components/GradualBlur.vue";
</script>

<template>
  <div class="min-h-screen overflow-x-hidden overscroll-y-none">
    <NuxtLoadingIndicator color="#03cb00" :height="4" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <GradualBlur
      target="page"
      position="bottom"
      height="6rem"
      :strength="2"
      :divCount="5"
      curve="bezier"
      :exponential="true"
      :opacity="1"
    />
  </div>
</template>
