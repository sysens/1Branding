<script setup lang="ts">
// Under the projects grid: the page is still being filled. A status line with a
// breathing dot, a heading and a short text, on a card with a green glow at
// its top edge. A role="status" region, so a screen reader announces it once.
const { t } = useI18n();
</script>

<template>
  <aside v-rise class="work-notice" role="status" aria-live="polite">
    <span class="work-notice__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3.6 17.1a1.9 1.9 0 0 0 2.7 2.7l5.7-5.7a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.1-.5-.5-2.1z" />
      </svg>
    </span>

    <div class="work-notice__body">
      <p class="work-notice__status">
        <span class="work-notice__dot" aria-hidden="true" />
        {{ t("projectsPage.notice.status") }}
      </p>
      <h2 class="work-notice__title">{{ t("projectsPage.notice.title") }}</h2>
      <p class="work-notice__text">{{ t("projectsPage.notice.text") }}</p>
    </div>

    <!-- A bar that fills and starts over, the work in progress. -->
    <span class="work-notice__bar" aria-hidden="true" />
  </aside>
</template>

<style scoped>
.work-notice {
  --green: #20e848;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: clamp(1rem, 2vw, 1.75rem);
  box-sizing: border-box;
  width: min(100% - 2.5rem, 52rem);
  margin: 0 auto;
  padding: clamp(1.25rem, 2.4vw, 2rem) clamp(1.25rem, 2.6vw, 2.25rem) clamp(1.5rem, 2.6vw, 2.25rem);
  overflow: hidden;
  border-radius: 1.1rem;
  background:
    radial-gradient(ellipse 70% 120% at 50% -35%, rgb(32 232 72 / 0.16), transparent 70%),
    linear-gradient(180deg, #0f1310 0%, #0a0c0a 100%);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.1),
    inset 0 1px 0 rgb(32 232 72 / 0.35),
    0 1.5rem 3.5rem -1.5rem rgb(0 0 0 / 0.8);
  color: #fff;
}

.work-notice__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: clamp(2.75rem, 4vw, 3.5rem);
  aspect-ratio: 1;
  border-radius: 0.85rem;
  background: rgb(32 232 72 / 0.1);
  box-shadow: inset 0 0 0 1px rgb(32 232 72 / 0.35);
}

.work-notice__icon svg {
  width: 52%;
  height: 52%;
  fill: none;
  stroke: var(--green);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.work-notice__body {
  min-width: 0;
}

.work-notice__status {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  color: var(--green);
  font-family: var(--app-font-sans);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  line-height: 1.2;
  text-transform: uppercase;
}

.work-notice__dot {
  position: relative;
  flex: none;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--green);
}

/* The ring that breathes out of the dot. */
.work-notice__dot::after {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--green);
  content: "";
  animation: work-notice-ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.work-notice__title {
  margin: 0.7rem 0 0;
  font-family: var(--app-font-display);
  font-size: clamp(1.4rem, 2.6vw, 2.1rem);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.work-notice__text {
  max-width: 40em;
  margin: 0.75rem 0 0;
  color: rgb(255 255 255 / 0.68);
  font-family: var(--app-font-sans);
  font-size: clamp(0.9375rem, 1.25vw, 1.0625rem);
  line-height: 1.5;
  text-wrap: pretty;
}

.work-notice__bar {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: rgb(255 255 255 / 0.06);
  overflow: hidden;
}

.work-notice__bar::after {
  position: absolute;
  inset: 0 auto 0 0;
  width: 38%;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--green) 55%, #9bffb2);
  content: "";
  animation: work-notice-run 2.8s ease-in-out infinite;
}

@keyframes work-notice-ping {
  0% {
    opacity: 0.7;
    transform: scale(1);
  }

  80%,
  100% {
    opacity: 0;
    transform: scale(3);
  }
}

@keyframes work-notice-run {
  from {
    translate: -100% 0;
  }

  to {
    translate: 263% 0;
  }
}

/* Phones: the icon sits over the text, all of it centred. */
@media (max-width: 599px) {
  .work-notice {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
  }

  .work-notice__status {
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .work-notice__dot::after {
    display: none;
  }

  .work-notice__bar::after {
    width: 100%;
    animation: none;
    opacity: 0.55;
  }
}
</style>
