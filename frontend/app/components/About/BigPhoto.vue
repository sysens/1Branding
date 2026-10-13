<script setup lang="ts">
import { ref, computed } from "vue";

type AppLocale = "ru" | "en";

const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap }) => {
    const img = root.value!.querySelector(".mission-img");

    if (!img) return;

    gsap.fromTo(
      img,
      {
        y: 80,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.5,
        ease: "power3.out",
      }
    );
  });

const { locale } = useI18n();
type AboutPage = {
  documentId: string;
  section1: { id: string; title: string; image: { url: string | null; alternativeText?: string | null } | null } | null;
  section3: { title: string; subTitle: string } | null;
};

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
          :alt="section1?.image?.alternativeText?.trim() || section1?.title || ''"
          class="mission-img w-full md:h-[700px] h-[366px] object-cover md:rounded-[30px] rounded-[20px]"
        />
      </div>
    </div>
  </div>
</template>
