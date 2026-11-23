<script setup lang="ts">
// Line icons of the CRM's sidebar.
defineProps<{ name: "overview" | "samples" | "orders" }>();
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    class="h-4 w-4 flex-none fill-none stroke-current stroke-[1.4] max-[760px]:h-[13px] max-[760px]:w-[13px] max-[460px]:hidden"
  >
    <template v-if="name === 'overview'">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </template>
    <path v-else-if="name === 'samples'" d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
    <template v-else>
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <path d="M9 5V3h6v2M9 11h6M9 16h6" />
    </template>
  </svg>
</template>
