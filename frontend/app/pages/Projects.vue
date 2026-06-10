<script setup lang="ts">
import Spinner from "~/components/Spinner.vue";
import { ref, onMounted, nextTick } from "vue";

const loading = ref(true);

const rootRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  await nextTick();
  loading.value = false;
});
</script>

<template>
  <div ref="rootRef" class="relative">
    <Spinner v-if="loading" :size="542" />

    <div class="edge-gradient edge-gradient-left edge-gradient-soft"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-soft"></div>

    <div class="bg-black relative z-10">
      <div class="bg bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat">
        <div class="pt-[30px] md:pt-[60px] m]">
          <Header />
        </div>

        <div class="products">
          <h1 class="projects-hero-title px-[20px] md:px-0 md:pt-[115px] pt-[137px]">
            {{ $t("projectsPage.title") }}
          </h1>

          <h2
            class="text-[#FFFFFF] px-[20px] md:px-0 pt-[29px] font-light md:text-[18px] md:leading-[30px] md:tracking-[0] text-[14px] leading-[140%] tracking-normal text-center font-['Poppins','Inter',sans-serif] max-w-[640px] mx-auto opacity-90"
          >
            {{ $t("projectsPage.subtitle") }}
          </h2>
        </div>
      </div>

      <ProjectsShowcase />

      <Footer />
    </div>
  </div>
</template>

<style scoped>
.projects-hero-title {
  text-align: center;
  font-weight: 500;
  font-size: clamp(3.4rem, 9vw, 8.5rem);
  line-height: 1.02;
  letter-spacing: -0.01em;
  background: linear-gradient(92deg, #03cb00 6%, #5fe92c 48%, #c8f531 92%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
