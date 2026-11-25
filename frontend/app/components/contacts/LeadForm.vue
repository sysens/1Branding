<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import Stepper from "~/components/ui/Stepper.vue";
import { TELEGRAM_CONTACT_URL, WHATSAPP_CONTACT_URL } from "~/utils/company";
import { CONTACT_METHODS, type LeadServiceKey } from "~/utils/leadForm";
import type { ObApi, TrackFn } from "~/utils/obTracker";

// The request form, in three steps that fit a phone: who (name, company),
// what (industry, services) and how to reach the visitor (phone, Telegram or
// WhatsApp, and the consent). The same form is the modal's
// (components/contacts/ContactModal.vue, under the aura) and sits inline on
// the contact page and at the end of each service page (`inline`). The data
// and the request are composables/useLeadForm.ts. After it is sent the form
// gives way to a thank-you with a "Write in Telegram now" button; the
// messenger links carry the visitor's contact code (plugins/ob-tracker.client.ts).
const props = defineProps<{
  /** On the page itself, not in the modal: "opened" once scrolled into view. */
  inline?: boolean;
  /** The service of the page the form is on, ticked from the start. */
  service?: LeadServiceKey;
}>();

const { t } = useI18n();
const localePath = useLocalePath();
const nuxtApp = useNuxtApp();
const uid = useId();
const place = props.inline ? "inline" : "modal";
const track = (name: string, params?: Record<string, unknown>) => (nuxtApp.$track as TrackFn | undefined)?.(name, params);

const root = ref<HTMLElement | null>(null);
const stepper = ref<InstanceType<typeof Stepper> | null>(null);
const turnstileBox = ref<HTMLElement | null>(null);
const sent = ref(false);
const errorText = ref("");

const {
  fieldLimits,
  countries,
  name,
  company,
  industry,
  industryOther,
  services,
  method,
  country,
  phone,
  telegram,
  consent,
  honeypot,
  sending,
  serviceOptions,
  industryOptions,
  phonePlaceholder,
  formatPhoneInput,
  markOpened,
  stepError,
  submit,
  turnstile,
} = useLeadForm((message) => { errorText.value = message; }, { service: props.service });

const withTurnstile = Boolean(String(useRuntimeConfig().public.turnstileSiteKey || "").trim());
const heading = props.inline ? "h3" : "h2";
const stepTitles = computed(() => [t("leadForm.steps.about"), t("leadForm.steps.project"), t("leadForm.steps.contact")]);

// The chats: the plain links in the server HTML, with the visitor's code once
// the browser knows it (a click adds it anyway, see the tracker).
const telegramHref = ref(TELEGRAM_CONTACT_URL);
const whatsappHref = ref(WHATSAPP_CONTACT_URL);
const refreshMessengers = () => {
  const ob = nuxtApp.$ob as ObApi | undefined;
  if (!ob) return;
  telegramHref.value = ob.messengerHref(TELEGRAM_CONTACT_URL);
  whatsappHref.value = ob.messengerHref(WHATSAPP_CONTACT_URL);
};

// A step cannot be left while its answers are missing or wrong.
const validate = (step: number) => {
  const problem = stepError(step);
  errorText.value = problem ?? "";
  return problem;
};

const onPhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  input.value = formatPhoneInput(input.value);
};
watch(country, () => formatPhoneInput(phone.value));

let started = false;
const onInput = () => {
  if (started) return;
  started = true;
  track("form_start", { place });
};

let opened = false;
const open = () => {
  if (opened) return;
  opened = true;
  markOpened();
  track("form_open", { place });
  if (withTurnstile && turnstileBox.value) void turnstile.start(turnstileBox.value);
};

const onComplete = async () => {
  errorText.value = "";
  const result = await submit();
  if (result.ok) {
    sent.value = true;
    refreshMessengers();
    return;
  }
  // A field the server refused: back to its step, keeping the message.
  if (result.step) {
    const message = errorText.value;
    stepper.value?.go(result.step);
    errorText.value = message;
  }
};

