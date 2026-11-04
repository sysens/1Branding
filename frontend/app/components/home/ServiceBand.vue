<script setup lang="ts">
import { computed } from "vue";
import { useViewportActivity } from "~/composables/useViewportActivity";

// The band of what OneBranding designs ("BRAND IDENTITY ✦ LOGO DESIGN ✦ …"),
// above the landing's tilted collage and tilted with it: one line between two
// hairlines that runs steadily to the left (as jsoft.vercel.app's), the list
// twice so the loop has no seam. It pauses off screen and stands still with
// reduced motion.

const { tm, rt } = useI18n();
const items = computed(() => (tm("home.serviceBand.items") as unknown[]).map((item) => rt(item as never)));

const { targetRef, isActive } = useViewportActivity({ rootMargin: "200px 0px" });
</script>

<template>
  <div ref="targetRef" class="service-band" :class="{ 'is-paused': !isActive }">
    <div class="service-band__track">
      <ul v-for="copy in 2" :key="copy" class="service-band__list" :aria-hidden="copy === 2 ? 'true' : undefined">
        <li v-for="item in items" :key="item" class="service-band__item">
          <span>{{ item }}</span>
          <span class="service-band__star" aria-hidden="true">✦</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* The design at 1440px: 40px bold capitals in dark grey between two light
   hairlines, the stars smaller and lighter, one full set every 60 s. */
.service-band {
  overflow: hidden;
  margin-bottom: clamp(1rem, 1.6vw, 1.5rem);
  padding-block: clamp(0.6rem, 1vw, 0.9rem);
  border-block: 1px solid rgb(0 0 0 / 0.14);
  color: #3a3a3a;
  font-family: var(--app-font-display);
  font-size: clamp(1.25rem, 2.8vw, 2.5rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  white-space: nowrap;
}

.service-band__track {
  display: flex;
  width: max-content;
}

.service-band__list {
  display: flex;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.service-band__item {
  display: flex;
  align-items: center;
}

.service-band__star {
  padding-inline: 0.55em;
  color: #9a9a9a;
  font-size: 0.55em;
  line-height: 1;
}

@media (prefers-reduced-motion: no-preference) {
  .service-band__track {
    animation: service-band-run 60s linear infinite;
  }

  .service-band.is-paused .service-band__track {
    animation-play-state: paused;
  }
}

/* One list's width: the second copy then stands where the first began. */
@keyframes service-band-run {
  to {
    transform: translate3d(-50%, 0, 0);
  }
}
</style>
