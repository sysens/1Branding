<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import NewsHero from "~/components/Newsslug/NewsHero.vue";
import NewsSlider from "~/components/Newsslug/NewsSlider.vue";

const { t } = useI18n();
const route = useRoute();
const runtimeConfig = useRuntimeConfig();

const seoTitle = computed(() => t("seo.news"));
const seoDescription = computed(() => t("seo.description"));
const siteUrl = String(runtimeConfig.public.siteUrl || "").replace(/\/$/, "");
const canonical = computed(() => (siteUrl ? `${siteUrl}${route.path}` : ""));

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogType: "article",
  ogUrl: () => canonical.value || undefined,
  twitterCard: "summary",
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
});

useHead(() => ({
  link: canonical.value ? [{ rel: "canonical", href: canonical.value }] : [],
}));

let ctx: any = null;

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    const main = document.querySelector<HTMLElement>(".products");
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
    <div class="relative z-10">
      <div
        class="bg bg-[url('/home/Ellipse.png')] md:pt-[60px] pt-[30px] bg-contain bg-top bg-no-repeat m]"
      >
        <Header />

        <div class="containerr">
          <NewsHero />
        </div>
      </div>

      <div class="md:containerr">
        <NewsSlider />
      </div>
    </div>
    <Footer />
  </div>
</template>
