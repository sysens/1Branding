<script setup lang="ts">
import { ref, onBeforeUnmount, computed } from "vue";

const root = ref<HTMLElement | null>(null);

const { t } = useI18n();
const localePath = useLocalePath();
// The form's copy is the page's own in each language (the CMS entry spelled
// the brand "One branding").
const formTitle = computed(() => t("contacts.form.title"));
const formDescription = computed(() => t("contacts.form.description"));
const topicTitle = computed(() => t("contacts.form.topicTitle"));
const topicInput = computed(() => t("contacts.form.topicInput"));
const servicesTitle = computed(() => t("contacts.form.servicesTitle"));
const servicesInput = computed(() => t("contacts.form.servicesInput"));
const fullNamePh = computed(() => t("contacts.form.fullName"));
const jobTitlePh = computed(() => t("contacts.form.jobTitle"));
const companyPh = computed(() => t("contacts.form.company"));
const phonePh = computed(() => t("contacts.form.phone"));
const emailPh = computed(() => t("contacts.form.email"));

const fileInputRef = ref<HTMLInputElement | null>(null);

const toastOpen = ref(false);
const toastMsg = ref("");
const toastType = ref<"error" | "success">("error");
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const showToast = (msg: string, type: "error" | "success" = "error") => {
  toastMsg.value = msg;
  toastType.value = type;
  toastOpen.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  // Errors stay long enough to read; a success note can go sooner.
  toastTimer = setTimeout(() => {
    toastOpen.value = false;
  }, type === "error" ? 7000 : 4000);
};

// Values, validation and sending live in useContactForm; this component is the markup.
const {
  fieldLimits,
  topicVal,
  servicesVal,
  fullNameVal,
  jobTitleVal,
  companyVal,
  phoneVal,
  emailVal,
  selectedFile,
  honeypotVal,
  sending,
  setFile,
  submit,
} = useContactForm(showToast);

const onPickFile = () => {
  fileInputRef.value?.click();
};

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement | null;
  const file = input?.files?.[0] ?? null;
  if (!setFile(file) && input) input.value = "";
};

const onSend = async () => {
  if ((await submit()) && fileInputRef.value) fileInputRef.value.value = "";
};

useGsapContext(
  root,
  ({ gsap, ScrollTrigger, el }) => {
    const title = el.querySelector<HTMLElement>(".form-title");
    const desc = el.querySelector<HTMLElement>(".form-desc");
    const leftCol = el.querySelector<HTMLElement>(".form-left");
    const rightCol = el.querySelector<HTMLElement>(".form-right");
    const agree = el.querySelector<HTMLElement>(".form-agree");
    const sendBtn = el.querySelector<HTMLElement>(".form-send");

    const prepare = (node: HTMLElement | null, from: { x?: number; y?: number }) => {
      if (!node) return;
      gsap.set(node, { ...from, opacity: 0 });
    };

    prepare(title, { x: 260 });
    prepare(desc, { x: -280 });
    prepare(leftCol, { x: -260 });
    prepare(rightCol, { x: 260 });
    prepare(agree, { y: 50 });
    prepare(sendBtn, { y: 50 });

    // A keyboard user can tab into the fields before the scroll animation has
    // run: show everything at once rather than letting focus land on invisible inputs.
    const hidden = [title, desc, leftCol, rightCol, agree, sendBtn].filter(Boolean) as HTMLElement[];
    const revealNow = () => {
      reveal?.kill();
      gsap.set(hidden, { x: 0, y: 0, opacity: 1 });
    };
    el.addEventListener("focusin", revealNow, { once: true });

    const reveal = ScrollTrigger?.create({
      trigger: el,
      start: "top 40%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        if (title) {
          tl.to(title, { x: 0, y: 0, opacity: 1, duration: 1.6 }, 0);
        }

        if (desc) {
          tl.to(desc, { x: 0, y: 0, opacity: 1, duration: 1.6 }, 0.08);
        }

        if (leftCol) {
          tl.to(leftCol, { x: 0, y: 0, opacity: 1, duration: 0.85 }, 0.14);
        }

        if (rightCol) {
          tl.to(rightCol, { x: 0, y: 0, opacity: 1, duration: 0.85 }, 0.22);
        }

        if (agree) {
          tl.to(agree, { x: 0, y: 0, opacity: 1, duration: 0.65 }, 0.3);
        }

        if (sendBtn) {
          tl.to(sendBtn, { x: 0, y: 0, opacity: 1, duration: 0.65 }, 0.38);
        }
      },
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger?.refresh();
      });
    });
  },
  { scrollTrigger: true, whenVisible: { threshold: 0.01, rootMargin: "200px 0px 200px 0px" } }
);

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = null;
});
</script>