let observer: IntersectionObserver | null = null;
onMounted(() => {
  refreshMessengers();
  if (!props.inline || !("IntersectionObserver" in window)) {
    open();
    return;
  }
  observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer?.disconnect();
    observer = null;
    open();
  }, { threshold: 0.35 });
  if (root.value) observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  turnstile.stop();
});
</script>

<template>
  <div ref="root" class="lead-form" :class="{ 'lead-form--inline': inline }">
    <form v-if="!sent" class="lead-form__content" novalidate @submit.prevent @input="onInput">
      <Stepper
        ref="stepper"
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
          <component :is="heading" class="sr-only">{{ stepTitles[step - 1] }}</component>

          <div v-if="step === 1" class="lead-form__group">
            <input
              v-model="name"
              class="lead-form__field"
              type="text"
              name="name"
              autocomplete="name"
              :maxlength="fieldLimits.name"
              :placeholder="t('leadForm.name')"
              :aria-label="t('leadForm.name')"
            >
            <input
              v-model="company"
              class="lead-form__field"
              type="text"
              name="organization"
              autocomplete="organization"
              :maxlength="fieldLimits.company"
              :placeholder="t('leadForm.company')"
              :aria-label="t('leadForm.company')"
            >
          </div>

          <div v-else-if="step === 2" class="lead-form__group">
            <select
              v-model="industry"
              class="lead-form__field lead-form__select"
              name="industry"
              :class="{ 'is-empty': !industry }"
              :aria-label="t('leadForm.industry')"
            >
              <option value="" disabled>{{ t("leadForm.industry") }}</option>
              <option v-for="option in industryOptions" :key="option.key" :value="option.key">{{ option.label }}</option>
            </select>
            <input
              v-if="industry === 'other'"
              v-model="industryOther"
              class="lead-form__field"
              type="text"
              name="industry-other"
              :maxlength="fieldLimits.industryOther"
              :placeholder="t('leadForm.industryOther')"
              :aria-label="t('leadForm.industryOther')"
            >
            <fieldset class="lead-form__services">
              <legend>{{ t("leadForm.services") }}</legend>
              <!-- Its own scroll in the modal: data-lenis-prevent lets the wheel reach it. -->
              <div class="lead-form__chips" data-lenis-prevent>
                <label v-for="option in serviceOptions" :key="option.key" class="lead-form__chip">
                  <input v-model="services" type="checkbox" name="services" :value="option.key">
                  <span>{{ option.label }}</span>
                </label>
              </div>
            </fieldset>
          </div>

          <div v-else class="lead-form__group">
            <fieldset class="lead-form__methods">
              <legend class="sr-only">{{ t("leadForm.method") }}</legend>
              <label v-for="option in CONTACT_METHODS" :key="option" class="lead-form__method">
                <input v-model="method" type="radio" :name="`method-${uid}`" :value="option">
                <span>{{ t(`leadForm.methods.${option}`) }}</span>
              </label>
            </fieldset>

            <input
              v-if="method === 'telegram'"
              v-model="telegram"
              class="lead-form__field"
              type="text"
              name="telegram"
              autocomplete="off"
              autocapitalize="none"
              spellcheck="false"
              :maxlength="fieldLimits.telegram"
              :placeholder="t('leadForm.telegram')"
              :aria-label="t('leadForm.methods.telegram')"
            >
            <div v-else class="lead-form__field lead-form__phone">
              <select v-model="country" class="lead-form__country" name="country" :aria-label="t('leadForm.country')">
                <option v-for="item in countries" :key="item.iso" :value="item.iso">{{ item.iso }} +{{ item.dial }}</option>
              </select>
              <input
                :value="phone"
                type="tel"
                name="tel"
                autocomplete="tel-national"
                inputmode="tel"
                :placeholder="phonePlaceholder"
                :aria-label="t(method === 'whatsapp' ? 'leadForm.whatsapp' : 'leadForm.phone')"
                @input="onPhoneInput"
              >
            </div>

            <label class="lead-form__consent">
              <input v-model="consent" type="checkbox" name="consent">
              <span>
                {{ t("contacts.form.agreement") }}
                <NuxtLink :to="localePath('/privacy')" target="_blank" class="lead-form__link" @click.stop>{{ t("contacts.form.privacyLink") }}</NuxtLink>
              </span>
            </label>
          </div>
        </template>
      </Stepper>

      <!-- Cloudflare Turnstile, out of sight unless it needs a click. -->
      <div v-if="withTurnstile" ref="turnstileBox" class="lead-form__turnstile" />

      <!-- A trap for bots: invisible, never filled by a visitor. -->
      <input
        v-model="honeypot"
        class="lead-form__trap"
        type="text"
        name="website"
        tabindex="-1"
        autocomplete="off"
        aria-hidden="true"
      >
    </form>

    <div v-else class="lead-form__done" role="status">
      <component :is="heading" class="lead-form__done-title">{{ t("leadForm.doneTitle") }}</component>
      <p>{{ t("leadForm.doneText") }}</p>
      <a :href="telegramHref" target="_blank" rel="noopener noreferrer" class="lead-form__telegram">{{ t("leadForm.writeTelegram") }}</a>
      <a :href="whatsappHref" target="_blank" rel="noopener noreferrer" class="lead-form__link lead-form__whatsapp">WhatsApp</a>
    </div>

    <p class="lead-form__error" role="alert" aria-live="assertive">{{ errorText }}</p>

    <p v-if="!sent" class="lead-form__messengers">
      <span>{{ t("leadForm.orWrite") }}</span>
      <a :href="telegramHref" target="_blank" rel="noopener noreferrer" class="lead-form__chat">Telegram</a>
      <a :href="whatsappHref" target="_blank" rel="noopener noreferrer" class="lead-form__chat">WhatsApp</a>
    </p>
  </div>
