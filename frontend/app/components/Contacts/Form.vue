<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";

type AppLocale = "ru" | "en";

const root = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let ctx: any = null;
let inited = false;

type ContactsPageGql = {
  data?: {
    contactsPage?: {
      section2?: { title?: string | null; text?: string | null } | null;
    } | null;
  };
};

const config = useRuntimeConfig();
const GRAPHQL_URL = (config.public.graphqlUrl as string) || "";

const { t, locale } = useI18n<{ message: any }, AppLocale>();
const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

const CONTACTS_PAGE_QUERY = `
query ContactFormCopy($locale: I18NLocaleCode) {
  contactsPage(locale: $locale) {
    section2 { title text }
  }
}
`;

const { data: gqlRes } = await useAsyncData<ContactsPageGql>(
  () => `contact-form-copy-${gqlLocale.value}`,
  async () => {
    if (!GRAPHQL_URL) return {};
    return await $fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { query: CONTACTS_PAGE_QUERY, variables: { locale: gqlLocale.value } },
    });
  },
  { watch: [gqlLocale] }
);

const formCopy = computed(() => gqlRes.value?.data?.contactsPage?.section2);
const formTitle = computed(() => formCopy.value?.title || t("contacts.form.title"));
const formDescription = computed(() => formCopy.value?.text || t("contacts.form.description"));
const topicTitle = computed(() => t("contacts.form.topicTitle"));
const topicInput = computed(() => t("contacts.form.topicInput"));
const servicesTitle = computed(() => t("contacts.form.servicesTitle"));
const servicesInput = computed(() => t("contacts.form.servicesInput"));
const fullNamePh = computed(() => t("contacts.form.fullName"));
const jobTitlePh = computed(() => t("contacts.form.jobTitle"));
const companyPh = computed(() => t("contacts.form.company"));
const phonePh = computed(() => t("contacts.form.phone"));
const emailPh = computed(() => t("contacts.form.email"));

const getOrigin = (url: string) => {
  try {
    return url ? new URL(url).origin : "";
  } catch {
    return "";
  }
};

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const sending = ref(false);

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

const onPickFile = () => {
  fileInputRef.value?.click();
};

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement | null;
  const files = input?.files;
  const f = files && files.length ? files[0] : null;

  if (!f) {
    selectedFile.value = null;
    return;
  }

  if (f.size > 10 * 1024 * 1024) {
    selectedFile.value = null;
    if (input) input.value = "";
    showToast(t("common.maxFileSize"), "error");
    return;
  }

  selectedFile.value = f;
};

const uploadFileToStrapi = async (file: File): Promise<number> => {
  const origin = getOrigin(GRAPHQL_URL);
  const uploadUrl = origin ? `${origin}/api/upload` : "/api/upload";

  const formData = new FormData();
  formData.append("files", file, file.name || "upload-file");

  const res = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
    credentials: "omit",
  });

  if (!res.ok) {
    let errorText = "";
    try {
      errorText = await res.text();
    } catch {
      errorText = "";
    }
    throw Object.assign(new Error(errorText || `Upload failed with status ${res.status}`), { status: res.status });
  }

  let parsed: any = null;
  try {
    parsed = await res.json();
  } catch {
    throw new Error("Invalid upload response");
  }

  const id = Array.isArray(parsed) ? parsed[0]?.id : null;
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw new Error(t("common.fileUploadFailed"));
  }
  return id;
};

type ContactRequestPayload = {
  TopicInput: string;
  requestedServicesMessageInput: string;
  requestedServicesMessageFile: number;
  FullName: string;
  JobTitle: string;
  Company: string;
  PhoneNumber: string;
  email: string;
};

// Bot traps checked by the backend: the hidden "website" field stays empty for
// people, and a real visitor needs more than a few seconds to fill the form.
const honeypotVal = ref("");
let formOpenedAt = 0;

const submitContactRequestRest = async (dataPayload: ContactRequestPayload) => {
  const origin = getOrigin(GRAPHQL_URL);
  const url = origin ? `${origin}/api/contacts-requests` : "/api/contacts-requests";

  return await $fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      data: dataPayload,
      meta: { website: honeypotVal.value, elapsedMs: Date.now() - formOpenedAt },
    },
  });
};

