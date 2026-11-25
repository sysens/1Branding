<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import AuraBlob from "~/components/ui/AuraBlob.vue";
import LeadForm from "~/components/contacts/LeadForm.vue";

// The request form as a modal: the aura with the "1" on top, then the form
// (components/contacts/LeadForm.vue). Mounted once for the whole site, on its
// first opening (app.vue), so the aura's WebGL code loads only then; any
// button can open it (useContactModal), as can every link to
// /contact#contact-request. It stays open on the thank-you until closed.
const { t, locale } = useI18n();
const { isOpen, close } = useContactModal();

const root = ref<HTMLElement | null>(null);
const card = ref<HTMLElement | null>(null);

// Open: lock the page behind, remember where focus was. (Lenis, stopped,
// would swallow the wheel: the backdrop has data-lenis-prevent, so a card
// taller than a short screen still scrolls.)
let lastFocused: HTMLElement | null = null;
const lenis = useNuxtApp().$lenis as { start?: () => void; stop?: () => void } | undefined;

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    close();
    return;
  }
  if (event.key !== "Tab" || !card.value) return;
  // Keep Tab inside the card.
  const focusable = Array.from(card.value.querySelectorAll<HTMLElement>("button:not(:disabled), input:not([tabindex='-1']), select, a[href]"))
    .filter((el) => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

// `immediate`: the modal is mounted on its first opening, when it is
// already asked for.
watch(isOpen, async (open, wasOpen) => {
  if (!import.meta.client) return;
  if (open) {
    lastFocused = document.activeElement as HTMLElement | null;
    document.documentElement.classList.add("ob-modal-open");
    lenis?.stop?.();
    window.addEventListener("keydown", onKeydown);
    await nextTick();
    setTimeout(() => card.value?.querySelector<HTMLElement>(".lead-form__field")?.focus({ preventScroll: true }), 120);
  } else if (wasOpen) {
    document.documentElement.classList.remove("ob-modal-open");
    lenis?.start?.();
    window.removeEventListener("keydown", onKeydown);
    // Leave the "#contact-request" address a link brought the visitor with.
    if (location.hash === "#contact-request") history.replaceState(history.state, "", `${location.pathname}${location.search}`);
    lastFocused?.focus?.({ preventScroll: true });
    lastFocused = null;
  }
}, { immediate: true });

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  document.documentElement.classList.remove("ob-modal-open");
  if (isOpen.value) lenis?.start?.();
});
</script>

<template>
  <Teleport to="body">
    <Transition name="contact-modal">
      <div
        v-if="isOpen"
        ref="root"
        class="contact-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="t('contacts.modal.title')"
        :lang="locale"
        data-lenis-prevent
        @click.self="close"
      >
        <div ref="card" class="contact-modal__card">
          <button type="button" class="contact-modal__close" :aria-label="t('contacts.modal.close')" @click="close">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>

          <div class="contact-modal__aura">
            <AuraBlob :scale="1.15" :dpr="1.5" :logo-size="0.4" :label="t('contacts.modal.title')" />
          </div>

          <LeadForm class="contact-modal__form" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* Global: the page behind the modal does not scroll. */
html.ob-modal-open {
  overflow: hidden;
}
</style>

<style scoped>
.contact-modal {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: grid;
  place-items: center;
  padding: 1rem;
  overflow-y: auto;
  background: rgb(0 0 0 / 0.72);
  -webkit-backdrop-filter: blur(0.75rem);
  backdrop-filter: blur(0.75rem);
}

.contact-modal__card {
  --modal-radius: 1.5rem;
  position: relative;
  isolation: isolate;
  width: min(27.5rem, 100%);
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: var(--modal-radius);
  background:
    radial-gradient(ellipse 22rem 14rem at 50% 14%, rgb(0 239 165 / 0.08), transparent 70%),
    #020302;
  box-shadow: 0 2rem 6rem rgb(0 0 0 / 0.7), 0 0 4rem rgb(0 230 0 / 0.08);
  color: #fff;
}

.contact-modal__close {
  position: absolute;
  top: 0.875rem;
  right: 0.875rem;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 50%;
  background: rgb(0 0 0 / 0.4);
  color: rgb(255 255 255 / 0.75);
  cursor: pointer;
  transition: color 0.3s ease, border-color 0.3s ease;
}

.contact-modal__close:hover,
.contact-modal__close:focus-visible {
  border-color: #00e600;
  color: #fff;
}

.contact-modal__close svg {
  width: 0.875rem;
  height: 0.875rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
}

/* The aura fills the top of the card and fades into it. */
.contact-modal__aura {
  position: relative;
  z-index: 0;
  height: 15.5rem;
  margin-bottom: -0.5rem;
}

/* The renderer's canvas is opaque black outside the aura: blended with "screen"
   it vanishes into the card, so there is no visible box around the aura. */
.contact-modal__aura :deep(.one-aura) {
  isolation: auto;
  background: transparent;
}

.contact-modal__aura :deep(.one-aura__canvas) {
  mix-blend-mode: screen;
}

/* The form under the aura (its fields are LeadForm's own). */
.contact-modal__form {
  position: relative;
  z-index: 1;
  padding: 0 clamp(1.25rem, 8vw, 2.5rem) 1.75rem;
}

/* A short or narrow screen: a smaller aura leaves the form more room. */
@media (max-height: 760px), (max-width: 480px) {
  .contact-modal__aura {
    height: 11rem;
  }
}

.contact-modal-enter-active,
.contact-modal-leave-active {
  transition: opacity 0.3s ease;
}

.contact-modal-enter-active .contact-modal__card,
.contact-modal-leave-active .contact-modal__card {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease;
}

.contact-modal-enter-from,
.contact-modal-leave-to {
  opacity: 0;
}

.contact-modal-enter-from .contact-modal__card,
.contact-modal-leave-to .contact-modal__card {
  opacity: 0;
  transform: translateY(1rem) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .contact-modal-enter-active,
  .contact-modal-leave-active,
  .contact-modal-enter-active .contact-modal__card,
  .contact-modal-leave-active .contact-modal__card {
    transition: none;
  }
}
</style>
