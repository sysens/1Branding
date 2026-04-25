<script setup lang="ts">
import Spinner from "~/components/Spinner.vue";
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";

let ctx: any = null;

const loading = ref(true);

const rootRef = ref<HTMLElement | null>(null);
const productsRef = ref<HTMLElement | null>(null);
const secondRef = ref<HTMLElement | null>(null);
const mainProductRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  if (!rootRef.value) {
    loading.value = false;
    return;
  }

  ctx = gsap.context(() => {
    const products = productsRef.value;
    const second = secondRef.value;
    const mainProduct = mainProductRef.value;

    if (products) {
      gsap.fromTo(
        products,
        { x: -160, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, delay: 0.6, ease: "power3.out" }
      );
    }

    if (second) {
      gsap.fromTo(
        second,
        { x: 160, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, delay: 0.6, ease: "power3.out" }
      );
    }

    if (mainProduct) {
      gsap.fromTo(
        mainProduct,
        { x: 0, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, delay: 1.2, ease: "power3.out" }
      );
    }
  }, rootRef);

  loading.value = false;
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div ref="rootRef" class="relative">
    <Spinner v-if="loading" src="/General/IMG_5528.mp4" :size="542" />

    <div class="edge-gradient edge-gradient-left edge-gradient-soft"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-soft"></div>

    <div class="bg-black relative z-10">
      <div class="bg bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat">
        <div class="pt-[30px] md:pt-[60px] m]">
          <Header />
        </div>

        <div ref="productsRef" class="products">
          <h1
            class="font-normal text-center px-[20px] md:px-0 md:pt-[115px] pt-[137px] text-[#FFFFFF] md:text-[62px] md:leading-[100%] md:tracking-[0] text-[40px] leading-[120%] tracking-normal"
          >
            {{ $t("projectsPage.title") }}
          </h1>

          <h2
            class="text-[#FFFFFF] px-[20px] md:px-0 pt-[29px] font-light md:text-[16px] md:leading-[28px] md:tracking-[0] text-[14px] leading-[120%] tracking-normal text-center font-['Poppins','Inter',sans-serif]"
          >
            {{ $t("projectsPage.subtitle") }}
          </h2>
        </div>

        <div ref="secondRef" class="second"></div>
        <div ref="mainProductRef" class="mainProduct"></div>
      </div>

      <ProjectsMarquee />
    </div>
  </div>
</template>