const topicVal = ref("");
const servicesVal = ref("");
const fullNameVal = ref("");
const jobTitleVal = ref("");
const companyVal = ref("");
const phoneVal = ref("");
const emailVal = ref("");

const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
const isValidPhone = (val: string) => /^\+?[0-9\s().-]{7,32}$/.test(val.trim()) && val.replace(/\D/g, "").length >= 7;

const fieldLimits = {
  topic: 200,
  services: 5000,
  fullName: 150,
  jobTitle: 150,
  company: 150,
  phone: 32,
  email: 254,
} as const;

// A short message in the visitor's language instead of the backend's raw text.
const normalizeBackendError = (e: any) => {
  const status = Number(e?.status ?? e?.statusCode ?? e?.response?.status ?? 0);
  const message = String(e?.data?.error?.message || e?.message || "");
  if (status === 429) return t("common.tooManyRequests");
  if (status === 413 || /file/i.test(message)) return t("common.fileUploadFailed");
  if (/email|phone/i.test(message)) return t("common.invalidEmailOrPhone");
  if (!status || e instanceof TypeError) return t("common.networkError");
  return t("common.sendFailed");
};

// The upload of the selected file, kept so a failed submit can be retried
// without uploading the same file again.
let uploaded: { file: File; id: number } | null = null;

const onSend = async () => {
  if (sending.value) return;
  if (!GRAPHQL_URL) {
    showToast(t("common.error"), "error");
    return;
  }

  if (!topicVal.value.trim()) return showToast(t("common.requiredField"), "error");
  if (!servicesVal.value.trim()) return showToast(t("common.requiredField"), "error");
  if (!fullNameVal.value.trim()) return showToast(t("common.requiredField"), "error");
  if (!jobTitleVal.value.trim()) return showToast(t("common.requiredField"), "error");
  if (!companyVal.value.trim()) return showToast(t("common.requiredField"), "error");
  if (!phoneVal.value.trim()) return showToast(t("common.requiredField"), "error");
  if (!emailVal.value.trim()) return showToast(t("common.requiredField"), "error");
  if (!isValidEmail(emailVal.value)) return showToast(t("common.invalidEmail"), "error");
  if (!isValidPhone(phoneVal.value)) return showToast(t("common.invalidEmailOrPhone"), "error");
  if (
    topicVal.value.trim().length > fieldLimits.topic ||
    servicesVal.value.trim().length > fieldLimits.services ||
    fullNameVal.value.trim().length > fieldLimits.fullName ||
    jobTitleVal.value.trim().length > fieldLimits.jobTitle ||
    companyVal.value.trim().length > fieldLimits.company ||
    phoneVal.value.trim().length > fieldLimits.phone ||
    emailVal.value.trim().length > fieldLimits.email
  ) return showToast(t("common.error"), "error");
  if (!selectedFile.value) return showToast(t("common.fileRequired"), "error");

  sending.value = true;

  try {
    // The current public Strapi contract uploads media first, then links its ID on create.
    const file = selectedFile.value;
    const uploadedFileId = uploaded?.file === file ? uploaded.id : await uploadFileToStrapi(file);
    uploaded = { file, id: uploadedFileId };

    const dataPayload: ContactRequestPayload = {
      TopicInput: topicVal.value.trim(),
      requestedServicesMessageInput: servicesVal.value.trim(),
      FullName: fullNameVal.value.trim(),
      JobTitle: jobTitleVal.value.trim(),
      Company: companyVal.value.trim(),
      PhoneNumber: phoneVal.value.trim(),
      email: emailVal.value.trim(),
      requestedServicesMessageFile: uploadedFileId,
    };

    await submitContactRequestRest(dataPayload);

    topicVal.value = "";
    servicesVal.value = "";
    fullNameVal.value = "";
    jobTitleVal.value = "";
    companyVal.value = "";
    phoneVal.value = "";
    emailVal.value = "";
    selectedFile.value = null;
    uploaded = null;
    formOpenedAt = Date.now();

    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }

    showToast(t("common.sent"), "success");
  } catch (e: any) {
    // The server refused the attached upload (expired, or the server restarted):
    // the next try uploads the file again.
    if (/file/i.test(String(e?.data?.error?.message || ""))) uploaded = null;
    showToast(normalizeBackendError(e), "error");
  } finally {
    sending.value = false;
  }
};

