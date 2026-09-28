<script setup lang="ts">
import Spinner from "~/components/Spinner.vue";

import Form from "~/components/Contacts/Form.vue";
import Locations from "~/components/Contacts/Locations.vue";
import MovementFooter from "~/components/Contacts/MovementFooter.vue";

import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import type { gsap } from "gsap";

const { t } = useI18n();

const loading = ref(true);

const cmsSeo = await useCmsSeo("contactsPage");
const localePath = useLocalePath();
usePageSeo({
  title: computed(() => cmsSeo.title.value || t("seo.contacts.title")),
  description: computed(() => cmsSeo.description.value || t("seo.contacts.description")),
  breadcrumbs: computed(() => [{ name: t("nav.contacts"), path: localePath("/ContactPage") }]),
});

let ctx: gsap.Context | null = null;
const nuxtApp = useNuxtApp();

const rootRef = ref<HTMLElement | null>(null);
const titleRef = ref<HTMLElement | null>(null);

const getLenis = () => {
  return nuxtApp.$lenis;
};

const raf2 = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

const refreshLenis = async () => {
  if (!process.client) return;
  await nextTick();
  await raf2();
  const lenis = getLenis();
  if (!lenis) return;
  lenis.resize?.();
};

const stabilizeAfterAssets = async () => {
  if (!process.client) return;

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

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  if (!rootRef.value) {
    loading.value = false;
    await nextTick();
    await raf2();
    await refreshLenis();
    await stabilizeAfterAssets();
    return;
  }

  ctx = gsap.context(() => {
    if (!titleRef.value) return;

    gsap.fromTo(
      titleRef.value,
      { x: -160, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        delay: 0.6,
        ease: "power3.out",
      }
    );
  }, rootRef);

  loading.value = false;

  await nextTick();
  await raf2();
  await refreshLenis();
  await stabilizeAfterAssets();
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div ref="rootRef" class="relative overflow-x-hidden overscroll-y-none">
    <Spinner
      v-if="loading"
      :size="542"
      class="fixed inset-0 z-[9999] pointer-events-none"
    />

    <div class="edge-gradient edge-gradient-left edge-gradient-soft"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-soft"></div>

    <div class="bg-black relative">
      <div>
        <div
          class="bg bg md:pt-[60px] pt-[30px] bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat m]"
        >
          <Header />

          <h1
            ref="titleRef"
            class="products font-normal text-[#FFFFFF] md:text-[62px] md:pt-[105px] pt-[118px] md:pb-[83px] pb-[54px] md:leading-[1] md:tracking-normal text-center text-[40px] leading-[100%] tracking-[0%]"
          >
            {{ $t("contacts.title") }}
          </h1>
        </div>

        <div class="md:px-30px px-[40px] containerr">
          <Locations />
          <div id="contact-request" class="scroll-mt-32"><Form /></div>
        </div>
      </div>

      <MovementFooter />
    </div>
  </div>
</template>
