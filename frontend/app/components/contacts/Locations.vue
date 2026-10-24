<script setup lang="ts">
import { ref, computed } from "vue";
import { COMPANY, COMPANY_ADDRESS, COMPANY_MAP_URL, companyProfiles, type SocialKind } from "~/utils/company";
import { toSiteLocale } from "~/utils/locales";

const root = ref<HTMLElement | null>(null);

const { t, locale } = useI18n();
const GRAPHQL_URL = useGraphqlUrl();

const { own: contactsPage, fallback: fallbackContactsPage } = await useContactsPage();

const { socialMedia } = await useFooterSocials();

const section1 = computed(() => contactsPage.value?.section1);
// Only the brief file comes from the CMS (the English entry off English): the
// address, hours and phone are the company's own details (utils/company.ts),
// and the headings and notes are the page's copy in its language.
const fallbackSection1 = computed(() => fallbackContactsPage.value?.section1);

const address = computed(() => COMPANY_ADDRESS[toSiteLocale(locale.value)].full);
const phone = COMPANY.phone;
const website = COMPANY.website;

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

const ICONS: Record<SocialKind, { src: string; label: string }> = {
  telegram: { src: "/Contacts/vector-7.png", label: "Telegram" },
  instagram: { src: "/Contacts/vector-8.png", label: "Instagram" },
  behance: { src: "/Contacts/wpf_behance.png", label: "Behance" },
  linkedin: { src: "/Contacts/group-1.png", label: "LinkedIn" },
};
// Only real company profiles get an icon (no links to a bare instagram.com).
const profiles = computed(() => companyProfiles(socialMedia.value).map((profile) => ({ ...profile, ...ICONS[profile.kind] })));

const onDownloadBrief = () => {
  if (!briefFileUrl.value) return;
  window.open(briefFileUrl.value, "_blank");
};

useGsapContext(root, ({ gsap }) => {
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
      <!-- The company's name, address and phone (NAP), marked up as contact
           details; the labels are h2s, the details plain text and links. -->
      <address class="not-italic md:flex gap-[189px]">
        <div class="flex-1">
          <h2 class="type-h5 type-caps md:pb-[32px] pb-[20px] text-[#FFFFFF]">
            {{ t("contacts.addressTitle") }}
          </h2>
          <p class="type-lead text-[#8f8f8f] md:pb-[80px] pb-[40px]">
            <a :href="COMPANY_MAP_URL" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">{{ address }}</a>
          </p>

          <h2 class="type-h5 type-caps md:pb-[32px] pb-[20px] text-[#FFFFFF]">
            {{ t("contacts.contactInfoTitle") }}
          </h2>
          <p class="flex items-center gap-[10px] pb-[15px]">
            <img src="/Contacts/iconsax-call.png" alt="" width="24" height="24">
            <a :href="`tel:${phone.e164}`" class="type-lead text-[#8f8f8f] hover:text-white transition-colors">{{ phone.display }}</a>
          </p>
          <p class="flex items-center gap-[10px] md:pb-[87px] pb-[40px]">
            <img src="/Contacts/sms.png" alt="" width="24" height="24">
            <a :href="`https://${website}/`" class="type-lead text-[#8f8f8f] hover:text-white transition-colors">{{ website }}</a>
          </p>
        </div>

        <div class="flex-1">
          <h2 class="type-h5 type-caps md:pb-[32px] pb-[20px] text-[#FFFFFF]">
            {{ t("contacts.workTitle") }}
          </h2>
          <p class="type-lead text-[#8f8f8f] md:pb-[80px] pb-[40px]">
            {{ t("contacts.workHours") }}
          </p>

          <template v-if="profiles.length">
            <h2 class="type-h5 type-caps md:pb-[32px] pb-[20px] text-[#FFFFFF]">
              {{ t("common.socials") }}
            </h2>
            <div class="md:pb-[111px] pb-[40px] flex gap-[18px]">
              <a
                v-for="profile in profiles"
                :key="profile.kind"
                :class="profile.kind"
                :aria-label="profile.label"
                :href="profile.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img :src="profile.src" alt="">
              </a>
            </div>
          </template>
        </div>
      </address>

      <div class="md:flex gap-[189px]">
        <div class="flex-1">
          <h2 class="type-h5 type-caps md:pb-[32px] pb-[20px] text-[#FFFFFF]">
            {{ t("contacts.noteTitle") }}
          </h2>
          <p class="type-lead type-measure text-[#8f8f8f] md:pb-0 pb-[40px]">
            {{ t("contacts.noteText") }}
          </p>
        </div>

        <div class="flex-1">
          <p class="type-lead type-measure text-[#8f8f8f] pb-[30px]">
            {{ t("contacts.briefText") }}
          </p>
          <button
            type="button"
            :disabled="!briefFileUrl"
            class="type-lead font-semibold w-[var(--button-w)] h-[var(--button-h)] whitespace-nowrap rounded-[32px] text-white capitalize bg-[url('/home/Component3.png')] bg-[size:120%] bg-[position:100%_50%] transition-[background-position,background-size,box-shadow] duration-1000 ease-[cubic-bezier(.4,0,.2,1)] hover:bg-[size:140%] hover:bg-[position:0%_50%] hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            @click="onDownloadBrief"
          >
            {{ $t("common.downloadBrief") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
