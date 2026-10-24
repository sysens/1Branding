<script setup lang="ts">
import { ref, computed } from "vue";

const { t } = useI18n();
const localePath = useLocalePath();
const origin = useSiteOrigin();
usePageSeo({
  title: computed(() => t("seo.news.title")),
  description: computed(() => t("seo.news.description")),
  breadcrumbs: computed(() => [{ name: t("nav.news"), path: localePath("/news") }]),
  structuredData: computed(() => ({
    "@type": "CollectionPage",
    name: t("seo.news.title"),
    description: t("seo.news.description"),
    isPartOf: { "@id": `${origin}/#website` },
  })),
});

const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap }) => {
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

</script>

<template>
  <div ref="root">
    <div class="bg-black relative overflow-hidden">
      <div class="edge-gradient edge-gradient-left edge-gradient-strong"/>
      <div class="edge-gradient edge-gradient-right edge-gradient-strong"/>

      <div class="relative z-10 bg-black">
        <div
          class="bg-[url('/home/Ellipse.png')] md:pt-[60px] pt-[30px] bg-contain bg-top bg-no-repeat"
        >

          <h1
            class="hero-title type-h1 text-white max-w-[1000px] md:pt-0 pt-[120px] md:mt-[159px] mt-[37px] md:pb-[50px] pb-[30px] mx-auto md:mb-[77px] text-center"
          >
            {{ $t("newsPage.title") }}
          </h1>
        </div>

        <NewsMain />
      </div>
    </div>
  </div>
</template>
