<script setup lang="ts">
import { computed, ref } from "vue";
import { COMPANY, COMPANY_ADDRESS, COMPANY_MAP_URL } from "~/utils/company";

// Google Maps' own embed (no key needed), searched by the office's street
// address (utils/company.ts; no coordinates are made up here), and tinted dark
// by a filter so it sits in the black page instead of a white hole.
const { t, locale } = useI18n();

const mapSrc = computed(() => {
  const query = `${COMPANY.name}, ${COMPANY_ADDRESS.en.street}, ${COMPANY_ADDRESS.en.city}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=${locale.value}&z=16&output=embed`;
});

// The map ignores the wheel and touch until it is clicked, so scrolling the
// page over it does not get stuck on the map; it lets go when the pointer leaves.
const active = ref(false);
</script>

<template>
  <div class="office-map" :class="{ 'is-active': active }" @click="active = true" @mouseleave="active = false">
    <iframe
      class="office-map__frame"
      :src="mapSrc"
      :title="t('contacts.mapTitle')"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
    />
    <span class="office-map__hint type-caption" aria-hidden="true">{{ t("contacts.mapHint") }}</span>
    <a :href="COMPANY_MAP_URL" target="_blank" rel="noopener noreferrer" class="ob-button office-map__open">
      {{ t("contacts.openMap") }}
    </a>
  </div>
</template>

<style scoped>
.office-map {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  aspect-ratio: 16 / 6;
  min-height: 22rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 1.5rem;
  background: #0b0d0d;
}

.office-map__frame {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  border: 0;
  /* Google's light map turned into a dark one with a green-ish cast. */
  filter: invert(92%) hue-rotate(185deg) saturate(0.55) brightness(0.92) contrast(0.95);
  pointer-events: none;
}

.office-map.is-active .office-map__frame {
  pointer-events: auto;
}

/* A fade into the card's corners, so the map is a part of the page. */
.office-map::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 0 4.5rem rgb(0 0 0 / 0.6);
}

.office-map__hint {
  position: absolute;
  left: 1.25rem;
  bottom: 1.25rem;
  z-index: 2;
  padding: 0.4rem 0.75rem;
  border-radius: 62.4375rem;
  background: rgb(0 0 0 / 0.6);
  color: rgb(255 255 255 / 0.75);
  backdrop-filter: blur(0.5rem);
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.office-map.is-active .office-map__hint {
  opacity: 0;
}

.office-map__open {
  position: absolute;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 2;
}

@media (max-width: 767px) {
  .office-map {
    aspect-ratio: 4 / 5;
    min-height: 0;
    border-radius: 1.25rem;
  }

  .office-map__hint {
    display: none;
  }

  /* Phones: the button spans the card's foot. */
  .office-map__open {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    width: auto;
  }
}
</style>
