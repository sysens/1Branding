<script setup lang="ts">
import { computed } from "vue";

// The privacy policy: what the contact form collects and why. Plain text from
// i18n (privacy.*), in each language.

const { t, tm, rt, locale } = useI18n();
const localePath = useLocalePath();

type Section = { h: unknown; p: unknown[] };
const sections = computed(() => (tm("privacy.sections") as Section[]).map((section) => ({
  heading: rt(section.h as never),
  paragraphs: section.p.map((paragraph) => rt(paragraph as never)),
})));
const updated = computed(() => {
  const value = t("privacy.updated");
  const date = new Date(`${value}T12:00:00Z`);
  return {
    iso: value,
    label: Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale.value, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Tashkent" }).format(date),
  };
});

usePageSeo({
  title: computed(() => t("privacy.title")),
  description: computed(() => t("privacy.description")),
  breadcrumbs: computed(() => [{ name: t("privacy.h1"), path: localePath("/privacy") }]),
});
</script>

<template>
  <div class="service-page">
    <div class="service-page__frame privacy-page">
      <nav class="service-crumbs" :aria-label="t('servicesPage.breadcrumbLabel')">
        <ol>
          <li><NuxtLink :to="localePath('/')">{{ t("nav.home") }}</NuxtLink></li>
          <li aria-current="page">{{ t("privacy.h1") }}</li>
        </ol>
      </nav>
      <h1 class="service-hero__title">{{ t("privacy.h1") }}</h1>
      <p class="service-note">{{ t("privacy.updatedLabel") }}: <time :datetime="updated.iso">{{ updated.label }}</time></p>
      <section v-for="section in sections" :key="section.heading" class="privacy-page__section">
        <h2>{{ section.heading }}</h2>
        <p v-for="(paragraph, index) in section.paragraphs" :key="index">{{ paragraph }}</p>
      </section>
    </div>
  </div>
</template>

<style src="~/assets/css/service-page.css"></style>
<style scoped>
.privacy-page {
  max-width: 860px;
}

.privacy-page__section {
  margin-top: 56px;
}

.privacy-page__section h2 {
  margin: 0 0 16px;
  font-size: clamp(1.5rem, 2.2vw, 2rem);
  font-weight: 600;
  line-height: 1.2;
}

.privacy-page__section p {
  margin: 0 0 14px;
  color: #c9cbce;
  font-size: 17px;
  line-height: 1.7;
}
</style>
