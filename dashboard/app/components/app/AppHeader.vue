<script setup lang="ts">
// The page's title and, on report pages, the filters (page meta `filters`).
defineProps<{ title: string }>();
const route = useRoute();
const filters = computed(() => (route.meta.filters as string[] | undefined) ?? []);
</script>

<template>
  <header class="bg-background/80 sticky top-0 z-20 flex shrink-0 flex-col gap-2 border-b backdrop-blur md:rounded-t-xl">
    <div class="flex h-(--header-height) min-h-12 items-center gap-2 px-4 lg:px-6">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mx-1 data-[orientation=vertical]:h-4" />
      <h1 class="truncate text-base font-medium">{{ title }}</h1>
      <div class="ml-auto flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <div v-if="filters.length" class="flex flex-wrap items-center gap-2 px-4 pb-3 lg:px-6">
      <FilterBar :show="filters" />
    </div>
  </header>
</template>
