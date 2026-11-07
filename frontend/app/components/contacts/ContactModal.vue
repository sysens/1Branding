<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import AuraBlob from "~/components/ui/AuraBlob.vue";
import Stepper from "~/components/ui/Stepper.vue";
import { SERVICE_PAGES } from "~/utils/servicePages";

// The quick request, as a modal opened by the "Start something big" button (and
// by any link to /contact#contact-request): the aura with the "1" on top, then
// three steps, one question each: name, what the visitor needs (a select) and
// phone number. Sent to the same Strapi endpoint as before (useContactForm).
const { t, locale } = useI18n();
const localePath = useLocalePath();
const { isOpen, close } = useContactModal();

const sent = ref(false);
const errorText = ref("");
const root = ref<HTMLElement | null>(null);
const card = ref<HTMLElement | null>(null);

const notify = (message: string, type: "error" | "success") => {
  errorText.value = type === "error" ? message : "";
};

const {
  fieldLimits,
  fullNameVal,
  topicVal,
  phoneVal,
  consentVal,
  honeypotVal,
  sending,
  markOpened,
  nameError,
  topicError,
  phoneError,
  submit,
} = useContactForm(notify);

const stepTitles = computed(() => [t("contacts.modal.steps.name"), t("contacts.modal.steps.topic"), t("contacts.modal.steps.phone")]);

// What the visitor can ask for: the site's services, and "something else".
const topics = computed(() => [
  ...SERVICE_PAGES.map((page) => t(`servicePages.${page.key}.name`)),
  t("contacts.modal.other"),
]);

// A step cannot be left while its answer is missing or wrong.
const validate = (step: number): string | null => {
  const problem = step === 1 ? nameError() : step === 2 ? topicError() : phoneError();
  errorText.value = problem ?? "";
  return problem;
};

const onComplete = async () => {
  errorText.value = "";
  if (await submit()) {
    sent.value = true;
    window.setTimeout(() => { if (sent.value) close(); }, 4500);
  }
};

// Open: lock the page behind, remember where focus was, start the bot-trap clock.
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

