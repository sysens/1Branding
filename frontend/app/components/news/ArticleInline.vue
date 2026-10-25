<script setup lang="ts">
import type { ArticlePart } from "~/utils/articleText";

// One line of an article: its text, with the links to the site's own pages
// (written with their language prefix, as each version of the article links
// to pages in its own language).
defineProps<{ parts: ArticlePart[] }>();
</script>

<template>
  <template v-for="(part, index) in parts" :key="index">
    <NuxtLink v-if="part.href" :to="part.href" class="article-link">{{ part.text }}</NuxtLink>
    <template v-else>{{ part.text }}</template>
  </template>
</template>
