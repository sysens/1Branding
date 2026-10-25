<script setup lang="ts">
import { computed } from "vue";
import type { ProjectWallItem } from "~/composables/useProjectsWallData";

type WallCell = {
  index: number;
  item: ProjectWallItem;
};

const CELLS_PER_GRID = 20;

const { projects } = await useProjectsWallData();
const {
  containerRef,
  gridCopies,
  isDragging,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  planeRef,
  wallStyle,
} = useInfiniteProjectsWall();

// Copy (1, 1) starts on screen: it is the one exposed to assistive technology and
// loaded eagerly; the others are decorative repeats around it.
const copies = computed(() => {
  const { columns, rows } = gridCopies.value;
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      index,
      primary: column === 1 && row === 1,
      style: {
        left: `calc(var(--project-base-width) * ${column})`,
        top: `calc(var(--project-base-height) * ${row})`,
      },
    };
  });
});

const cells = computed<WallCell[]>(() => {
  if (!projects.value.length) return [];

  return Array.from({ length: CELLS_PER_GRID }, (_, index) => ({
    index,
    item: projects.value[index % projects.value.length]!,
  }));
});

useHead(() => ({
  htmlAttrs: { class: "projects-wall-document" },
  bodyAttrs: { class: "projects-wall-document" },
  link: projects.value.slice(0, 5).map((project) => ({
    rel: "preload",
    as: "image",
    href: project.image,
  })),
}));
</script>

<template>
  <section
    ref="containerRef"
    class="projects-wall"
    :class="{ 'projects-wall--dragging': isDragging }"
    :style="wallStyle"
    :aria-label="$t('a11y.projects')"
    @click.capture="onClick"
    @pointercancel="onPointerUp"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @wheel="onWheel"
  >
    <div v-if="cells.length" ref="planeRef" class="projects-wall__plane">
      <div
        v-for="copy in copies"
        :key="copy.index"
        class="projects-wall__grid"
        :style="copy.style"
        :aria-hidden="copy.primary ? undefined : true"
      >
        <div
          v-for="cell in cells"
          :key="`${copy.index}-${cell.item.id}-${cell.index}`"
          class="projects-wall__tile"
        >
          <NuxtLink
            :to="cell.item.to"
            class="projects-wall__card"
            :tabindex="copy.primary ? 0 : -1"
            :aria-label="cell.item.title"
            draggable="false"
            @dragstart.prevent
          >
            <img
              :src="cell.item.image"
              :alt="cell.item.title"
              :loading="copy.primary ? 'eager' : 'lazy'"
              :fetchpriority="copy.primary && cell.index < 5 ? 'high' : 'auto'"
              decoding="async"
              draggable="false"
            >
          </NuxtLink>
        </div>
      </div>
    </div>

    <p v-else class="projects-wall__empty">{{ $t("projectsPage.unavailable") }}</p>
  </section>
</template>

<style scoped>
/* The wall's sizes before it measures its screen: the tiles of
   getMetrics() in useInfiniteProjectsWall.ts (4 x 5 tiles of 16:9, 20px
   apart; 500px wide, 390px up to 1024px, 285px up to 640px). Past 1920px the
   script grows them with the root size once it runs. */
.projects-wall {
  --project-tile-width: 500px;
  --project-wall-gap: 20px;
  --project-tile-height: calc(var(--project-tile-width) * 9 / 16);
  --project-base-width: calc(4 * (var(--project-tile-width) + var(--project-wall-gap)));
  --project-base-height: calc(5 * (var(--project-tile-height) + var(--project-wall-gap)));
  --project-grid-width: calc(var(--project-base-width) - var(--project-wall-gap));
  --project-grid-height: calc(var(--project-base-height) - var(--project-wall-gap));
  position: fixed;
  inset: 0;
  z-index: 800;
  overflow: hidden;
  width: 100%;
  height: 100dvh;
  background: #000000;
  cursor: grab;
  overscroll-behavior: none;
  touch-action: none;
  user-select: none;
}

@media (max-width: 1024px) {
  .projects-wall {
    --project-tile-width: 390px;
  }
}

@media (max-width: 640px) {
  .projects-wall {
    --project-tile-width: 285px;
  }
}

.projects-wall--dragging {
  cursor: grabbing;
}

.projects-wall__plane {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(var(--project-base-width) * var(--project-copy-columns, 3));
  height: calc(var(--project-base-height) * var(--project-copy-rows, 3));
  will-change: transform;
}

.projects-wall__grid {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(4, var(--project-tile-width));
  grid-template-rows: repeat(5, var(--project-tile-height));
  gap: var(--project-wall-gap);
  width: var(--project-grid-width);
  height: var(--project-grid-height);
}

.projects-wall__tile {
  position: relative;
  width: var(--project-tile-width);
  height: var(--project-tile-height);
}

.projects-wall__tile:hover {
  z-index: 10;
}

.projects-wall__card {
  position: relative;
  display: block;
  overflow: hidden;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  background: #0a0a0a;
  transform: translateZ(0);
  transition: transform 260ms ease, box-shadow 260ms ease;
}

.projects-wall__card:hover,
.projects-wall__card:focus-visible {
  z-index: 2;
  outline: none;
  transform: scale(1.05);
  box-shadow: 0 1.125rem 3.375rem rgba(0, 0, 0, 0.24);
}

.projects-wall__card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  pointer-events: none;
}

.projects-wall__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: 0;
  /* Readable on the black wall (was #111111, invisible). */
  color: #8f8f8f;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  font-weight: 400;
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
  transform: translate(-50%, -50%);
}

:global(html.projects-wall-document),
:global(body.projects-wall-document) {
  overflow: hidden;
  overscroll-behavior: none;
}

@media (prefers-reduced-motion: reduce) {
  .projects-wall__card {
    transition-duration: 0ms;
  }
}
</style>
