<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
const notFound = computed(() => props.error.statusCode === 404);

useHead({
  title: notFound.value ? "Page not found" : "Error",
  meta: [{ name: "robots", content: "noindex" }],
  bodyAttrs: { class: "bg-neutral-950 text-neutral-100 antialiased" },
});
</script>

<template>
  <main class="grid min-h-screen place-items-center px-6 text-center font-sans">
    <div>
      <p class="text-6xl font-semibold tracking-tight">{{ error.statusCode }}</p>
      <p class="mt-4 text-neutral-400">{{ notFound ? "There is no such page." : "Something went wrong." }}</p>
      <button type="button" class="mt-8 text-sm underline underline-offset-4" @click="clearError({ redirect: '/' })">Go to the start</button>
    </div>
  </main>
</template>
