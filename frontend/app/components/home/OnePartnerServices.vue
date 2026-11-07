<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";
import RollText from "~/components/ui/RollText.vue";
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { optEntry } from "~/utils/optImage";
import { SERVICE_CATALOG } from "~/utils/servicesCatalog";
import { servicePath } from "~/utils/servicePages";
import { toSiteLocale } from "~/utils/locales";

// "ONE PARTNER. EVERY SOLUTION." — the twelve services as a list; picking one
// swaps the picture, name and line in the card beside it (the button stays),
// animated as scrolltide's Team Roster (see `select` below).
// The list and its stand-in pictures come from utils/servicesCatalog.ts.

const { t, locale } = useI18n();
const siteLocale = computed(() => toSiteLocale(locale.value));
// "Explore service" opens the showcase (once the projects page's grid view).
const projectsGridPath = computed(() => servicePath("branding", toSiteLocale(locale.value)));

// The pictures fill a 4:3 box (object-fit: cover), so a wider source is drawn
// wider than the box by `zoom`: `sizes` asks for that width. The card's box is
// ~26vw (at most 460px); the phones' one under its row ~83vw.
const coverZoom = (src: string) => {
  const entry = optEntry(src);
  return entry ? Math.max(1, entry.w / entry.h / (4 / 3)) : 1;
};

const services = computed(() => SERVICE_CATALOG.map(({ id, page, image }) => {
  const zoom = coverZoom(image);
  return {
    id,
    path: servicePath(page, siteLocale.value),
    name: t(`home.services.items.${id}.name`),
    description: t(`home.services.items.${id}.description`),
    tagline: t(`home.services.items.${id}.tagline`),
    image,
    cardSizes: `min(${Math.ceil(26 * zoom)}vw, ${Math.ceil(460 * zoom)}px)`,
    inlineSizes: `${Math.ceil(83 * zoom)}vw`,
  };
}));

// Picking a service (hover on desktops, a tap, a click or focus) moves the
// selection as scrolltide's Team Roster does, timed from its video: at once
// the card's picture starts to wipe down from the top over the one before
// (which sinks a little under it), the arrow slides in before the new name
// and out of the old one; then the two names roll their letters over,
// carrying the bright and the grey colour across (RollText), and the card's
// title rises in letter by letter. `rolled` holds the rows that have taken
// part in a pick: the others never play, and nothing plays before the first.
const selectedId = ref("02");
const previousId = ref<string>();
const picks = ref(0);
const rolled = reactive(new Set<string>());
const selected = computed(() => services.value.find((service) => service.id === selectedId.value)!);

const select = (id: string) => {
  if (id === selectedId.value) return;
  rolled.add(selectedId.value);
  rolled.add(id);
  previousId.value = selectedId.value;
  selectedId.value = id;
  picks.value += 1;
};

// Hover picks only beside the card (900px and wider, with a mouse), after a
// short pause so sweeping across the list does not flick through every row;
// on narrower screens the pick opens under its row, so it waits for a tap.
let hoverTimer: ReturnType<typeof setTimeout> | undefined;
const besideCard = () => window.matchMedia("(min-width: 900px) and (hover: hover)").matches;
const onPointerEnter = (event: PointerEvent, id: string) => {
  if (event.pointerType !== "mouse" || !besideCard()) return;
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => select(id), 40);
};
const onPointerLeave = () => clearTimeout(hoverTimer);
const onFocus = (id: string) => {
  if (besideCard()) select(id);
};
onBeforeUnmount(() => clearTimeout(hoverTimer));
</script>