// `immediate`: the modal is mounted client-side only, so a button (or a link's
// #contact-request) may have asked for it before it was there.
watch(isOpen, async (open, wasOpen) => {
  if (!import.meta.client) return;
  if (open) {
    lastFocused = document.activeElement as HTMLElement | null;
    sent.value = false;
    errorText.value = "";
    markOpened();
    document.documentElement.classList.add("ob-modal-open");
    lenis?.stop?.();
    window.addEventListener("keydown", onKeydown);
    await nextTick();
    setTimeout(() => card.value?.querySelector<HTMLElement>("input.contact-modal__field, select")?.focus({ preventScroll: true }), 120);
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
        @click.self="close"
      >
        <div ref="card" class="contact-modal__card">
          <button type="button" class="contact-modal__close" :aria-label="t('contacts.modal.close')" @click="close">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>

          <div class="contact-modal__aura">
            <AuraBlob :scale="1.15" :dpr="1.5" :logo-size="0.4" :label="t('contacts.modal.title')" />
          </div>

          <div v-if="!sent" class="contact-modal__content">
            <Stepper
              :total="3"
              :titles="stepTitles"
              linear
              :validate="validate"
              :busy="sending"
              :back-button-text="t('contacts.modal.back')"
              :next-button-text="t('contacts.modal.next')"
              :complete-button-text="t('contacts.modal.send')"
              @invalid="(message) => (errorText = message)"
              @step-change="errorText = ''"
              @complete="onComplete"
            >
              <template #default="{ step }">
                <h2 class="sr-only">{{ stepTitles[step - 1] }}</h2>

                <input
                  v-if="step === 1"
                  v-model="fullNameVal"
                  class="contact-modal__field"
                  type="text"
                  name="name"
                  autocomplete="name"
                  :maxlength="fieldLimits.fullName"
                  :placeholder="t('contacts.modal.namePlaceholder')"
                  :aria-label="t('contacts.modal.namePlaceholder')"
                >

                <select
                  v-else-if="step === 2"
                  v-model="topicVal"
                  class="contact-modal__field contact-modal__select"
                  name="topic"
                  :class="{ 'is-empty': !topicVal }"
                  :aria-label="t('contacts.modal.topicPlaceholder')"
                >
                  <option value="" disabled>{{ t("contacts.modal.topicPlaceholder") }}</option>
                  <option v-for="topic in topics" :key="topic" :value="topic">{{ topic }}</option>
                </select>

                <div v-else class="contact-modal__phone">
                  <input
                    v-model="phoneVal"
                    class="contact-modal__field"
                    type="tel"
                    name="tel"
                    autocomplete="tel"
                    inputmode="tel"
                    :maxlength="fieldLimits.phone"
                    :placeholder="t('contacts.modal.phonePlaceholder')"
                    :aria-label="t('contacts.modal.phonePlaceholder')"
                  >
                  <label class="contact-modal__consent">
                    <input v-model="consentVal" type="checkbox" name="consent">
                    <span>
                      {{ t("contacts.form.agreement") }}
                      <NuxtLink :to="localePath('/privacy')" target="_blank" @click.stop>{{ t("contacts.form.privacyLink") }}</NuxtLink>
                    </span>
                  </label>
                </div>
              </template>
            </Stepper>

            <!-- A trap for bots: invisible, never filled by a visitor. -->
            <input
              v-model="honeypotVal"
              class="contact-modal__trap"
              type="text"
              name="website"
              tabindex="-1"
              autocomplete="off"
              aria-hidden="true"
            >
          </div>

          <div v-else class="contact-modal__done" role="status">
            <h2>{{ t("contacts.modal.doneTitle") }}</h2>
            <p>{{ t("contacts.modal.doneText") }}</p>
          </div>

          <p class="contact-modal__error" role="alert" aria-live="assertive">{{ errorText }}</p>
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

.contact-modal__content {
  position: relative;
  z-index: 1;
  padding: 0 clamp(1.25rem, 8vw, 2.5rem) 1.75rem;
}

.contact-modal__field {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 3.25rem;
  padding: 0 1.5rem;
  border: 1.5px solid #00e600;
  border-radius: 62.4375rem;
  background: rgb(255 255 255 / 0.02);
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-lead-size);
  font-weight: 500;
  outline: none;
  transition: box-shadow 0.3s ease, background 0.3s ease;
}

.contact-modal__field::placeholder {
  color: rgb(255 255 255 / 0.38);
}

.contact-modal__field:focus {
  background: rgb(0 230 0 / 0.05);
  box-shadow: 0 0 0 3px rgb(0 230 0 / 0.18), 0 0 1.5rem rgb(0 230 0 / 0.18);
}

.contact-modal__select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 2.75rem;
  cursor: pointer;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='%2300e600' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M1 1.5l5 5 5-5'/></svg>");
  background-repeat: no-repeat;
  background-position: right 1.25rem center;
  background-size: 0.75rem;
}

.contact-modal__select.is-empty {
  color: rgb(255 255 255 / 0.38);
}

.contact-modal__select option {
  background: #0b0e0b;
  color: #fff;
}

.contact-modal__phone {
  display: grid;
  gap: 0.875rem;
}

.contact-modal__consent {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  color: rgb(255 255 255 / 0.6);
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  cursor: pointer;
}

.contact-modal__consent input {
  flex: none;
  width: 1rem;
  height: 1rem;
  margin-top: 0.125rem;
  accent-color: #00e600;
}

.contact-modal__consent a {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.contact-modal__consent a:hover {
  color: #00e600;
}

.contact-modal__trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.contact-modal__done {
  position: relative;
  z-index: 1;
  padding: 0 2rem 2.5rem;
  text-align: center;
}

.contact-modal__done h2 {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: var(--type-h4-size);
  font-weight: 600;
  line-height: var(--type-h4-lh);
}

.contact-modal__done p {
  margin: 0.5rem 0 0;
  color: rgb(255 255 255 / 0.7);
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
}

.contact-modal__error {
  position: relative;
  z-index: 1;
  min-height: 0;
  margin: 0;
  padding: 0 1.5rem;
  color: #ff8a80;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  text-align: center;
}

.contact-modal__error:not(:empty) {
  padding-bottom: 1.25rem;
  margin-top: -0.75rem;
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
