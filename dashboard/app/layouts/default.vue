<script setup lang="ts">
// The app frame: the sidebar and, in the inset, the page with its header.
const route = useRoute();
const title = computed(() => (route.meta.title as string | undefined) ?? "");
</script>

<template>
  <SidebarProvider>
    <AppSidebar variant="inset" />
    <SidebarInset>
      <AppHeader :title="title" />
      <div class="flex flex-1 flex-col">
        <div class="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <slot />
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
