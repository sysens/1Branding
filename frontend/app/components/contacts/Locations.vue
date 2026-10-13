<script setup lang="ts">
import { ref, computed } from "vue";

type AppLocale = "ru" | "en";

const root = ref<HTMLElement | null>(null);

const { t, locale } = useI18n();
const GRAPHQL_URL = useGraphqlUrl();

const { own: contactsPage, fallback: fallbackContactsPage } = await useContactsPage();

const { socialMedia } = await useFooterSocials();

const section1 = computed(() => contactsPage.value?.section1);
// Headings and notes keep their i18n copy when the locale has no entry; the
// contact details themselves (address, hours, phone, site, brief file) are the
// same in every language, so they come from the English entry instead.
const fallbackSection1 = computed(() => fallbackContactsPage.value?.section1);

const addressTitle = computed(
  () => section1.value?.location?.title || t("contacts.addressTitle")
);
const addressText = computed(
  () =>
    section1.value?.location?.location ||
    fallbackSection1.value?.location?.location ||
    t("contacts.addressText")
);

const workTitle = computed(
  () => section1.value?.workingHours?.title || t("contacts.workTitle")
);
const workHours = computed(
  () =>
    section1.value?.workingHours?.hour ||
    fallbackSection1.value?.workingHours?.hour ||
    t("contacts.workHours")
);

const contactInfoTitle = computed(() => t("contacts.contactInfoTitle"));
const phoneNumber = computed(
  () =>
    section1.value?.contactInfo?.phoneNumber ||
    fallbackSection1.value?.contactInfo?.phoneNumber ||
    // Same number as the footer, rather than a placeholder.
    "+998 93 560 80 00"
);
const websiteUrl = computed(
  () =>
    section1.value?.contactInfo?.websiteUrl ||
    fallbackSection1.value?.contactInfo?.websiteUrl ||
    "onebrandingworld.com"
);

const noteTitle = computed(() => section1.value?.note?.title || t("contacts.noteTitle"));
const noteText = computed(() => section1.value?.note?.text || t("contacts.noteText"));

const briefText = computed(
  () => section1.value?.downloadBrief?.text || t("contacts.briefText")
);

const briefFileUrl = computed(() => {
  const url =
    section1.value?.downloadBrief?.file?.url ||
    fallbackSection1.value?.downloadBrief?.file?.url;
  if (!url) return "";
  if (!GRAPHQL_URL) return url;
  try {
    const origin = new URL(GRAPHQL_URL).origin;
    return url.startsWith("http") ? url : `${origin}${url}`;
  } catch {
    return url;
  }
});

const telegramLink = computed(() => socialMedia.value?.telegramLink || "");
const instagramLink = computed(() => socialMedia.value?.instagramLink || "");
const behanceLink = computed(() => socialMedia.value?.behanceLink || "");
const linkedinLink = computed(() => {
  const raw = socialMedia.value?.linkedinLink || "";
  if (!raw) return "";
  return raw.startsWith("http") ? raw : `https://${raw.replace(/^\/+/, "")}`;
});

const onDownloadBrief = () => {
  if (!briefFileUrl.value) return;
  window.open(briefFileUrl.value, "_blank");
};

useGsapContext(root.value as any, ({ gsap }) => {
    const el = root.value;
    if (!el) return;

    const main = el.querySelector<HTMLElement>(".products");
    if (!main) return;

    gsap.fromTo(
      main,
      { x: -160, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        delay: 1,
        ease: "power3.out",
        clearProps: "transform",
      }
    );
  });

</script>