<template>
  <section id="services" class="services" aria-labelledby="services-title">
    <!-- The brand's slogan stays English on every language's page. -->
    <h2 id="services-title" class="services__title" lang="en">
      <span v-blur-reveal class="services__one">{{ `${t("home.services.one")} ` }}</span>
      <span v-blur-reveal class="services__rest">
        <span>{{ `${t("home.services.partner")} ` }}</span>
        <span>{{ t("home.services.every") }} <span class="services__accent">{{ t("home.services.solution") }}</span></span>
      </span>
    </h2>
    <p v-rise class="services__subtitle">{{ t("home.services.subtitle") }}</p>
    <!-- What OneBranding is in one plain sentence. -->
    <p v-rise class="services__intro">{{ t("home.services.intro") }}</p>

    <div class="services__body">
      <ul class="services__list">
        <li v-for="service in services" :key="service.id" v-rise class="services__item" :class="{ 'is-selected': service.id === selectedId }">
          <button
            type="button"
            class="services__row"
            :aria-pressed="service.id === selectedId"
            @click="select(service.id)"
            @focus="onFocus(service.id)"
            @pointerenter="onPointerEnter($event, service.id)"
            @pointerleave="onPointerLeave"
          >
            <span class="services__number">{{ service.id }}</span>
            <span class="services__name">
              <svg class="services__pointer" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" /></svg>
              <RollText :text="service.name" :on="service.id === selectedId" :live="rolled.has(service.id)" />
            </span>
            <span class="services__description">{{ service.description }}</span>
            <svg class="services__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 18 18 6M9 6h9v9" /></svg>
          </button>
          <!-- Phones: the picked service opens in place instead of in the card. -->
          <div v-if="service.id === selectedId" class="services__inline">
            <OptImage :src="service.image" :sizes="service.inlineSizes" alt="" width="1040" height="780" loading="lazy" decoding="async" />
            <p>{{ service.tagline }}</p>
            <NuxtLink :to="projectsGridPath" class="services__inline-link">{{ t("home.services.explore") }}</NuxtLink>
          </div>
        </li>
      </ul>
      <!-- The rows are buttons that pick a service; each service's own page,
           for keyboards, screen readers and crawlers. -->
      <ul class="sr-only">
        <li v-for="service in services" :key="service.id"><NuxtLink :to="service.path">{{ service.name }}</NuxtLink></li>
      </ul>

      <aside class="services__side">
        <div v-rise class="services__card" aria-live="polite">
          <p class="services__label">
            <span class="services__dot" aria-hidden="true" />{{ t("home.services.selected") }}
            <span class="services__count" aria-hidden="true"><RollText :key="selected.id" :text="selected.id" :live="picks > 0" rise /> / {{ services.length }}</span>
          </p>
          <div class="services__selected">
            <!-- Every service's picture, stacked: the picked one on top, the
                 one before under it while the new one wipes in. -->
            <div class="services__picture" :class="{ 'is-live': picks > 0 }">
              <div
                v-for="service in services"
                :key="service.id"
                class="services__layer"
                :class="{ 'is-current': service.id === selectedId, 'is-previous': service.id === previousId }"
                :aria-hidden="service.id === selectedId ? undefined : 'true'"
              >
                <OptImage :src="service.image" :sizes="service.cardSizes" :alt="service.id === selectedId ? service.name : ''" width="1040" height="780" loading="lazy" decoding="async" />
              </div>
            </div>
            <h3 class="services__card-title"><RollText :key="selected.id" :text="selected.name" :live="picks > 0" rise /></h3>
            <Transition name="services-swap" mode="out-in">
              <p :key="selected.id" class="services__tagline">{{ selected.tagline }}</p>
            </Transition>
          </div>
          <NuxtLink v-rise data-pill :to="projectsGridPath" class="services__button ob-button">
            {{ t("home.services.explore") }}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 18 18 6M9 6h9v9" /></svg>
          </NuxtLink>
        </div>
      </aside>
    </div>

    <!-- The section's last line, centred under the list and the card. -->
    <p v-rise class="services__closing" lang="en">
      <span>{{ t("home.services.closingFirst") }}</span> <span class="services__closing-muted">{{ t("home.services.closingLead") }}<span class="services__accent">{{ t("home.services.closingAccent") }}</span></span>
    </p>
  </section>
</template>

<style scoped src="./OnePartnerServices.css"></style>
