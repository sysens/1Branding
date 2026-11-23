<script setup lang="ts">
import { SECTIONS } from "../../data/navigation";

// Links to the proposal's chapters; the header and the phone menu style them.
defineProps<{ linkClass: string }>();
</script>

<template>
  <a v-for="section in SECTIONS" :key="section.id" :href="`#${section.id}`" :class="linkClass">{{ section.label }}</a>
</template>