<template>
  <div ref="root">
    <div class="products">
      <div class="md:flex gap-[189px]">
        <div class="flex-1">
          <h3
            class="font-['Inter'] md:pb-[32px] pb-[20px] text-[#FFFFFF] font-normal md:text-[24px] md:leading-[1] md:tracking-normal text-[16px] leading-[100%] tracking-[0%]"
          >
            {{ addressTitle }}
          </h3>
          <p
            class="font-['Inter'] font-normal text-[#808080] md:pb-[80px] pb-[40px] text-[20px] leading-[1] tracking-normal"
          >
            {{ addressText }}
          </p>

          <h3
            class="md:pb-[32px] pb-[20px] font-['Inter'] text-[#FFFFFF] font-normal md:text-[24px] md:leading-[1] md:tracking-normal text-[16px] leading-[100%] tracking-[0%]"
          >
            {{ contactInfoTitle }}
          </h3>
          <div class="flex gap-[10px] pb-[15px]">
            <img src="/Contacts/iconsax-call.png" alt="" />
            <h2
              class="font-['Inter'] font-normal text-[#808080] text-[20px] leading-[1] tracking-normal"
            >
              {{ phoneNumber }}
            </h2>
          </div>
          <div class="flex gap-[10px] md:pb-[87px] pb-[40px]">
            <img src="/Contacts/sms.png" alt="" />
            <h2
              class="font-['Inter'] font-normal text-[#808080] text-[20px] leading-[1] tracking-normal"
            >
              {{ websiteUrl }}
            </h2>
          </div>
        </div>

        <div class="flex-1">
          <h3
            class="font-['Inter'] md:pb-[32px] pb-[20px] text-[#FFFFFF] font-normal md:text-[24px] md:leading-[1] md:tracking-normal text-[16px] leading-[100%] tracking-[0%]"
          >
            {{ workTitle }}
          </h3>
          <h2
            class="font-['Inter'] md:pb-[80px] pb-[40px] font-normal text-[#808080] text-[20px] leading-[1] tracking-normal"
          >
            {{ workHours }}
          </h2>

          <h3
            class="font-['Inter'] md:pb-[32px] pb-[20px] text-[#FFFFFF] font-normal md:text-[24px] md:leading-[1] md:tracking-normal text-[16px] leading-[100%] tracking-[0%]"
          >
            {{ $t("common.socials") }}
          </h3>
          <div class="md:pb-[111px] pb-[40px] flex gap-[18px]">
            <a
              class="telegram"
              aria-label="Telegram"
              :href="telegramLink || undefined"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/Contacts/vector-7.png" alt="" />
            </a>
            <a
              class="instagream"
              aria-label="Instagram"
              :href="instagramLink || undefined"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/Contacts/vector-8.png" alt="" />
            </a>

            <a
              class="be"
              aria-label="Behance"
              :href="behanceLink || undefined"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/Contacts/wpf_behance.png" alt="" />
            </a>
            <a
              class="linkedIn"
              aria-label="LinkedIn"
              :href="linkedinLink || undefined"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/Contacts/group-1.png" alt="" />
            </a>
          </div>
        </div>
      </div>

      <div class="md:flex gap-[189px]">
        <div class="flex-1">
          <h3
            class="font-['Inter'] md:pb-[32px] pb-[20px] text-[#FFFFFF] font-normal md:text-[24px] md:leading-[1] md:tracking-normal text-[16px] leading-[100%] tracking-[0%]"
          >
            {{ noteTitle }}
          </h3>
          <h2
            class="font-['Inter'] font-normal text-[#808080] text-[20px] leading-[1] tracking-normal md:pb-0 pb-[40px]"
          >
            {{ noteText }}
          </h2>
        </div>

        <div class="flex-1">
          <p
            class="font-['Inter'] font-normal pb-[30px] text-[#808080] text-[20px] leading-[1] tracking-normal"
          >
            {{ briefText }}
          </p>
          <button
            type="button"
            @click="onDownloadBrief"
            :disabled="!briefFileUrl"
            class="w-[236px] h-[60px] rounded-[32px] text-[16px] text-white font-normal md:text-[19.57px] leading-[19.57px] capitalize font-['Inter'] bg-[url('/home/Component3.png')] bg-[size:120%] bg-[position:100%_50%] transition-[background-position,background-size,box-shadow] duration-1000 ease-[cubic-bezier(.4,0,.2,1)] text-[16px] hover:bg-[size:140%] hover:bg-[position:0%_50%] hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {{ $t("common.downloadBrief") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