<template>
  <div ref="root">
    <div v-if="toastOpen" class="fixed top-36 left-1/2 -translate-x-1/2 z-[99999] px-4">
      <div
        role="status"
        aria-live="polite"
        class="w-[92vw] max-w-[35rem] rounded-xl border border-white/10 px-4 py-3 backdrop-blur-md shadow-lg"
        :class="toastType === 'success' ? 'bg-green-500/20' : 'bg-black/50'"
      >
        <p class="type-body" :class="toastType === 'success' ? 'text-green-400' : 'text-red-500'">
          {{ toastMsg }}
        </p>
      </div>
    </div>

    <section class="w-full bg-black pt-10">
      <div class="mx-auto">
        <h2
          class="form-title will-change-transform type-h4 text-center text-[#FFFFFF] pb-[1.875rem]"
        >
          {{ formTitle }}
        </h2>

        <p
          class="form-desc will-change-transform type-lead type-measure mx-auto md:pb-[3.75rem] pb-[5.5rem] text-[#FFFFFF]"
        >
          {{ formDescription }}
        </p>

        <form id="contact-request-form" class="relative grid grid-cols-1 gap-10 md:grid-cols-2" novalidate @submit.prevent="onSend">
          <!-- Honeypot: invisible to people and screen readers, filled by form bots. -->
          <input
            v-model="honeypotVal"
            class="contact-hp"
            type="text"
            name="hp_c7x"
            tabindex="-1"
            autocomplete="off"
            aria-hidden="true"
          >
          <div class="form-left will-change-transform">
            <h3
              class="type-h5 pb-[1.875rem] text-[#FFFFFF]"
            >
              {{ topicTitle }}
            </h3>

            <input
              v-model="topicVal"
              type="text"
              required
              autocapitalize="sentences"
              autocomplete="off"
              :placeholder="topicInput"
              :aria-label="topicInput"
              :maxlength="fieldLimits.topic"
              class="type-body w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[3.75rem] text-white placeholder:text-white/60 outline-none transition focus:border-[#03cb00] focus:ring-0"
            >

            <h3
              class="type-h5 pt-[2.5rem] pb-[1.875rem] text-[#FFFFFF]"
            >
              {{ servicesTitle }}
            </h3>

            <textarea
              v-model="servicesVal"
              rows="10"
              required
              autocapitalize="sentences"
              autocomplete="off"
              :placeholder="servicesInput"
              :aria-label="servicesTitle"
              :maxlength="fieldLimits.services"
              class="type-body w-full resize-none p-4 rounded-lg border border-white/10 bg-black/60 px-4 h-[14.5625rem] text-white placeholder:text-white/60 outline-none transition focus:border-[#03cb00] focus:ring-0"
            />

            <div class="flex mt-[1.125rem] pb-[0.625rem] md:pb-[6.875rem] items-center gap-[2.25rem]">
              <div>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  class="hidden"
                  :aria-label="$t('common.addFile')"
                  @change="onFileChange"
                >
                <button
                  type="button"
                  class="ob-button"
                  @click="onPickFile"
                >
                  {{ $t("common.addFile") }}
                </button>
              </div>

              <div class="w-full">
                <p
                  class="type-lead text-[#FFFFFF]"
                >
                  {{ $t("common.maxFileSize") }}
                </p>

                <div v-if="selectedFile" class="mt-2 flex items-center gap-3">
                  <p
                    class="type-small max-w-[16.25rem] truncate text-white/80"
                  >
                    {{ selectedFile.name }}
                  </p>
                </div>

                <p v-else class="type-caption mt-2 text-white/60">
                  {{ $t("common.noFileSelected") }}
                </p>
              </div>
            </div>
          </div>

          <div class="form-right will-change-transform">
            <h3
              class="type-h5 pt-[2.5rem] md:pt-0 pb-[1.875rem] text-[#FFFFFF]"
            >
              {{ $t("common.contacts") }}
            </h3>

            <div class="space-y-5">
              <input
                v-model="fullNameVal"
                type="text"
                required
                autocapitalize="words"
                autocomplete="name"
                :placeholder="fullNamePh"
                :aria-label="fullNamePh"
                :maxlength="fieldLimits.fullName"
                class="type-body w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[3.75rem] text-white placeholder:text-white/60 outline-none transition focus:border-[#03cb00] focus:ring-0"
              >

              <input
                v-model="jobTitleVal"
                type="text"
                required
                autocapitalize="words"
                autocomplete="organization-title"
                :placeholder="jobTitlePh"
                :aria-label="jobTitlePh"
                :maxlength="fieldLimits.jobTitle"
                class="type-body w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[3.75rem] text-white placeholder:text-white/60 outline-none transition focus:border-[#03cb00] focus:ring-0"
              >

              <input
                v-model="companyVal"
                type="text"
                required
                autocapitalize="words"
                autocomplete="organization"
                :placeholder="companyPh"
                :aria-label="companyPh"
                :maxlength="fieldLimits.company"
                class="type-body w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[3.75rem] text-white placeholder:text-white/60 outline-none transition focus:border-[#03cb00] focus:ring-0"
              >

              <input
                v-model="phoneVal"
                type="tel"
                required
                inputmode="tel"
                autocomplete="tel"
                :placeholder="phonePh"
                :aria-label="phonePh"
                :maxlength="fieldLimits.phone"
                class="type-body w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[3.75rem] text-white placeholder:text-white/60 outline-none transition focus:border-[#03cb00] focus:ring-0"
              >

              <input
                v-model="emailVal"
                type="email"
                required
                inputmode="email"
                autocapitalize="off"
                autocomplete="email"
                :placeholder="emailPh"
                :aria-label="emailPh"
                :maxlength="fieldLimits.email"
                class="type-body w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[3.75rem] text-white placeholder:text-white/60 outline-none transition focus:border-[#03cb00] focus:ring-0"
              >
            </div>
          </div>
        </form>

        <p
          class="form-agree will-change-transform type-lead type-measure text-[#FFFFFF] mb-[1.8125rem] mt-[3rem]"
        >
          {{ $t("contacts.form.agreement") }}
          <NuxtLink :to="localePath('/privacy')" class="underline underline-offset-4 py-[0.125rem] hover:text-[#03cb00]">{{ $t("contacts.form.privacyLink") }}</NuxtLink>
        </p>

        <button
          type="submit"
          form="contact-request-form"
          :disabled="sending"
          class="form-send will-change-transform ob-button mb-[0.375rem]"
        >
          {{ sending ? $t("common.sending") : $t("common.send") }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.contact-hp {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
</style>
