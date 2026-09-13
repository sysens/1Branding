<template>
  <section id="airways-scene" class="airways-scene" aria-label="Uzbekistan Airways branding showcase">
    <div
      class="airways-scene__image"
      role="img"
      aria-label="Uzbekistan Airways: New Horizons Together, aircraft branding displayed on a panoramic stage"
    />
  </section>
</template>

<style scoped>
.airways-scene {
  position: relative;
  background: #000;
}
.airways-scene__image {
  width: 100%;
  aspect-ratio: 8192 / 4611;
  background: #000 url("/home/scene.jpg") center / cover no-repeat;
}
</style>
