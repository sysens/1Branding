<script setup lang="ts">
import { computed } from "vue";
import { COMPANY, COMPANY_ADDRESS, COMPANY_MAP_URL, CONTACT_PAGE_LINKS } from "~/utils/company";
import { toSiteLocale } from "~/utils/locales";
import OfficeMap from "./OfficeMap.vue";
import VelarisGradient from "~/components/ui/VelarisGradient.vue";

const { t, locale } = useI18n();
const GRAPHQL_URL = useGraphqlUrl();

const { own: contactsPage, fallback: fallbackContactsPage } = await useContactsPage();

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

// Behance and Awwwards, in that order (utils/company.ts). A profile without an
// address yet is shown as a name only, not a link.
const profiles = CONTACT_PAGE_LINKS;

const onDownloadBrief = () => {
  if (!briefFileUrl.value) return;
  window.open(briefFileUrl.value, "_blank");
};
</script>

<template>
  <div class="contact-hub">
   <!-- The profiles and the office sit on the same green living light as the
        landing's "Brands that trust us" (ui/VelarisGradient), full width and
        faded out at the top and the bottom, so it has no edge. -->
   <div class="contact-glow">
    <div class="contact-glow__backdrop" aria-hidden="true">
      <VelarisGradient :intensity="0.36" />
    </div>

    <!-- The company's profiles, one row each: name on the left, an arrow out on the right. -->
    <nav v-if="profiles.length" v-rise class="contact-panel contact-links" :aria-label="t('contacts.linksTitle')">
      <component
        :is="profile.url ? 'a' : 'div'"
        v-for="profile in profiles"
        :key="profile.key"
        v-bind="profile.url ? { href: profile.url, target: '_blank', rel: 'noopener noreferrer' } : {}"
        class="contact-links__row"
        :class="{ 'is-pending': !profile.url }"
      >
        <span class="contact-links__name">{{ profile.label }}</span>
        <svg class="contact-links__arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M4 12L12 4M5.5 4H12V10.5" />
        </svg>
      </component>
    </nav>

    <!-- The office: title on the left, the words and the details on the right.
         The company's name, address and phone (NAP) are marked up as contact
         details; the labels are plain terms, the details text and links. -->
    <!-- A div with a region role, not a <section>: the reveal chain
         (plugins/blur-reveal.ts) treats a <section> as a group of its own, and
         would never reveal the section element itself. -->
    <div v-rise role="region" class="contact-panel contact-office" aria-labelledby="contact-office-title">
      <h2 id="contact-office-title" v-blur-reveal class="contact-office__title">{{ t("contacts.welcomeTitle") }}</h2>

      <div class="contact-office__body">
        <p class="type-lead contact-office__lead">{{ t("contacts.welcomeText") }}</p>

        <address class="contact-office__details">
          <div class="contact-office__item">
            <h3 class="contact-office__label">{{ t("contacts.addressTitle") }}</h3>
            <p><a :href="COMPANY_MAP_URL" target="_blank" rel="noopener noreferrer">{{ address }}</a></p>
          </div>

          <div class="contact-office__item">
            <h3 class="contact-office__label">{{ t("contacts.workTitle") }}</h3>
            <p>{{ t("contacts.workHours") }}</p>
          </div>

          <div class="contact-office__item">
            <h3 class="contact-office__label">{{ t("contacts.contactInfoTitle") }}</h3>
            <p><a :href="`tel:${phone.e164}`">{{ phone.display }}</a></p>
            <p><a :href="`https://${website}/`">{{ website }}</a></p>
          </div>

          <div class="contact-office__item">
            <h3 class="contact-office__label">{{ t("contacts.noteTitle") }}</h3>
            <p>{{ t("contacts.noteText") }}</p>
          </div>
        </address>

        <!-- Only once the CMS has a brief file: a button that can never be
             pressed only showed up dimmed. -->
        <button v-if="briefFileUrl" type="button" class="ob-button contact-office__brief" @click="onDownloadBrief">
          {{ $t("common.downloadBrief") }}
        </button>
      </div>
    </div>
   </div>

    <OfficeMap v-rise />
  </div>
</template>

<style scoped>
.contact-hub {
  display: grid;
  gap: 1rem;
  padding-block: clamp(1.5rem, 3vw, 3rem) clamp(2.5rem, 5vw, 5rem);
}

/* The profiles and the office share one stretch of green light, with no card
   edges. The light is a full-width layer that reaches well above and below the
   two blocks and is faded out to the black page over its top and bottom
   quarter (the same eased fade as the landing's clients section), so nothing
   cuts across it. */
.contact-glow {
  position: relative;
  isolation: isolate;
  display: grid;
  gap: clamp(1.5rem, 3vw, 3rem);
  padding-block: clamp(2rem, 4vw, 3.5rem);
}

