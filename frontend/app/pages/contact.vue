<script setup lang="ts">
// Ends with its own "Join the movement" block instead of the site footer.
import { computed, onMounted, nextTick, watch } from "vue";
import ConnectMarquee from "~/components/contacts/ConnectMarquee.vue";
import ContactHero from "~/components/contacts/ContactHero.vue";
import ContactModal from "~/components/contacts/ContactModal.vue";
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

// Links from other pages go to /contact#contact-request: that opens the quick
// request modal (the form used to sit at that anchor).
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

        <div class="md:px-30px px-[1.25rem] containerr">
          <Locations />
        </div>

        <ScrollEnd />
      </div>

      <MovementFooter />
    </div>

    <ClientOnly><ContactModal /></ClientOnly>
  </div>
</template>
