<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";

type AppLocale = "ru" | "en";

const root = ref<HTMLElement | null>(null);
let ctx: any = null;

const { t, locale } = useI18n<{ message: any }, AppLocale>();
const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

type ContactsPageGql = {
  data?: {
    contactsPage?: {
      section1?: {
        title?: string;
        location?: { title?: string; location?: string };
        workingHours?: { title?: string; hour?: string };
        contactInfo?: { phoneNumber?: string; websiteUrl?: string };
        note?: { title?: string; text?: string };
        downloadBrief?: { text?: string; file?: { url?: string } };
      };
    };
  };
};

type FooterSocialsRes = {
  data?: {
    footer?: {
      socialMedia?: {
        telegramLink?: string | null;
        instagramLink?: string | null;
        behanceLink?: string | null;
        linkedinLink?: string | null;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const config = useRuntimeConfig();
const GRAPHQL_URL = (config.public.graphqlUrl as string) || "";

const CONTACTS_PAGE_QUERY = `
query ContactsPage($locale: I18NLocaleCode) {
  contactsPage(locale: $locale) {
    section1 {
      title
      location { title location }
      workingHours { title hour }
      contactInfo { phoneNumber websiteUrl }
      note { title text }
      downloadBrief {
        text
        file { url }
      }
    }
  }
}
`;

const FOOTER_SOCIALS_QUERY = `
query FooterSocials($locale: I18NLocaleCode) {
  footer(locale: $locale) {
    socialMedia {
      telegramLink
      instagramLink
      behanceLink
      linkedinLink
    }
  }
}
`;

const { data: gqlRes } = await useAsyncData<ContactsPageGql>(
  () => `contacts-page-${gqlLocale.value}`,
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

const { data: footerGql } = await useAsyncData<FooterSocialsRes>(
  () => `footer-socials-contacts-${gqlLocale.value}`,
  async () => {
    if (!GRAPHQL_URL) return {};
    return await $fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { query: FOOTER_SOCIALS_QUERY, variables: { locale: gqlLocale.value } },
    });
  },
  { watch: [gqlLocale] }
);

const section1 = computed(() => gqlRes.value?.data?.contactsPage?.section1);

const addressTitle = computed(
  () => section1.value?.location?.title || t("contacts.addressTitle")
);
const addressText = computed(
  () => section1.value?.location?.location || t("contacts.addressText")
);

const workTitle = computed(
  () => section1.value?.workingHours?.title || t("contacts.workTitle")
);
const workHours = computed(
  () => section1.value?.workingHours?.hour || t("contacts.workHours")
);

const contactInfoTitle = computed(() => t("contacts.contactInfoTitle"));
const phoneNumber = computed(
  () => section1.value?.contactInfo?.phoneNumber || "+998 (71) 200-12-34"
);
const websiteUrl = computed(
  () => section1.value?.contactInfo?.websiteUrl || "onebranding.uz"
);

const noteTitle = computed(() => section1.value?.note?.title || t("contacts.noteTitle"));
const noteText = computed(() => section1.value?.note?.text || t("contacts.noteText"));

const briefText = computed(
  () => section1.value?.downloadBrief?.text || t("contacts.briefText")
);

const briefFileUrl = computed(() => {
  const url = section1.value?.downloadBrief?.file?.url;
  if (!url) return "";
  if (!GRAPHQL_URL) return url;
  try {
    const origin = new URL(GRAPHQL_URL).origin;
    return url.startsWith("http") ? url : `${origin}${url}`;
  } catch {
    return url;
  }
});

const telegramLink = computed(
  () => footerGql.value?.data?.footer?.socialMedia?.telegramLink || ""
);
const instagramLink = computed(
  () => footerGql.value?.data?.footer?.socialMedia?.instagramLink || ""
);
const behanceLink = computed(
  () => footerGql.value?.data?.footer?.socialMedia?.behanceLink || ""
);
const linkedinLink = computed(() => {
  const raw = footerGql.value?.data?.footer?.socialMedia?.linkedinLink || "";
  if (!raw) return "";
  return raw.startsWith("http") ? raw : `https://${raw.replace(/^\/+/, "")}`;
});

const onDownloadBrief = () => {
  if (!briefFileUrl.value) return;
  window.open(briefFileUrl.value, "_blank");
};

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
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
  }, root.value as any);
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
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
              :href="telegramLink || undefined"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/Contacts/Vector(7).png" alt="" />
            </a>
            <a
              class="instagream"
              :href="instagramLink || undefined"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/Contacts/Vector(8).png" alt="" />
            </a>

            <a
              class="be"
              :href="behanceLink || undefined"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/Contacts/wpf_behance.png" alt="" />
            </a>
            <a
              class="linkedIn"
              :href="linkedinLink || undefined"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/Contacts/Group(1).png" alt="" />
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
