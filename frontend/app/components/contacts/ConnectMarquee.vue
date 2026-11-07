<script setup lang="ts">
// The band under the page title: the word "Connect" and a green spark, over
// and over, drifting left. Decorative (the page title and the details below say
// everything), so hidden from screen readers; the motion stops for visitors who
// ask for less of it.
const { t } = useI18n();
</script>

<template>
  <div class="connect-band" aria-hidden="true">
    <div class="connect-band__track">
      <div v-for="group in 2" :key="group" class="connect-band__group">
        <span v-for="item in 6" :key="item" class="connect-band__item">
          <span class="connect-band__word">{{ t("contacts.marquee") }}</span>
          <svg class="connect-band__spark" viewBox="0 0 24 24" focusable="false">
            <path d="M12 0C12.9 7.2 16.8 11.1 24 12C16.8 12.9 12.9 16.8 12 24C11.1 16.8 7.2 12.9 0 12C7.2 11.1 11.1 7.2 12 0Z" />
          </svg>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.connect-band {
  position: relative;
  overflow: hidden;
  border-block: 1px solid rgb(255 255 255 / 0.1);
  /* The ends fade into the black page. */
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}

.connect-band__track {
  display: flex;
  width: max-content;
  animation: connect-band-drift 48s linear infinite;
}

.connect-band__group {
  display: flex;
  flex: none;
}

.connect-band__item {
  display: inline-flex;
  align-items: center;
  gap: clamp(1.25rem, 3vw, 2.75rem);
  padding-right: clamp(1.25rem, 3vw, 2.75rem);
}

.connect-band__word {
  padding-block: clamp(1rem, 2vw, 1.75rem);
  font-family: var(--app-font-display);
  font-size: clamp(2.75rem, 1.5rem + 5vw, 6rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: var(--type-h1-ls);
  color: transparent;
  -webkit-text-stroke: 1px rgb(255 255 255 / 0.42);
  white-space: nowrap;
}

.connect-band__spark {
  flex: none;
  width: clamp(1.25rem, 2.4vw, 2.25rem);
  height: auto;
  fill: #20e848;
  filter: drop-shadow(0 0 0.6rem rgb(32 232 72 / 0.55));
}

@keyframes connect-band-drift {
  to { transform: translateX(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  .connect-band__track { animation: none; }
}
</style>
