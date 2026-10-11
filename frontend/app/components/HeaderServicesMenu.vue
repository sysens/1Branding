<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { SERVICE_CATALOG } from "~/utils/servicesCatalog";

// The header's "Services" item and its giant menu (after slidor.agency's): a
// wide panel under the header with a large picture on the left and the twelve
// services in two columns on the right. Hovering (or focusing) a service shows
// its picture; the panel opens on hover or click and closes a moment after the
// pointer leaves both, on Escape, or on navigation.

const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const img = useImage();

const services = computed(() => SERVICE_CATALOG.map((service) => ({
  ...service,
  name: t(`home.services.items.${service.id}.name`),
  description: t(`home.services.items.${service.id}.description`),
  picture: img(service.image, { width: 1200, height: 900, fit: "cover", format: "webp", quality: 80 }),
})));
const target = computed(() => `${localePath("/")}#services`);

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
        <ul class="svc__list">
          <li v-for="(service, index) in services" :key="service.id" :style="{ '--i': index }">
            <NuxtLink
              :to="target"
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
  color: #fff;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  line-height: 18px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.svc__trigger:hover,
.svc__trigger.is-open {
  color: #03cb00;
}

/* Slidor's rolling label: a second copy slides up from below on hover. */
.svc__label {
  position: relative;
  display: grid;
  height: 18px;
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

.svc__chevron {
  width: 16px;
  height: 16px;
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
  outline: 2px solid #03cb00;
  outline-offset: 6px;
  border-radius: 4px;
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

/* The panel is the full width of the screen, flush under the header. */
.svc__panel {
  position: fixed;
  z-index: 1001;
  top: calc(30px + var(--header-h, 66px) + 14px);
  left: 0;
  display: grid;
  grid-template-columns: minmax(0, 52fr) minmax(0, 48fr);
  gap: 3.2vw;
  width: 100vw;
  max-height: calc(100vh - 30px - var(--header-h, 66px) - 14px);
  overflow: auto;
  padding: clamp(24px, 2.2vw, 44px) clamp(24px, 2.4vw, 48px);
  border-top: 1px solid rgb(255 255 255 / 0.08);
  border-bottom: 1px solid rgb(3 203 0 / 0.4);
  background: #000;
  box-shadow: 0 40px 80px rgb(0 0 0 / 0.5);
  font-family: "Inter", sans-serif;
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
  min-height: clamp(360px, 33vw, 700px);
  overflow: hidden;
  border-radius: 8px;
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
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Items rise in one after another as the panel opens. */
.svc__list li {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease calc(var(--i) * 30ms + 80ms), transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i) * 30ms + 80ms);
}

.svc__panel:not(.svc-panel-leave-active) .svc__list li {
  opacity: 1;
  transform: none;
}

.svc-panel-enter-from .svc__list li {
  opacity: 0;
  transform: translateY(8px);
}

.svc__item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: clamp(18px, 1.5vw, 30px);
  border-radius: 8px;
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
  width: 24px;
  height: 24px;
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
  gap: 8px;
}

.svc__name {
  font-size: clamp(17px, 0.98vw, 22px);
  font-weight: 600;
  line-height: 1.2;
}

.svc__desc {
  color: rgb(255 255 255 / 0.62);
  font-size: clamp(14px, 0.8vw, 18px);
  line-height: 1.35;
}

@media (min-width: 1920px) {
  .svc__trigger {
    font-size: clamp(18px, 0.9375vw, 23px);
  }

  .svc__label {
    height: clamp(18px, 0.9375vw, 23px);
    line-height: clamp(18px, 0.9375vw, 23px);
  }

  .svc__panel {
    --header-h: clamp(66px, 3.44vw, 86px);
  }
}

@media (max-width: 1200px) {
  .svc__panel {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
  }

  .svc__item {
    padding: 14px;
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
</style>
