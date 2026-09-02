<script setup lang="ts">
import InfiniteProjectsWall from "~/components/Projects/InfiniteProjectsWall.vue";
import Header from "~/components/Header.vue";
</script>

<template>
  <div>
    <nav class="projects-navbar" aria-label="Main navigation">
      <div class="projects-navbar__inner">
        <Header />
      </div>
    </nav>

    <InfiniteProjectsWall />
  </div>
</template>

<style scoped>
.projects-navbar {
  position: fixed;
  top: clamp(1.25rem, 4vw, 3.75rem);
  left: 0;
  z-index: 1000;
  width: 100%;
  pointer-events: none;
}

.projects-navbar__inner {
  pointer-events: auto;
}
</style>
