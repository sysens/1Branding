<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";
import { computed, ref } from "vue";
import { optEntry } from "~/utils/optImage";
import { SERVICE_CATALOG } from "~/utils/servicesCatalog";

// "ONE PARTNER. EVERY SOLUTION." — the twelve services as a list; picking one
// swaps the picture, name and line in the card beside it (the button stays).
// The list and its stand-in pictures come from utils/servicesCatalog.ts.

const { t } = useI18n();
const localePath = useLocalePath();

// The pictures fill a 4:3 box (object-fit: cover), so a wider source is drawn
// wider than the box by `zoom`: `sizes` asks for that width. The card's box is
// ~26vw (at most 460px); the phones' one under its row ~83vw.
const coverZoom = (src: string) => {
  const entry = optEntry(src);
  return entry ? Math.max(1, entry.w / entry.h / (4 / 3)) : 1;
};

const services = computed(() => SERVICE_CATALOG.map(({ id, image }) => {
  const zoom = coverZoom(image);
  return {
    id,
    name: t(`home.services.items.${id}.name`),
    description: t(`home.services.items.${id}.description`),
    tagline: t(`home.services.items.${id}.tagline`),
    image,
    cardSizes: `min(${Math.ceil(26 * zoom)}vw, ${Math.ceil(460 * zoom)}px)`,
    inlineSizes: `${Math.ceil(83 * zoom)}vw`,
  };
}));

const selectedId = ref("02");
const selected = computed(() => services.value.find((service) => service.id === selectedId.value)!);
</script>

<template>
  <!-- The copy is English in both locales. -->
  <section id="services" class="services" lang="en" aria-labelledby="services-title">
    <h2 id="services-title" class="services__title">
      <span class="services__one">{{ t("home.services.one") }}</span>
      <span class="services__rest">
        <span>{{ t("home.services.partner") }}</span>
        <span>{{ t("home.services.every") }} <span class="services__accent">{{ t("home.services.solution") }}</span></span>
      </span>
    </h2>
    <p class="services__subtitle">{{ t("home.services.subtitle") }}</p>

    <div class="services__body">
      <ul class="services__list">
        <li v-for="service in services" :key="service.id" class="services__item" :class="{ 'is-selected': service.id === selectedId }">
          <button type="button" class="services__row" :aria-pressed="service.id === selectedId" @click="selectedId = service.id">
            <span class="services__number">{{ service.id }}</span>
            <span class="services__name">{{ service.name }}</span>
            <span class="services__description">{{ service.description }}</span>
            <svg class="services__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 18 18 6M9 6h9v9" /></svg>
          </button>
          <!-- Phones: the picked service opens in place instead of in the card. -->
          <div v-if="service.id === selectedId" class="services__inline">
            <OptImage :src="service.image" :sizes="service.inlineSizes" alt="" width="1040" height="780" loading="lazy" decoding="async" />
            <p>{{ service.tagline }}</p>
          </div>
        </li>
      </ul>

      <aside class="services__side">
        <div class="services__card" aria-live="polite">
          <p class="services__label"><span aria-hidden="true" />{{ t("home.services.selected") }}</p>
          <Transition name="services-swap" mode="out-in">
            <div :key="selected.id" class="services__selected">
              <div class="services__picture">
                <OptImage :src="selected.image" :sizes="selected.cardSizes" :alt="selected.name" width="1040" height="780" loading="lazy" decoding="async" />
              </div>
              <h3 class="services__card-title">{{ selected.name }}</h3>
              <p class="services__tagline">{{ selected.tagline }}</p>
            </div>
          </Transition>
          <NuxtLink :to="localePath('/contact')" class="services__button">
            {{ t("home.services.explore") }}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 18 18 6M9 6h9v9" /></svg>
          </NuxtLink>
        </div>
        <p class="services__closing">
          <span>{{ t("home.services.closingFirst") }}</span>
          <span class="services__closing-muted">{{ t("home.services.closingLead") }}<span class="services__accent">{{ t("home.services.closingAccent") }}</span></span>
        </p>
      </aside>
    </div>
  </section>
</template>

<style scoped src="./OnePartnerServices.css"></style>
