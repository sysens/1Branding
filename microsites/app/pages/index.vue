<script setup lang="ts">
import { SITES, siteOrigin } from "#shared/sites";

// Shown on hosts that belong to no site (localhost, the Railway domain):
// every site with a link to its preview here and to its own address.
useHead({
  title: "OneBranding — project sites",
  htmlAttrs: { lang: "en" },
  bodyAttrs: { class: "bg-neutral-950 text-neutral-100 antialiased" },
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});
</script>

<template>
  <main class="mx-auto max-w-2xl px-6 py-16 font-sans">
    <p class="text-xs uppercase tracking-[.2em] text-neutral-500">OneBranding</p>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight">Project sites</h1>
    <p class="mt-3 text-sm text-neutral-400">Each site is served at the root of its own subdomain. Here every one can be opened under its folder name.</p>

    <ul class="mt-10 divide-y divide-neutral-800 border-y border-neutral-800">
      <li v-for="site in SITES" :key="site.slug" class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
        <NuxtLink :to="`/${site.slug}`" class="text-lg font-medium hover:underline">{{ site.name }}</NuxtLink>
        <a :href="siteOrigin(site)" class="text-sm text-neutral-400 hover:text-neutral-100">{{ site.hosts[0] }}</a>
      </li>
    </ul>
  </main>
</template>
