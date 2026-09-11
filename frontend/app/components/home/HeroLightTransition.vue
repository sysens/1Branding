<script setup lang="ts">
withDefaults(defineProps<{ direction?: "to-light" | "to-dark" }>(), { direction: "to-light" });
</script>

<template>
  <div class="hero-light-transition" :class="{ 'hero-light-transition--reverse': direction === 'to-dark' }" aria-hidden="true">
    <div class="hero-light-transition__surface" />
  </div>
</template>

<style scoped>
.hero-light-transition {
  position: relative;
  height: clamp(36rem, 110svh, 68rem);
  overflow: clip;
  pointer-events: none;
  isolation: isolate;
  /* Fade the entire leading edge so the light never starts at a cut-off line. */
  mask-image: linear-gradient(to bottom, transparent, #000 15%);
}

.hero-light-transition__surface {
  position: absolute;
  inset: -12% -2%;
  background: radial-gradient(
    ellipse 90% 73% at 50% -5%,
    rgb(0 0 0 / 0) 20%,
    rgb(0 18 5 / 0.72) 38%,
    #004c13 48%,
    #00941c 59%,
    #03cb32 67%,
    #96eeb0 78%,
    #e4faec 90%,
    #fff 100%
  );
  transform: translate3d(0, var(--light-shift, 0%), 0);
}

.hero-light-transition--reverse { mask-image: linear-gradient(to bottom, #000 85%, transparent); }
.hero-light-transition--reverse .hero-light-transition__surface {
  transform: rotate(180deg) translate3d(0, var(--light-shift, 0%), 0);
}

@media (max-width: 767px) {
  .hero-light-transition {
    height: clamp(30rem, 90svh, 50rem);
  }

  .hero-light-transition__surface {
    background-size: 160% 100%;
    background-position: center;
  }
}
</style>
