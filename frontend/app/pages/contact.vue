<script setup lang="ts">
// Ends with its own "Join the movement" block instead of the site footer.
import { computed, onMounted, nextTick } from "vue";
import Form from "~/components/contacts/Form.vue";
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

// The title slide-in is the CSS .intro-slide-in class; only Lenis needs to
// re-measure once fonts and images have settled.
onMounted(async () => {
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
        <div
          class="md:pt-[3.75rem] pt-[1.875rem] bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat"
        >

          <h1
            class="products intro-slide-in type-h1 text-[#FFFFFF] md:pt-[6.5625rem] pt-[7.375rem] md:pb-[5.1875rem] pb-[3.375rem] text-center"
          >
            {{ $t("contacts.title") }}
          </h1>
        </div>

        <div class="md:px-30px px-[2.5rem] containerr">
          <Locations />
          <div id="contact-request" class="scroll-mt-32"><Form /></div>
        </div>
      </div>

      <MovementFooter />
    </div>
  </div>
</template>