const initGsap = async () => {
  if (inited || !root.value) return;
  inited = true;

  await nextTick();

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
    const el = root.value!;

    const title = el.querySelector<HTMLElement>(".form-title");
    const desc = el.querySelector<HTMLElement>(".form-desc");
    const leftCol = el.querySelector<HTMLElement>(".form-left");
    const rightCol = el.querySelector<HTMLElement>(".form-right");
    const agree = el.querySelector<HTMLElement>(".form-agree");
    const sendBtn = el.querySelector<HTMLElement>(".form-send");

    // Reduced motion: no slide-in, the form is simply there.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
      reveal.kill();
      gsap.set(hidden, { x: 0, y: 0, opacity: 1 });
    };
    el.addEventListener("focusin", revealNow, { once: true });

    const reveal = ScrollTrigger.create({
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
        ScrollTrigger.refresh();
      });
    });
  }, root.value);
};

onMounted(() => {
  formOpenedAt = Date.now();
  if (!root.value) return;

  const rect = root.value.getBoundingClientRect();
  const inViewNow = rect.top < window.innerHeight * 1.2 && rect.bottom > 0;
  if (inViewNow) initGsap();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) initGsap();
    },
    { threshold: 0.01, rootMargin: "200px 0px 200px 0px" }
  );

  observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;

  ctx?.revert();
  ctx = null;

  inited = false;

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
        class="w-[92vw] max-w-[560px] rounded-xl border border-white/10 px-4 py-3 backdrop-blur-md shadow-lg"
        :class="toastType === 'success' ? 'bg-green-500/20' : 'bg-black/50'"
      >
        <p class="text-[24px] md:text-[16px] leading-[120%]" :class="toastType === 'success' ? 'text-green-400' : 'text-red-500'">
          {{ toastMsg }}
        </p>
      </div>
    </div>

    <section class="w-full bg-black pt-10">
      <div class="mx-auto">
        <h2
          class="form-title will-change-transform font-['Inter'] font-normal text-[20px] leading-[100%] tracking-[0%] text-center text-[#FFFFFF] pb-[30px] md:text-[36px]"
        >
          {{ formTitle }}
        </h2>

        <p
          class="form-desc will-change-transform font-['Inter'] font-light text-[14px] leading-[120%] tracking-normal md:pb-[60px] pb-[88px] text-[#FFFFFF] md:font-normal md:text-[20px]"
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
          />
          <div class="form-left will-change-transform">
            <h3
              class="font-normal md:text-[24px] md:pb-[30px] pb-[30px] md:leading-[24px] text-[#FFFFFF] md:tracking-normal font-['Inter'] text-[20px] leading-[100%] tracking-[0%]"
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
              class="w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[60px] text-white placeholder:text-white/50 placeholder:font-['Inter'] outline-none transition focus:border-[#03cb00] focus:ring-0"
            />

            <h3
              class="font-normal md:text-[24px] md:pb-[30px] pt-[40px] pb-[30px] md:leading-[24px] text-[#FFFFFF] md:tracking-normal font-['Inter'] text-[20px] leading-[100%] tracking-[0%]"
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
              class="w-full resize-none p-4 rounded-lg border border-white/10 bg-black/60 px-4 h-[233px] text-white placeholder:text-white/50 placeholder:font-['Inter'] outline-none transition focus:border-[#03cb00] focus:ring-0"
            />

            <div class="flex mt-[18px] pb-[10px] md:pb-[110px] items-center gap-[36px]">
              <div>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  class="hidden"
                  :aria-label="$t('common.addFile')"
                  @change="onFileChange"
                />
                <button
                  type="button"
                  @click="onPickFile"
                  class="capitalize md:w-[236px] text-[#FFFFFF] md:h-[60px] w-[219px] h-[50px] rounded-[32px] font-normal md:text-[19.57px] text-[16px] leading-[19.57px] tracking-normal text-center align-middle font-['Inter'] bg-[url('/home/Component3.png')] bg-[size:120%] bg-[position:100%_50%] transition-[background-position,background-size,box-shadow] duration-1000 ease-[cubic-bezier(.4,0,.2,1)] md:text-[20px] hover:bg-[size:140%] hover:bg-[position:0%_50%] text-[16px] hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] flex items-center justify-center"
                >
                  {{ $t("common.addFile") }}
                </button>
              </div>

              <div class="w-full">
                <p
                  class="font-inter text-[#FFFFFF] font-normal md:text-[20px] md:leading-[20px] md:tracking-normal text-[14px] leading-[100%] tracking-[0%]"
                >
                  {{ $t("common.maxFileSize") }}
                </p>

                <div v-if="selectedFile" class="mt-2 flex items-center gap-3">
                  <p
                    class="max-w-[260px] truncate text-white/80 text-[14px] md:text-[16px]"
                  >
                    {{ selectedFile.name }}
                  </p>
                </div>

                <p v-else class="mt-2 text-white/40 text-[13px] md:text-[14px]">
                  {{ $t("common.noFileSelected") }}
                </p>
              </div>
            </div>
          </div>

          <div class="form-right will-change-transform">
            <h3
              class="font-normal md:text-[24px] md:pb-[30px] pt-[40px] md:pt-0 pb-[30px] md:leading-[24px] text-[#FFFFFF] md:tracking-normal font-['Inter'] text-[20px] leading-[100%] tracking-[0%]"
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
                class="w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[60px] text-white placeholder:text-white/50 placeholder:font-['Inter'] outline-none transition focus:border-[#03cb00] focus:ring-0"
              />

              <input
                v-model="jobTitleVal"
                type="text"
                required
                autocapitalize="words"
                autocomplete="organization-title"
                :placeholder="jobTitlePh"
                :aria-label="jobTitlePh"
                :maxlength="fieldLimits.jobTitle"
                class="w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[60px] text-white placeholder:text-white/50 placeholder:font-['Inter'] outline-none transition focus:border-[#03cb00] focus:ring-0"
              />

              <input
                v-model="companyVal"
                type="text"
                required
                autocapitalize="words"
                autocomplete="organization"
                :placeholder="companyPh"
                :aria-label="companyPh"
                :maxlength="fieldLimits.company"
                class="w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[60px] text-white placeholder:text-white/50 placeholder:font-['Inter'] outline-none transition focus:border-[#03cb00] focus:ring-0"
              />

              <input
                v-model="phoneVal"
                type="tel"
                required
                inputmode="tel"
                autocomplete="tel"
                :placeholder="phonePh"
                :aria-label="phonePh"
                :maxlength="fieldLimits.phone"
                class="w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[60px] text-white placeholder:text-white/50 placeholder:font-['Inter'] outline-none transition focus:border-[#03cb00] focus:ring-0"
              />

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
                class="w-full rounded-lg border border-white/10 bg-black/60 px-4 h-[60px] text-white placeholder:text-white/50 placeholder:font-['Inter'] outline-none transition focus:border-[#03cb00] focus:ring-0"
              />
            </div>
          </div>
        </form>

        <p
          class="form-agree will-change-transform font-inter text-[#FFFFFF] font-normal md:text-[20px] md:leading-[20px] mb-[29px] mt-[48px] md:tracking-normal text-[14px] leading-[100%] tracking-[0%]"
        >
          {{ $t("contacts.form.agreement") }}
        </p>

        <button
          type="submit"
          form="contact-request-form"
          :disabled="sending"
          class="form-send will-change-transform capitalize md:w-[236px] w-[197px] mb-[6px] text-[#FFFFFF] md:h-[60px] h-[50px] rounded-[32px] font-font1 font-normal md:text-[19.57px] leading-[19.57px] tracking-normal text-center align-middle disabled:opacity-60 disabled:cursor-not-allowed font-['Inter'] bg-[url('/home/Component3.png')] bg-[size:120%] bg-[position:100%_50%] transition-[background-position,background-size,box-shadow] duration-1000 ease-[cubic-bezier(.4,0,.2,1)] hover:bg-[size:140%] text-[16px] hover:bg-[position:0%_50%] hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] flex items-center justify-center"
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