</template>

<style scoped>
.lead-form {
  font-family: var(--app-font-sans);
  text-align: left;
}

/* Pages style their own <p> (the service page's call to action): not these. */
.lead-form p {
  max-width: none;
  margin: 0;
  letter-spacing: normal;
}

.lead-form--inline {
  width: min(30rem, 100%);
  margin-inline: auto;
}

.lead-form__group {
  display: grid;
  gap: 0.875rem;
}

/* The green pill of the site's form fields. */
.lead-form__field {
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

.lead-form__field::placeholder,
.lead-form__phone input::placeholder {
  color: rgb(255 255 255 / 0.38);
}

.lead-form__field:focus,
.lead-form__phone:focus-within {
  background: rgb(0 230 0 / 0.05);
  box-shadow: 0 0 0 3px rgb(0 230 0 / 0.18), 0 0 1.5rem rgb(0 230 0 / 0.18);
}

.lead-form__select,
.lead-form__country {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='%2300e600' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M1 1.5l5 5 5-5'/></svg>");
  background-repeat: no-repeat;
  background-size: 0.75rem;
}

.lead-form__select {
  padding-right: 2.75rem;
  background-position: right 1.25rem center;
}

.lead-form__select.is-empty {
  color: rgb(255 255 255 / 0.38);
}

.lead-form__select option,
.lead-form__country option {
  background: #0b0e0b;
  color: #fff;
}

/* Services: small pills, ticked ones solid green. */
.lead-form__services {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.lead-form__services legend {
  margin-bottom: 0.625rem;
  padding: 0;
  color: rgb(255 255 255 / 0.6);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
}

.lead-form__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-height: 11.5rem;
  padding: 0.1875rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgb(0 230 0 / 0.4) transparent;
}

.lead-form--inline .lead-form__chips {
  max-height: none;
}

.lead-form__chip,
.lead-form__method {
  position: relative;
  cursor: pointer;
}

.lead-form__chip input,
.lead-form__method input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.lead-form__chip span {
  display: inline-block;
  padding: 0.4rem 0.875rem;
  border: 1px solid rgb(0 230 0 / 0.45);
  border-radius: 62.4375rem;
  color: rgb(255 255 255 / 0.82);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
}

.lead-form__chip:hover span {
  border-color: #00e600;
}

.lead-form__chip input:checked + span,
.lead-form__method input:checked + span {
  border-color: #00e600;
  background: #00e600;
  color: #021d08;
}

.lead-form__chip input:focus-visible + span,
.lead-form__method input:focus-visible + span {
  box-shadow: 0 0 0 3px rgb(0 230 0 / 0.35);
}

/* How to reach the visitor: one pill split in three. */
.lead-form__methods {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.25rem;
  margin: 0;
  padding: 0.25rem;
  border: 1.5px solid #00e600;
  border-radius: 62.4375rem;
}

.lead-form__method span {
  display: block;
  padding: 0.625rem 0.25rem;
  border: 1px solid transparent;
  border-radius: 62.4375rem;
  color: rgb(255 255 255 / 0.7);
  font-size: var(--type-small-size);
  font-weight: 600;
  text-align: center;
  transition: background 0.25s ease, color 0.25s ease;
}

.lead-form__method:hover input:not(:checked) + span {
  color: #fff;
}

/* The country's code and the number in one pill. */
.lead-form__phone {
  display: flex;
  align-items: stretch;
  padding: 0;
  overflow: hidden;
}

.lead-form__country {
  flex: none;
  padding: 0 1.75rem 0 1.25rem;
  border: 0;
  border-right: 1px solid rgb(0 230 0 / 0.35);
  background-color: transparent;
  background-position: right 0.75rem center;
  color: #fff;
  font: inherit;
  font-size: var(--type-small-size);
  outline: none;
}

.lead-form__phone input {
  flex: 1;
  min-width: 0;
  padding: 0 1.25rem 0 0.875rem;
  border: 0;
  background: transparent;
  color: #fff;
  font: inherit;
  outline: none;
}

.lead-form__consent {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  color: rgb(255 255 255 / 0.6);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  cursor: pointer;
}

.lead-form__consent input {
  flex: none;
  width: 1rem;
  height: 1rem;
  margin-top: 0.125rem;
  accent-color: #00e600;
}

.lead-form .lead-form__link {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.lead-form .lead-form__link:hover {
  color: #00e600;
}

.lead-form__turnstile {
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
}

.lead-form__turnstile:empty {
  display: none;
}

.lead-form__trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.lead-form__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 0.5rem;
  text-align: center;
}

.lead-form__done-title {
  margin: 0;
  color: #fff;
  font-family: var(--app-font-display);
  font-size: var(--type-h4-size);
  font-weight: 600;
  line-height: var(--type-h4-lh);
}

.lead-form .lead-form__done p {
  max-width: 24rem;
  margin: 0.5rem 0 0;
  color: rgb(255 255 255 / 0.7);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
}

/* The Stepper's green button, as a link to the chat. */
.lead-form .lead-form__telegram {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.75rem;
  margin-top: 1.5rem;
  padding: 0 1.75rem;
  border-radius: 62.4375rem;
  background: #00e600;
  color: #021d08;
  font-size: var(--type-small-size);
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.lead-form .lead-form__telegram:hover,
.lead-form .lead-form__telegram:focus-visible {
  transform: scale(1.04);
  box-shadow: 0 0 1.6rem rgb(0 230 0 / 0.4);
}

.lead-form .lead-form__whatsapp {
  margin-top: 0.875rem;
  font-size: var(--type-small-size);
}

.lead-form .lead-form__error {
  color: #ff8a80;
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  text-align: center;
}

.lead-form .lead-form__error:not(:empty) {
  margin-top: 0.875rem;
}

/* "Or write to us": the two chats, small. */
.lead-form .lead-form__messengers {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.125rem;
  color: rgb(255 255 255 / 0.55);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
}

.lead-form .lead-form__chat {
  padding: 0.3rem 0.875rem;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 62.4375rem;
  color: #fff;
  text-decoration: none;
  transition: border-color 0.25s ease, color 0.25s ease;
}

.lead-form .lead-form__chat:hover,
.lead-form .lead-form__chat:focus-visible {
  border-color: #00e600;
  color: #00e600;
}
</style>
