<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import MacbookScroll from "~/components/ui/macbook/MacbookDevice.vue";

const { t, te } = useI18n();

const titleLines = computed<string[]>(() => {
  return ["We build digital", "experiences that", "feel premium and", "work flawlessly"].map((fallback, index) => {
    const key = `home.digitalExperience.titleLines.${index}`;
    return te(key) ? t(key) : fallback;
  });
});

const accentWords = computed<string>(() => {
  const accent = t("home.digitalExperience.titleAccentWord");
  return typeof accent === "string" && accent ? accent : "feel premium";
});

const description = computed<string>(() => {
  const value = t("home.digitalExperience.description");
  return typeof value === "string" ? value : "";
});

const renderLine = (line: string) => {
  const accent = accentWords.value;
  if (!accent) return [{ text: line, accent: false }];
  return line
    .split(accent)
    .flatMap((part, index, parts) =>
      index < parts.length - 1
        ? [{ text: part, accent: false }, { text: accent, accent: true }]
        : [{ text: part, accent: false }]
    );
};
</script>

<template>
  <section class="digital-experience" aria-labelledby="digital-experience-title">
    <header class="digital-experience__copy">
        <h2 id="digital-experience-title" class="digital-experience__title">
          <span v-for="(line, index) in titleLines" :key="index">
            <template v-for="(part, partIndex) in renderLine(line)" :key="partIndex">
              <strong v-if="part.accent">{{ part.text }}</strong>
              <template v-else>{{ part.text }}</template>
            </template>
          </span>
        </h2>
        <p class="digital-experience__description">
          {{ description }}
        </p>
    </header>
    <MacbookScroll title="" src="/home/macbook-linear.webp" :show-gradient="false" alt="Linear project management interface on a MacBook" />
  </section>
</template>

<style scoped>
/* Clip sideways only: the opened, 1.5x screen keeps sliding down past the section
   edge and disappears under the green light of the next section (which overlaps
   this one) instead of being cut by a hard line. */
.digital-experience { position: relative; isolation: isolate; overflow-x: clip; overflow-y: visible; background: #fff; padding-top: 16rem; }
.digital-experience__copy { text-align: center; }
.digital-experience :deep(.macbook-scroll) { padding-block: 2rem 0; }
.digital-experience__title {
  max-width: 54rem;
  margin: 0 auto;
  padding-inline: 1rem;
  color: #303230;
  font-family: var(--app-font-display);
  font-size: var(--type-h1-size);
  font-weight: 700;
  line-height: var(--type-h1-lh);
  letter-spacing: var(--type-h1-ls);
}
.digital-experience__title > span { display: block; }
/* #00aa30 instead of #00b534: same green, but 3.1:1 on white (WCAG AA large text). */
.digital-experience__title strong { color: #00aa30; font-weight: inherit; }
.digital-experience__description { max-width: 58rem; margin: 1.75rem auto 0; padding-inline: 1.25rem; color: #666b67; font-family: var(--app-font-sans); font-size: var(--type-body-size); font-weight: 400; line-height: var(--type-body-lh); letter-spacing: var(--type-body-ls); }
@media (min-width: 768px) and (max-width: 1023px) {
  .digital-experience { padding-top: 10rem; }
}
@media (max-width: 767px) {
  .digital-experience { padding-top: 4rem; }
  .digital-experience :deep(.macbook-scroll) { padding-block: 2.5rem 1rem; }
  .digital-experience__description { margin-top: 1.25rem; }
}
</style>
