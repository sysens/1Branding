<script setup lang="ts">
import Productsmain from "~/components/Products/Productsmain.vue";
import { onMounted, onBeforeUnmount, nextTick } from "vue";
let ctx: any = null;

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    const main = document.querySelector<HTMLElement>(".products");
    const second = document.querySelector<HTMLElement>(".second");
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
      }
    );
    gsap.fromTo(
      second,
      { x: 160, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        delay: 1,
        ease: "power3.out",
      }
    );
  });
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div class="bg-black relative overflow-x-hidden">
    <div class="edge-gradient edge-gradient-left edge-gradient-strong"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"></div>
    <div>
      <div class="relative z-10">
        <div class="bg bg-[url('/home/Ellipse.png')] bg-cover bg-center bg-no-repeat">
          <div class="md:pt-[60px] pt-[30px]">
            <Header />
          </div>

          <div class="px-[20px] md:px-0 containerr">
            <h1
              class="font-normal text-center md:pt-[115px] pt-[37px] text-[#FFFFFF] text-[62px] leading-[100%] tracking-[0] products"
            >
              {{ $t("productsPage.title") }}
            </h1>

            <h2
              class="pb-[30px] text-[#FFFFFF] pt-[29px] text-center font-light text-[16px] leading-[28px] tracking-[0] second"
            >
              {{ $t("productsPage.subtitle") }}
            </h2>
          </div>
        </div>

        <div class="second containerr">
          <Productsmain />
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>
