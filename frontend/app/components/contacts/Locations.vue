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
      <address class="not-italic md:flex gap-[11.8125rem]">
        <div class="flex-1">
          <h2 class="type-h5 type-caps md:pb-[2rem] pb-[1.25rem] text-[#FFFFFF]">
            {{ t("contacts.addressTitle") }}
          </h2>
          <p class="type-lead text-[#8f8f8f] md:pb-[5rem] pb-[2.5rem]">
            <a :href="COMPANY_MAP_URL" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">{{ address }}</a>
          </p>

          <h2 class="type-h5 type-caps md:pb-[2rem] pb-[1.25rem] text-[#FFFFFF]">
            {{ t("contacts.contactInfoTitle") }}
          </h2>
          <p class="flex items-center gap-[0.625rem] pb-[0.9375rem]">
            <img src="/Contacts/iconsax-call.png" alt="" width="24" height="24">
            <a :href="`tel:${phone.e164}`" class="type-lead text-[#8f8f8f] hover:text-white transition-colors">{{ phone.display }}</a>
          </p>
          <p class="flex items-center gap-[0.625rem] md:pb-[5.4375rem] pb-[2.5rem]">
            <img src="/Contacts/sms.png" alt="" width="24" height="24">
            <a :href="`https://${website}/`" class="type-lead text-[#8f8f8f] hover:text-white transition-colors">{{ website }}</a>
          </p>
        </div>

        <div class="flex-1">
          <h2 class="type-h5 type-caps md:pb-[2rem] pb-[1.25rem] text-[#FFFFFF]">
            {{ t("contacts.workTitle") }}
          </h2>
          <p class="type-lead text-[#8f8f8f] md:pb-[5rem] pb-[2.5rem]">
            {{ t("contacts.workHours") }}
          </p>

          <template v-if="profiles.length">
            <h2 class="type-h5 type-caps md:pb-[2rem] pb-[1.25rem] text-[#FFFFFF]">
              {{ t("common.socials") }}
            </h2>
            <div class="md:pb-[6.9375rem] pb-[2.5rem] flex gap-[1.125rem]">
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

      <div class="md:flex gap-[11.8125rem]">
        <div class="flex-1">
          <h2 class="type-h5 type-caps md:pb-[2rem] pb-[1.25rem] text-[#FFFFFF]">
            {{ t("contacts.noteTitle") }}
          </h2>
          <p class="type-lead type-measure text-[#8f8f8f] md:pb-0 pb-[2.5rem]">
            {{ t("contacts.noteText") }}
          </p>
        </div>

        <div class="flex-1">
          <p class="type-lead type-measure text-[#8f8f8f] pb-[1.875rem]">
            {{ t("contacts.briefText") }}
          </p>
          <!-- Only once the CMS has a brief file: a button that can never be
               pressed only showed up dimmed. -->
          <button
            v-if="briefFileUrl"
            type="button"
            class="ob-button"
            @click="onDownloadBrief"
          >
            {{ $t("common.downloadBrief") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
