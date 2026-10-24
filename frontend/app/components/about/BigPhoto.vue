<script setup lang="ts">
import { ref, computed } from "vue";

const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap }) => {
    const img = root.value!.querySelector(".mission-img");

    if (!img) return;

    // Only a rise, no fade: the picture is the page's largest paint (LCP)
    // and must stay visible from the first frame.
    gsap.from(img, { y: 80, duration: 0.8, ease: "power3.out" });
  });

const { aboutPage } = await useAboutPage();

const section1 = computed(() => aboutPage.value?.section1 ?? null);
const media = useCmsMedia();

const imageSrc = computed(() => media(section1.value?.image?.url));
</script>

<template>
  <div class="mt-10px">
    <div ref="root" class="containerr">
      <div class="flex items-center">
        <NuxtImg
          v-if="imageSrc"
          :src="imageSrc"
          :alt="section1?.image?.alternativeText?.trim() || `${section1?.title || ''} — OneBranding`"
          sizes="100vw md:1400px"
          width="1400"
          height="700"
          loading="eager"
          fetchpriority="high"
          class="mission-img w-full md:h-[700px] h-[366px] object-cover md:rounded-[30px] rounded-[20px]"
        />
      </div>
    </div>
  </div>
</template>
