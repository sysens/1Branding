<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { SERVICE_CATALOG } from "~/utils/servicesCatalog";
import { servicePath, servicesHubPath } from "~/utils/servicePages";
import { toSiteLocale } from "~/utils/locales";

// The header's "Services" item and its giant menu (after slidor.agency's): a
// wide panel under the header with a large picture on the left and the twelve
// services in two columns on the right. Hovering (or focusing) a service shows
// its picture; the panel opens on hover or click and closes a moment after the
// pointer leaves both, on Escape, or on navigation.

const { t, locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const siteLocale = computed(() => toSiteLocale(locale.value));
const img = useImage();

const services = computed(() => SERVICE_CATALOG.map((service) => ({
  ...service,
  name: t(`home.services.items.${service.id}.name`),
  description: t(`home.services.items.${service.id}.description`),
  path: servicePath(service.page, siteLocale.value),
  picture: img(service.image, { width: 1200, height: 900, fit: "cover", format: "webp", quality: 80 }),
})));

const open = ref(false);
const active = ref(SERVICE_CATALOG[1]!.id);
let closer: ReturnType<typeof setTimeout> | undefined;

const show = () => {
  clearTimeout(closer);
  open.value = true;
};
const hideSoon = () => {
  clearTimeout(closer);
  closer = setTimeout(() => { open.value = false; }, 160);
};
const hide = () => {
  clearTimeout(closer);
  open.value = false;
};

watch(() => route.fullPath, hide);
onBeforeUnmount(() => clearTimeout(closer));
</script>

<template>
  <div class="svc" @mouseenter="show" @mouseleave="hideSoon" @keydown.esc="hide">
    <button
      type="button"
      class="svc__trigger"
      :class="{ 'is-open': open }"
      :aria-expanded="open"
      aria-controls="services-menu"
      @click="open ? hide() : show()"
      @focus="show"
    >
      <span class="svc__label">
        <span>{{ t("nav.services") }}</span>
        <span aria-hidden="true">{{ t("nav.services") }}</span>
      </span>
      <svg class="svc__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" /></svg>
    </button>

    <!-- In <body>: the header is transformed and blurred, which would trap a
         fixed panel inside its own box. -->
    <Teleport to="body">
    <Transition name="svc-scrim">
      <div v-show="open" class="svc__scrim" aria-hidden="true" />
    </Transition>
    <Transition name="svc-panel">
      <div v-show="open" id="services-menu" class="svc__panel" @mouseenter="show" @mouseleave="hideSoon">
        <div class="svc__picture" aria-hidden="true">
          <img
            v-for="service in services"
            :key="service.id"
            :src="service.picture"
            alt=""
            loading="lazy"
            decoding="async"
            :class="{ 'is-active': service.id === active }"
          >
        </div>
        <div class="svc__column">
        <ul class="svc__list">
          <li v-for="(service, index) in services" :key="service.id" :style="{ '--i': index }">
            <NuxtLink
              :to="service.path"
              class="svc__item"
              :class="{ 'is-active': service.id === active }"
              @mouseenter="active = service.id"
              @focus="active = service.id"
              @click="hide"
            >
              <svg class="svc__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path :d="service.icon" /></svg>
              <span class="svc__text">
                <span class="svc__name">{{ service.name }}</span>
                <span class="svc__desc">{{ service.description }}</span>
              </span>
            </NuxtLink>
          </li>
        </ul>
        <p class="svc__more">
          <NuxtLink :to="servicesHubPath(siteLocale)" @click="hide">{{ t("header.allServices") }}</NuxtLink>
          <NuxtLink :to="localePath('/news')" @click="hide">{{ t("header.blog") }}</NuxtLink>
        </p>
        </div>
      </div>
    </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.svc {
  position: static;
  display: flex;
  align-items: center;
}

.svc__trigger {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  border: 0;
  background: none;
  color: #efefef;
  /* The header's link type: the small step, semibold (as in Header.vue). */
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
  line-height: var(--type-small-lh);
  letter-spacing: var(--type-small-ls);
  cursor: pointer;
  transition: color 0.3s ease;
}

.svc__trigger:hover,
.svc__trigger.is-open {
  color: #03cb00;
}

/* Slidor's rolling label: a second copy slides up from below on hover. The
   window is one line of the small step, so descenders (у in Услуги) show. */
.svc__label {
  position: relative;
  display: grid;
  height: calc(var(--type-small-lh) * 1em);
  line-height: var(--type-small-lh);
  overflow: hidden;
}

.svc__label > span {
  grid-area: 1 / 1;
  transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.svc__label > span + span {
  transform: translateY(110%);
}

.svc__trigger:hover .svc__label > span:first-child,
.svc__trigger.is-open .svc__label > span:first-child {
  transform: translateY(-110%);
}

.svc__trigger:hover .svc__label > span + span,
.svc__trigger.is-open .svc__label > span + span {
  transform: translateY(0);
}

/* The design's "Services" has no arrow; the label still rolls on hover. */
.svc__chevron {
  display: none;
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  transition: transform 0.3s ease;
}

.svc__trigger.is-open .svc__chevron {
  transform: rotate(180deg);
}

.svc__trigger:focus-visible {
  outline: 0.125rem solid #03cb00;
  outline-offset: 0.375rem;
  border-radius: 0.25rem;
}

/* The page behind is dimmed, as on slidor. */
.svc__scrim {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgb(0 0 0 / 0.62);
  pointer-events: none;
}

.svc-scrim-enter-active,
.svc-scrim-leave-active {
  transition: opacity 0.3s ease;
}

.svc-scrim-enter-from,
.svc-scrim-leave-to {
  opacity: 0;
}

/* The panel is the full width of the screen, flush under the header. As on
   slidor, its sizes are rem, not screen units: the list sets its height
   (six rows of two) and the picture stretches to it, so a wide or tall
   screen gets the same compact panel instead of a taller one. Past the
   1920px frame the content stays in the frame. */
.svc__panel {
  position: fixed;
  z-index: 1001;
  top: calc(1.875rem + var(--header-h, 3.5rem) + 0.875rem);
  left: 0;
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 5fr);
  align-items: stretch;
  gap: 2.5rem;
  width: 100vw;
  max-height: calc(100vh - 1.875rem - var(--header-h, 3.5rem) - 0.875rem);
  overflow: auto;
  padding: 2rem calc(2.5rem + var(--frame-side));
  border-top: 1px solid rgb(255 255 255 / 0.08);
  border-bottom: 1px solid rgb(3 203 0 / 0.4);
  background: #000;
  box-shadow: 0 2.5rem 5rem rgb(0 0 0 / 0.5);
  font-family: var(--app-font-sans);
}

.svc-panel-enter-active,
.svc-panel-leave-active {
  transition: opacity 0.28s ease, transform 0.38s cubic-bezier(0.2, 0.7, 0.2, 1), clip-path 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.svc-panel-enter-from,
.svc-panel-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  clip-path: inset(0 0 100% 0);
}

.svc-panel-enter-to,
.svc-panel-leave-from {
  clip-path: inset(0 0 0 0);
}

.svc__picture {
  position: relative;
  min-height: 20rem;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #111;
}

.svc__picture img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.06);
  transition: opacity 0.5s ease, transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.svc__picture img.is-active {
  opacity: 1;
  transform: scale(1);
}

