<script setup lang="ts">
// A story's pictures one at a time, as large as the screen allows: opened by
// a click on a picture (CaseStory); the arrows (on screen and on the
// keyboard) and a swipe go to the next and the previous one; Esc, the cross,
// a click beside the picture or a swipe down close it.
// A native <dialog>: it is above the whole page (the header included), keeps
// the keyboard inside it and gives the focus back to the picture it was
// opened from.
import { computed, onBeforeUnmount, ref, watch } from "vue";
import OptImage from "~/components/ui/OptImage.vue";
import type { ViewPicture } from "~/utils/caseStories";
import { optEntry } from "~/utils/optImage";

const props = defineProps<{ pictures: ViewPicture[] }>();
/** The picture on show (its place in `pictures`); null while closed. */
const index = defineModel<number | null>("index", { required: true });
const { t } = useI18n();

const dialog = ref<HTMLDialogElement | null>(null);
const count = computed(() => props.pictures.length);

// The box a picture is drawn in: its own proportions (a tile on the page may
// crop it; here it is whole), no larger than twice its own size, so a small
// upload is not blown up into a blur.
const frame = (picture: ViewPicture) => {
  const entry = optEntry(picture.src);
  const own = entry?.w ?? picture.width;
  return {
    "--ratio": entry ? entry.w / entry.h : picture.ratio,
    ...(own ? { "--limit": `${own * 2}px` } : {}),
  };
};

// The picture on show and the ones beside it: those are loaded ahead, so the
// next step shows a picture at once.
const slides = computed(() => {
  const at = index.value;
  if (at === null || !props.pictures[at]) return [];
  const around = count.value > 1 ? [at, (at + 1) % count.value, (at - 1 + count.value) % count.value] : [at];
  return [...new Set(around)].map((place) => ({ place, picture: props.pictures[place]!, frame: frame(props.pictures[place]!) }));
});

// The page stands still behind the pictures (as under the open menu: only
// <html> is locked, and the smooth scroll is paused).
const lenis = useNuxtApp().$lenis as { start?: () => void; stop?: () => void } | undefined;
let held = false;
const holdScroll = () => {
  if (held) return;
  held = true;
  lenis?.stop?.();
  document.documentElement.style.overflow = "hidden";
};
const releaseScroll = () => {
  if (!held) return;
  held = false;
  document.documentElement.style.overflow = "";
  lenis?.start?.();
};

// After the slides are in the page (flush: "post"), so the dialog opens with
// its picture in it.
watch(index, (value) => {
  const el = dialog.value;
  if (!el) return;
  if (value !== null && !el.open) {
    el.showModal();
    holdScroll();
  } else if (value === null && el.open) {
    el.close();
  }
}, { flush: "post" });

const close = () => { index.value = null; };
// Also fired by Esc, which closes the dialog by itself.
const onClose = () => {
  index.value = null;
  releaseScroll();
};
onBeforeUnmount(releaseScroll);

const go = (step: number) => {
  if (index.value === null || count.value < 2) return;
  index.value = (index.value + step + count.value) % count.value;
};

const onKey = (event: KeyboardEvent) => {
  if (event.key === "ArrowRight") go(1);
  else if (event.key === "ArrowLeft") go(-1);
  else return;
  event.preventDefault();
};

// A swipe: sideways to the next or the previous picture, down to close. The
// click that follows a swipe is not a click beside the picture.
let from: { x: number; y: number } | null = null;
let swiped = false;
const onDown = (event: PointerEvent) => {
  swiped = false;
  from = event.isPrimary && !(event.target as HTMLElement).closest("button") ? { x: event.clientX, y: event.clientY } : null;
};
const onUp = (event: PointerEvent) => {
  if (!from) return;
  const dx = event.clientX - from.x;
  const dy = event.clientY - from.y;
  from = null;
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    swiped = true;
    go(dx < 0 ? 1 : -1);
  } else if (dy > 90 && dy > Math.abs(dx) * 1.5) {
    swiped = true;
    close();
  }
};
const onClick = (event: MouseEvent) => {
  if (swiped) {
    swiped = false;
    return;
  }
  if (!(event.target as HTMLElement).closest("button, img")) close();
};
</script>