.contact-glow__backdrop {
  position: absolute;
  z-index: -1;
  top: calc(-1 * clamp(8rem, 16vw, 15rem));
  bottom: calc(-1 * clamp(8rem, 16vw, 15rem));
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  pointer-events: none;
  /* Until the WebGL light is up (or without WebGL), soft green glows. */
  background:
    radial-gradient(ellipse 60% 38% at 78% 30%, rgb(0 170 80 / 0.34), transparent 70%),
    radial-gradient(ellipse 34% 40% at 6% 60%, rgb(0 130 60 / 0.26), transparent 70%),
    radial-gradient(ellipse 80% 30% at 40% 92%, rgb(0 90 40 / 0.24), transparent 70%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgb(0 0 0 / 0.06) 5%, rgb(0 0 0 / 0.2) 10%, rgb(0 0 0 / 0.45) 16%, rgb(0 0 0 / 0.72) 22%, rgb(0 0 0 / 0.9) 28%, #000 36%, #000 64%, rgb(0 0 0 / 0.9) 72%, rgb(0 0 0 / 0.72) 78%, rgb(0 0 0 / 0.45) 84%, rgb(0 0 0 / 0.2) 90%, rgb(0 0 0 / 0.06) 95%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, rgb(0 0 0 / 0.06) 5%, rgb(0 0 0 / 0.2) 10%, rgb(0 0 0 / 0.45) 16%, rgb(0 0 0 / 0.72) 22%, rgb(0 0 0 / 0.9) 28%, #000 36%, #000 64%, rgb(0 0 0 / 0.9) 72%, rgb(0 0 0 / 0.72) 78%, rgb(0 0 0 / 0.45) 84%, rgb(0 0 0 / 0.2) 90%, rgb(0 0 0 / 0.06) 95%, transparent 100%);
}

/* No card: the blocks sit straight on the light, lined up with the map's edges. */
.contact-panel {
  position: relative;
}

/* Profiles. */
.contact-links {
  display: grid;
}

.contact-links__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: clamp(1.1rem, 2vw, 1.6rem);
  border-bottom: 1px solid rgb(255 255 255 / 0.14);
  color: #fff;
  text-decoration: none;
  transition: color 0.3s ease, padding 0.3s ease;
}

.contact-links__row:last-child {
  border-bottom: 0;
}

.contact-links__name {
  font-family: var(--app-font-display);
  font-size: var(--type-h4-size);
  font-weight: 600;
  line-height: var(--type-h4-lh);
  letter-spacing: var(--type-h4-ls);
}

.contact-links__arrow {
  flex: none;
  width: clamp(1.1rem, 1.6vw, 1.5rem);
  height: auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: square;
  transition: transform 0.3s ease;
}

a.contact-links__row:hover,
a.contact-links__row:focus-visible {
  color: #20e848;
}

a.contact-links__row:hover .contact-links__arrow,
a.contact-links__row:focus-visible .contact-links__arrow {
  transform: translate(0.2rem, -0.2rem);
}

/* A profile whose address is not in yet: the name, quiet arrow, no link. */
.contact-links__row.is-pending .contact-links__arrow {
  opacity: 0.35;
}

/* The office. */
.contact-office {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  padding-block: clamp(1.5rem, 4vw, 4rem);
}

.contact-office__title {
  margin: 0;
  align-self: start;
  color: #fff;
  font-family: var(--app-font-display);
  font-size: var(--type-h2-size);
  font-weight: 600;
  line-height: var(--type-h2-lh);
  letter-spacing: var(--type-h2-ls);
}

.contact-office__body {
  display: grid;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  align-content: start;
}

.contact-office__lead {
  margin: 0;
  max-width: 34em;
  color: #c9ccce;
}

.contact-office__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1.5rem, 3vw, 2.5rem) clamp(1.5rem, 3vw, 3rem);
  font-style: normal;
}

.contact-office__label {
  margin: 0 0 0.6rem;
  color: #20e848;
  font-family: var(--app-font-sans);
  font-size: var(--type-label-size);
  font-weight: 600;
  line-height: var(--type-label-lh);
  letter-spacing: var(--type-label-ls);
  text-transform: uppercase;
}

.contact-office__item p {
  margin: 0;
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
}

.contact-office__item p + p {
  margin-top: 0.25rem;
}

.contact-office__item a {
  color: inherit;
  text-decoration: none;
  transition: color 0.3s ease;
}

.contact-office__item a:hover,
.contact-office__item a:focus-visible {
  color: #20e848;
}

.contact-office__brief {
  justify-self: start;
}

@media (max-width: 1023px) {
  .contact-office {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 639px) {
  .contact-panel {
    border-radius: 1.25rem;
  }

  .contact-office__details {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