.svc__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: space-between;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Items rise in one after another as the panel opens. */
.svc__list li {
  opacity: 0;
  transform: translateY(0.5rem);
  transition: opacity 0.4s ease calc(var(--i) * 30ms + 80ms), transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i) * 30ms + 80ms);
}

.svc__panel:not(.svc-panel-leave-active) .svc__list li {
  opacity: 1;
  transform: none;
}

.svc-panel-enter-from .svc__list li {
  opacity: 0;
  transform: translateY(0.5rem);
}

.svc__item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: 0.5rem;
  color: #fff;
  text-decoration: none;
  transition: background-color 0.25s ease;
}

.svc__item.is-active,
.svc__item:focus-visible {
  background: #121212;
  outline: none;
}

.svc__icon {
  flex: none;
  width: 1.5rem;
  height: 1.5rem;
  margin-top: 1px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke 0.25s ease;
}

.svc__item.is-active .svc__icon {
  stroke: #03cb00;
}

.svc__text {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.svc__name {
  font-size: var(--type-small-size);
  font-weight: 600;
  line-height: var(--type-small-lh);
  letter-spacing: var(--type-small-ls);
}

.svc__desc {
  color: rgb(255 255 255 / 0.62);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  letter-spacing: var(--type-caption-ls);
}

/* Narrower desktops: the picture gives the list room, then goes; the list
   keeps its two columns. */
@media (max-width: 1280px) {
  .svc__panel {
    grid-template-columns: minmax(0, 0.7fr) minmax(0, 1fr);
    gap: 1.5rem;
    padding-inline: 1.5rem;
  }

  .svc__item {
    padding: 1rem;
  }
}

@media (max-width: 1100px) {
  .svc__panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .svc__picture {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .svc-panel-enter-active,
  .svc-panel-leave-active,
  .svc-scrim-enter-active,
  .svc-scrim-leave-active,
  .svc__list li,
  .svc__picture img,
  .svc__label > span {
    transition: none;
  }
}

.svc__column {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  min-width: 0;
}

.svc__more {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin: 0;
  padding: 0.875rem 0.875rem 0;
  border-top: 1px solid rgb(255 255 255 / 0.1);
}

.svc__more a {
  color: #efefef;
  font-size: var(--type-small-size);
  font-weight: 600;
  line-height: var(--type-small-lh);
  letter-spacing: var(--type-small-ls);
  text-decoration: none;
  transition: color 0.25s ease;
}

.svc__more a:hover,
.svc__more a:focus-visible {
  color: #03cb00;
}
</style>
