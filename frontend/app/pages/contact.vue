<script setup lang="ts">
// Ends with its own "Join the movement" block instead of the site footer.
import { computed, onMounted, nextTick, watch } from "vue";
import ConnectMarquee from "~/components/contacts/ConnectMarquee.vue";
import ContactHero from "~/components/contacts/ContactHero.vue";
import LeadForm from "~/components/contacts/LeadForm.vue";
import ScrollEnd from "~/components/contacts/ScrollEnd.vue";
import Locations from "~/components/contacts/Locations.vue";
import MovementFooter from "~/components/contacts/MovementFooter.vue";

definePageMeta({ footer: false });


const { t } = useI18n();

const cmsSeo = await useCmsSeo("contactsPage");
const localePath = useLocalePath();
usePageSeo({
  title: computed(() => cmsSeo.title.value || t("seo.contacts.title")),
  description: computed(() => cmsSeo.description.value || t("seo.contacts.description")),
  breadcrumbs: computed(() => [{ name: t("nav.contacts"), path: localePath("/contact") }]),
});

const nuxtApp = useNuxtApp();

const getLenis = () => {
  return nuxtApp.$lenis;
};

const raf2 = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

const refreshLenis = async () => {
  if (!import.meta.client) return;
  await nextTick();
  await raf2();
  const lenis = getLenis();
  if (!lenis) return;
  lenis.resize?.();
};

const stabilizeAfterAssets = async () => {
  if (!import.meta.client) return;

  const fontsReady =
    "fonts" in document
      ? document.fonts.ready.catch(() => null)
      : Promise.resolve(null);

  const imgs = Array.from(document.images || []);
  const imagesReady = Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve(null);
      return new Promise((res) => {
        const done = () => res(null);
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    })
  );

  await Promise.race([
    Promise.all([fontsReady, imagesReady]),
    new Promise((r) => setTimeout(r, 1200)),
  ]);

  await refreshLenis();
};

// /contact#contact-request (a link opened in a new tab, an old bookmark) opens
// the request modal (app.vue mounts it; links on the site open it in place).
const route = useRoute();
const { open: openContactModal } = useContactModal();
const openFromHash = () => {
  if (route.hash !== "#contact-request") return;
  // On a first visit the loader (components/PageLoader.vue) is still playing: open after it.
  if (import.meta.client && document.documentElement.classList.contains("ob-loading")) {
    window.addEventListener("ob:loader-complete", openContactModal, { once: true });
    return;
  }
  openContactModal();
};
watch(() => route.hash, openFromHash);

// The title slide-in is the CSS .intro-slide-in class; only Lenis needs to
// re-measure once fonts and images have settled.
onMounted(async () => {
  openFromHash();
  await nextTick();
  await raf2();
  await refreshLenis();
  await stabilizeAfterAssets();
});
</script>

<template>
  <div class="relative overflow-x-hidden overscroll-y-none">
    <div class="edge-gradient edge-gradient-left edge-gradient-soft"/>
    <div class="edge-gradient edge-gradient-right edge-gradient-soft"/>

    <div class="bg-black relative">
      <div>
        <!-- The page's own title, for screen readers and search engines; the
             call to action under the clock is what is seen at the top. -->
        <h1 class="sr-only">{{ $t("contacts.title") }}</h1>

        <ContactHero />

        <ConnectMarquee />

        <!-- The request form on the page itself (the button above opens it as a modal). -->
        <section class="contact-lead" aria-labelledby="contact-lead-title">
          <h2 id="contact-lead-title" v-blur-reveal class="contact-lead__title">{{ $t("leadForm.title") }}</h2>
          <p v-rise class="contact-lead__text">{{ $t("leadForm.text") }}</p>
          <LeadForm inline />
        </section>

        <div class="md:px-30px px-[1.25rem] containerr">
          <Locations />
        </div>

        <ScrollEnd />
      </div>

      <MovementFooter />
    </div>
  </div>
</template>

<style scoped>
.contact-lead {
  position: relative;
  z-index: 1;
  padding: clamp(4rem, 8vw, 7rem) 1.25rem clamp(3rem, 6vw, 5rem);
  color: #fff;
  text-align: center;
}

.contact-lead__title {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: var(--type-h3-size);
  font-weight: 600;
  line-height: var(--type-h3-lh);
  letter-spacing: var(--type-h3-ls);
}

.contact-lead__text {
  max-width: 34em;
  margin: 1rem auto 2.25rem;
  color: #c9cbce;
  font-family: var(--app-font-sans);
  font-size: var(--type-lead-size);
  line-height: var(--type-lead-lh);
}
</style>
