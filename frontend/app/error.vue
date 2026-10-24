<script setup lang="ts">
import type { NuxtError } from "#app";

// Branded 404 / 500 page instead of Nuxt's default white screen.
const props = defineProps<{ error: NuxtError }>();
const { t } = useI18n();
const localePath = useLocalePath();

const notFound = computed(() => props.error?.statusCode === 404);
useHead({
  title: computed(() => `${notFound.value ? t("errorPage.notFoundTitle") : t("errorPage.title")} — OneBranding`),
  meta: [{ name: "robots", content: "noindex" }],
});

const goHome = () => clearError({ redirect: localePath("/") });
</script>

<template>
  <main class="error-page">
    <p class="error-page__code">{{ error?.statusCode || 500 }}</p>
    <h1 class="error-page__title">
      {{ notFound ? t("errorPage.notFoundTitle") : t("errorPage.title") }}
    </h1>
    <p class="error-page__text">
      {{ notFound ? t("errorPage.notFoundText") : t("errorPage.text") }}
    </p>
    <button type="button" class="error-page__button" @click="goHome">
      {{ t("errorPage.home") }}
    </button>
  </main>
</template>

<style scoped>
.error-page {
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 1rem;
  background: radial-gradient(ellipse 60% 40% at 50% 0%, rgb(3 203 0 / 0.35), transparent 70%), #000;
  color: #fff;
  text-align: center;
}

/* Type: the code is the display-l step, the title h3, the text body. */
.error-page__code {
  color: #03cb00;
  font-family: var(--app-font-display);
  font-size: var(--type-display-l-size);
  font-weight: 700;
  line-height: var(--type-display-l-lh);
  letter-spacing: var(--type-display-l-ls);
}

.error-page__title {
  font-family: var(--app-font-display);
  font-size: var(--type-h3-size);
  font-weight: 600;
  line-height: var(--type-h3-lh);
  letter-spacing: var(--type-h3-ls);
}

.error-page__text {
  max-width: 32rem;
  color: rgb(255 255 255 / 0.7);
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
}

.error-page__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--button-w);
  height: var(--button-h);
  margin-top: 1.5rem;
  padding: 0.9rem 2.25rem;
  border: 2px solid #03cb00;
  border-radius: 999px;
  background: #000;
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  font-weight: 600;
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
  box-shadow: 0 0 20px rgb(3 203 0 / 0.6);
  transition: box-shadow 0.3s ease;
}

.error-page__button:hover {
  box-shadow: 0 0 30px rgb(3 203 0 / 0.9);
}
</style>
