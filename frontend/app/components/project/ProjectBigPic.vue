<script setup lang="ts">
import { ref, computed } from "vue";

type Props = {
  title?: string | null;
  text?: string | null;
  image?: string | null;

  fallbackTitle?: string;
  fallbackText?: string;
  fallbackImage?: string;
};

const props = withDefaults(defineProps<Props>(), {
  title: null,
  text: null,
  image: null,

  fallbackTitle: "",
  fallbackText: "",
  fallbackImage: "",
});

const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap, ScrollTrigger }) => {
    const el = root.value!;

    const title = el.querySelector<HTMLElement>(".section-title");
    const text = el.querySelector<HTMLElement>(".section-text");
    const image = el.querySelector<HTMLElement>(".section-img");

    if (title) {
      gsap.set(title, { x: 200, opacity: 0 });
    }

    if (text) {
      gsap.set(text, { x: -200, opacity: 0 });
    }

    if (image) {
      gsap.set(image, { opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 100%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        if (title) {
          tl.to(
            title,
            {
              x: 0,
              opacity: 1,
              duration: 0.75,
            },
            0
          );
        }

        if (text) {
          tl.to(
            text,
            {
              x: 0,
              opacity: 1,
              duration: 0.75,
            },
            0.1
          );
        }

        if (image) {
          tl.to(
            image,
            {
              opacity: 1,
              duration: 0.9,
            },
            0.18
          );
        }
      },
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });
  }, { scrollTrigger: true, whenVisible: { threshold: 0.15 } });

const section2 = computed(() => ({
  title: props.title ?? props.fallbackTitle,
  text: props.text ?? props.fallbackText,
}));

const s2Image = computed(() => props.image ?? props.fallbackImage);
// More than about two lines of running text reads better left-aligned.
const textIsLong = computed(() => (section2.value.text ?? "").trim().length > 180);
</script>

<template>
  <div ref="root">
    <div class="md:pt-[7.375rem] pt-[6.25rem]">
      <div v-if="section2" class="containerr">
        <h2
          class="section-title type-h2 text-[#FFFFFF] text-center will-change-transform"
        >
          {{ section2.title }}
        </h2>

        <!-- CMS copy: one or two lines stay centred, a longer text is
             left-aligned at a reading measure (the block stays centred). -->
        <p
          class="section-text type-body type-measure mx-auto text-[#FFFFFF] pt-[3.75rem] md:pb-[7.375rem] pb-[6.25rem] will-change-transform"
          :class="textIsLong ? 'text-left' : 'text-center'"
        >
          {{ section2.text }}
        </p>

        <img
          v-if="s2Image"
          class="section-img w-full rounded-[1.875rem] md:h-[43.75rem] h-[33.875rem] object-cover will-change-opacity"
          :src="s2Image"
          :alt="section2.title || ''"
          loading="lazy"
        >
      </div>
    </div>
  </div>
</template>

<style></style>
