<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import NewsSlider from "~/components/Newsslug/NewsSlider.vue";

const root = ref<HTMLElement | null>(null);
let ctx: any = null;

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    const el = root.value;
    if (!el) return;

    const title = el.querySelector<HTMLElement>(".hero-title");
    const text = el.querySelector<HTMLElement>(".hero-text");

    if (title) {
      gsap.fromTo(
        title,
        { x: -160, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          delay: 1,
          ease: "power3.out",
        }
      );
    }

    if (text) {
      gsap.fromTo(
        text,
        { x: 160, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          delay: 1,
          ease: "power3.out",
        }
      );
    }
  });
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div ref="root">
    <div class="bg-black relative overflow-hidden">
      <div class="edge-gradient edge-gradient-left edge-gradient-strong"></div>
      <div class="edge-gradient edge-gradient-right edge-gradient-strong"></div>

      <div class="relative z-10 bg-black">
        <div
          class="bg bg-[url('/home/Ellipse.png')] md:pt-[60px] pt-[30px] bg-contain bg-top bg-no-repeat m]"
        >
          <Header />

          <h1
            class="hero-title text-white max-w-[1000px] md:pt-0 pt-[120px] md:mt-[159px] mt-[37px] md:pb-[50px] pb-[30px] mx-auto font-normal md:mb-[77px] md:text-[62px] md:leading-[62px] md:tracking-normal text-[40px] leading-[120%] tracking-[0%] text-center"
          >
            {{ $t("newsPage.title") }}
          </h1>
        </div>

        <NewsMain />
        <div class="md:containerr">
          <NewsSlider />
        </div>
      </div>
      <Footer />
    </div>
  </div>
</template>