<template>
  <dialog
    ref="dialog"
    class="lightbox"
    :aria-label="t('project.gallery.label')"
    @close="onClose"
    @keydown="onKey"
    @click="onClick"
    @pointerdown="onDown"
    @pointerup="onUp"
    @pointercancel="from = null"
  >
    <template v-if="index !== null">
      <div class="lightbox__stage">
        <figure
          v-for="slide in slides"
          :key="slide.picture.id"
          class="lightbox__slide"
          :class="{ 'is-current': slide.place === index }"
          :style="slide.frame"
          :aria-hidden="slide.place === index ? undefined : true"
        >
          <OptImage :src="slide.picture.src" :alt="slide.picture.alt" sizes="100vw" loading="eager" decoding="async" draggable="false" />
        </figure>
      </div>

      <p v-if="count > 1" class="lightbox__count" aria-live="polite">{{ index + 1 }} / {{ count }}</p>

      <button type="button" class="lightbox__button lightbox__close" :aria-label="t('project.gallery.close')" autofocus @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5L5 19" /></svg>
      </button>
      <template v-if="count > 1">
        <button type="button" class="lightbox__button lightbox__arrow lightbox__arrow--previous" :aria-label="t('project.gallery.previous')" @click="go(-1)">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 5l-7 7 7 7" /></svg>
        </button>
        <button type="button" class="lightbox__button lightbox__arrow lightbox__arrow--next" :aria-label="t('project.gallery.next')" @click="go(1)">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 5l7 7-7 7" /></svg>
        </button>
      </template>
    </template>
  </dialog>
</template>

<style scoped>
/* The dialog is the whole screen; what is around the picture is its backdrop.
   (No display here: a closed <dialog> is display: none by itself.) */
.lightbox {
  --pad-x: max(4.75rem, 6vw);
  --pad-y: clamp(3.75rem, 7vh, 5rem);
  position: fixed;
  inset: 0;
  width: 100vw;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: #fff;
  /* Two fingers still zoom into a picture; one finger is a swipe. */
  touch-action: pinch-zoom;
}

/* Nearly black, and what shows through is blurred: the page behind is white,
   and its texts would otherwise ghost around the picture. */
.lightbox::backdrop {
  background: rgb(8 8 8 / 0.94);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}

.lightbox[open] {
  animation: lightbox-in 0.24s ease-out;
}

.lightbox[open]::backdrop {
  animation: lightbox-fade 0.24s ease-out;
}

@keyframes lightbox-in {
  from {
    opacity: 0;
    transform: scale(0.985);
  }
}

@keyframes lightbox-fade {
  from {
    opacity: 0;
  }
}

/* The pictures lie one on another in the middle; only the current one shows. */
.lightbox__stage {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--pad-y) var(--pad-x);
}

/* As wide as the screen allows, as its height allows at the picture's
   proportions, and as the picture's own size allows. */
.lightbox__slide {
  grid-area: 1 / 1;
  width: min(100%, (100dvh - 2 * var(--pad-y)) * var(--ratio), var(--limit, 100%));
  margin: 0;
  aspect-ratio: var(--ratio);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.28s ease, visibility 0s 0.28s;
}

.lightbox__slide.is-current {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.28s ease;
}

/* :deep: the <img> sits inside OptImage, past this component's scope. */
.lightbox__slide :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

.lightbox__count {
  position: absolute;
  top: 1.25rem;
  left: 1.5rem;
  margin: 0;
  color: rgb(255 255 255 / 0.72);
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  line-height: 2.75rem;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
}

.lightbox__button {
  position: absolute;
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 50%;
  background: rgb(255 255 255 / 0.08);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.lightbox__button:hover {
  border-color: rgb(255 255 255 / 0.4);
  background: rgb(255 255 255 / 0.18);
}

.lightbox__button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.lightbox__button svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.lightbox__close {
  top: 1.25rem;
  right: 1.25rem;
}

.lightbox__arrow {
  top: calc(50% - 1.375rem);
}

.lightbox__arrow--previous {
  left: 1rem;
}

.lightbox__arrow--next {
  right: 1rem;
}

/* Phones: the picture takes the screen's width; the arrows are under it. */
@media (max-width: 767px) {
  .lightbox {
    --pad-x: 0.5rem;
    --pad-y: 4.5rem;
  }

  .lightbox__count {
    top: auto;
    bottom: 0.875rem;
    left: 0;
    width: 100%;
    text-align: center;
    pointer-events: none;
  }

  .lightbox__arrow {
    top: auto;
    bottom: 0.875rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lightbox[open],
  .lightbox[open]::backdrop {
    animation: none;
  }

  .lightbox__slide,
  .lightbox__slide.is-current {
    transition: none;
  }
}
</style>
