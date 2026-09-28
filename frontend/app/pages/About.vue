<script setup lang="ts">
import { computed } from "vue";
import Header from "~/components/Header.vue";
import Footer from "~/components/Footer.vue";
import BigPhoto from "~/components/About/BigPhoto.vue";
import ThreePic from "~/components/About/ThreePic.vue";
import TwoFlex from "~/components/About/TwoFlex.vue";
import ThreeLayer from "~/components/home/threeLayerSlug.vue";

const { t } = useI18n();

const cmsSeo = await useCmsSeo("aboutPage");
const localePath = useLocalePath();
usePageSeo({
  title: computed(() => cmsSeo.title.value || t("seo.about.title")),
  description: computed(() => cmsSeo.description.value || t("seo.about.description")),
  breadcrumbs: computed(() => [{ name: t("nav.about"), path: localePath("/About") }]),
});
</script>

<template>
  <div
    class="relative min-h-screen overflow-x-hidden overscroll-y-none bg-black"
  >
    <div class="edge-gradient edge-gradient-left edge-gradient-soft" />
    <div class="edge-gradient edge-gradient-right edge-gradient-soft" />

    <div>
      <div
        class="vg relative z-10 bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat pt-[30px] md:pt-[60px]"
      >
        <Header />

        <h1
          class="products intro-slide-in px-4 pt-[137px] pb-[30px] text-center text-[40px] font-normal leading-[100%] tracking-normal text-[#FFFFFF] md:pt-[127px] md:pb-[60px] md:text-[50px] md:leading-[100%]"
        >
          {{ $t("aboutPage.title") }}
        </h1>
      </div>
    </div>

    <div>
      <div class="relative top-10">
        <BigPhoto />
      </div>

      <div class="relative bottom-7">
        <TwoFlex />
      </div>

      <ThreePic />
    </div>

    <h2
      class="px-4 pt-[100px] pb-[30px] text-center text-[40px] font-normal uppercase leading-[100%] tracking-[0] text-white md:pt-[130px] md:pb-20 md:text-[62px]"
    >
      {{ $t("home.freshProjects") }}
    </h2>

    <ThreeLayer />

    <Footer />
  </div>
</template>

<style scoped></style>
