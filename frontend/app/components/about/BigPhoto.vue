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
        <!-- Every screen size is named: a bare "100vw" made @nuxt/image list
             1px and 2px copies, so phones downloaded the 1400px one. -->
        <NuxtImg
          v-if="imageSrc"
          :src="imageSrc"
          :alt="section1?.image?.alternativeText?.trim() || `${section1?.title || ''} — OneBranding`"
          sizes="xs:100vw sm:100vw md:100vw lg:1400px"
          width="1400"
          height="700"
          loading="eager"
          fetchpriority="high"
          class="mission-img w-full md:h-[43.75rem] h-[22.875rem] object-cover md:rounded-[1.875rem] rounded-[1.25rem]"
        />
      </div>
    </div>
  </div>
</template>
