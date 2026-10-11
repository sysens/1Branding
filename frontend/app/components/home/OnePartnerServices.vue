<script setup lang="ts">
import { computed, ref } from "vue";

// "ONE PARTNER. EVERY SOLUTION." — the twelve services as a list; picking one
// swaps the picture, name and line in the card beside it (the button stays).
// The pictures are stand-ins from our own projects until real ones exist.

// An array, not an object: object keys "10"-"12" would sort ahead of "01".
const SERVICES = [
  ["01", "/home/threeLayerLocal/15.webp"],
  ["02", "/home/threeLayerLocal/14.webp"],
  ["03", "/home/w1280/Quaker.webp"],
  ["04", "/home/threeLayerLocal/36.webp"],
  ["05", "/home/threeLayerLocal/33.webp"],
  ["06", "/home/threeLayerLocal/22.webp"],
  ["07", "/home/threeLayerLocal/12.webp"],
  ["08", "/home/threeLayerLocal/19.webp"],
  ["09", "/home/threeLayerLocal/28.webp"],
  ["10", "/home/threeLayerLocal/39.webp"],
  ["11", "/home/Frame331.jpg"],
  ["12", "/home/scene.jpg"],
] as const;

const { t } = useI18n();
const localePath = useLocalePath();
const img = useImage();

const services = computed(() => SERVICES.map(([id, image]) => ({
  id,
  name: t(`home.services.items.${id}.name`),
  description: t(`home.services.items.${id}.description`),
  tagline: t(`home.services.items.${id}.tagline`),
  image: img(image, { width: 1040, height: 780, fit: "cover", format: "webp", quality: 80 }),
})));

const selectedId = ref("02");
const selected = computed(() => services.value.find((service) => service.id === selectedId.value)!);
</script>

<template>
  <!-- The copy is English in both locales. -->
  <section class="services" lang="en" aria-labelledby="services-title">
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
            <img :src="service.image" alt="" width="1040" height="780" loading="lazy" decoding="async">
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
                <img :src="selected.image" :alt="selected.name" width="1040" height="780" loading="lazy" decoding="async">
              </div>
              <h3 class="services__card-title">{{ selected.name }}</h3>
              <p class="services__tagline">{{ selected.tagline }}</p>
            </div>
          </Transition>
          <NuxtLink :to="localePath('/ContactPage')" class="services__button">
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

<style scoped>
.services {
  padding: clamp(5rem, 10vw, 12rem) 0 clamp(4rem, 7vw, 9rem);
  background: #000;
  color: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

/* ONE spans both lines; PARTNER. and EVERY SOLUTION. stack beside it. */
.services__title {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0.03em;
  margin: 0;
  padding-inline: 1.25rem;
  font-size: clamp(2.6rem, 12.2vw, 15rem);
  font-weight: 700;
  line-height: 0.74;
  letter-spacing: -0.02em;
}

.services__one {
  padding-block: 0.02em;
  background: linear-gradient(100deg, #00c92f 0%, #00f83c 30%, #00d634 62%, #009b2c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.services__rest {
  display: flex;
  flex-direction: column;
  gap: 0.06em;
  padding-top: 0.01em;
  font-size: 0.47em;
  line-height: 0.76;
  letter-spacing: -0.015em;
  white-space: nowrap;
}

.services__accent {
  background: linear-gradient(90deg, #00e536, #00b52e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.services__subtitle {
  margin: clamp(1rem, 1.6vw, 2rem) 0 0;
  padding-inline: 1.25rem;
  color: #b9b9b9;
  font-size: clamp(1.05rem, 1.5vw, 2.1rem);
  line-height: 1.25;
  text-align: center;
  text-wrap: balance;
}

/* The list (52%) and the card (28%) of a frame 82% wide, as in the design. */
.services__body {
  display: grid;
  grid-template-columns: minmax(0, 52fr) minmax(0, 28fr);
  gap: 2.3vw;
  width: min(82.5vw, 100% - 2.5rem);
  margin: clamp(2rem, 3.2vw, 4rem) auto 0;
}

.services__list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid #222;
}

.services__item {
  border-bottom: 1px solid #222;
}

.services__row {
  display: grid;
  grid-template-columns: 3.4em minmax(0, 1fr) minmax(0, 1.25fr) 2em;
  align-items: center;
  gap: 1em;
  width: 100%;
  min-height: 2.75em;
  padding: 0.35em 0.75em;
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: clamp(0.95rem, 1.2vw, 1.6rem);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.services__row:hover {
  background: #0d0d0d;
}

.services__row:focus-visible {
  outline: 2px solid #00e536;
  outline-offset: 2px;
}

.services__number {
  color: #b5b5b5;
  font-weight: 400;
}

.services__name {
  font-weight: 500;
  letter-spacing: -0.01em;
}

.services__description {
  color: #c4c4c4;
  font-size: 0.8em;
  line-height: 1.3;
}

.services__arrow {
  justify-self: end;
  width: 1.05em;
  height: 1.05em;
  fill: none;
  stroke: #c4c4c4;
  stroke-width: 1.6;
  transition: stroke 0.25s ease, transform 0.25s ease;
}

/* The picked row lifts out: lighter panel, green edge, number and arrow. */
.services__item.is-selected {
  border-bottom-color: transparent;
}

.services__item.is-selected .services__row {
  position: relative;
  margin-block: -1px;
  background: #121212;
  box-shadow: inset 0 0 0 1px #262626, inset 3px 0 0 #00e536;
}

.services__item.is-selected .services__number {
  color: #00e536;
  font-weight: 700;
}

.services__item.is-selected .services__arrow {
  stroke: #00e536;
  stroke-width: 2;
}

.services__row:hover .services__arrow {
  transform: translate(2px, -2px);
}

.services__inline {
  display: none;
}

/* The card and the closing line stay in view together while the list scrolls. */
.services__side {
  position: sticky;
  top: 7rem;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: clamp(1.25rem, 1.8vw, 2.25rem);
}

.services__card {
  display: flex;
  flex-direction: column;
  padding: clamp(0.9rem, 1vw, 1.4rem);
  border: 1px solid #1d1d1d;
  border-radius: 0.9rem;
  background: #090909;
}

.services__label {
  display: flex;
  align-items: center;
  gap: 0.75em;
  margin: 0.2rem 0 clamp(0.8rem, 1vw, 1.2rem);
  color: #c4c4c4;
  font-size: clamp(0.7rem, 0.75vw, 1rem);
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.services__label span {
  width: 0.65em;
  height: 0.65em;
  border-radius: 50%;
  background: #00e536;
}

.services__picture {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #151515;
}

.services__picture img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.services__card-title {
  margin: clamp(0.9rem, 1.1vw, 1.4rem) 0 0;
  font-size: clamp(1.6rem, 2.05vw, 2.9rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.services__tagline {
  margin: 0.3em 0 0;
  color: #c9c9c9;
  font-size: clamp(1.05rem, 1.3vw, 1.8rem);
  line-height: 1.25;
}

.services__button {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.45em;
  margin-top: clamp(1.1rem, 1.4vw, 1.8rem);
  padding: 0.6em 1.4em;
  border-radius: 999px;
  background: linear-gradient(100deg, #00c92f 0%, #00ee38 55%, #00d634 100%);
  color: #062b10;
  font-size: clamp(1rem, 1.1vw, 1.5rem);
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.services__button svg,
.services__row svg {
  flex: none;
}

.services__button svg {
  width: 1em;
  height: 1em;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
}

.services__button:hover,
.services__button:focus-visible {
  transform: scale(1.04);
  box-shadow: 0 0 1.8rem rgb(0 240 58 / 0.4);
}

.services__closing {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding-top: clamp(1.25rem, 1.8vw, 2.25rem);
  border-top: 1px solid #1d1d1d;
  font-size: clamp(1.5rem, 1.9vw, 2.6rem);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.02em;
}

.services__closing-muted {
  color: #a9a9a9;
}

.services-swap-enter-active,
.services-swap-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.services-swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.services-swap-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Phones and narrow tablets: one column; the picked service opens under its row. */
@media (max-width: 899px) {
  .services__body {
    grid-template-columns: 1fr;
  }

  .services__row {
    grid-template-columns: 2.4em minmax(0, 1fr) 1.4em;
    row-gap: 0.15em;
    padding-block: 0.7em;
    font-size: 1rem;
  }

  .services__description {
    grid-column: 2;
    grid-row: 2;
  }

  .services__arrow {
    grid-column: 3;
    grid-row: 1;
  }

  .services__inline {
    display: block;
    padding: 0.5rem 0.75rem 1.1rem;
  }

  .services__inline img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 3;
    border-radius: 0.6rem;
    object-fit: cover;
  }

  .services__inline p {
    margin: 0.7rem 0 0;
    color: #c9c9c9;
  }

  .services__side {
    position: static;
  }

  .services__card {
    display: none;
  }

  .services__closing {
    border-top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .services-swap-enter-active,
  .services-swap-leave-active {
    transition: none;
  }
}
</style>
