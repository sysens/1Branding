<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";

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

let observer: IntersectionObserver | null = null;
let ctx: any = null;
let inited = false;

const initGsap = async () => {
  if (inited || !root.value) return;
  inited = true;

  await nextTick();

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
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
  }, root.value);
};

onMounted(() => {
  if (!root.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) initGsap();
    },
    { threshold: 0.15 }
  );

  observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;

  ctx?.revert();
  ctx = null;
  inited = false;
});

const section2 = computed(() => ({
  title: props.title ?? props.fallbackTitle,
  text: props.text ?? props.fallbackText,
}));

const s2Image = computed(() => props.image ?? props.fallbackImage);
</script>

<template>
  <div ref="root">
    <div class="md:pt-[118px] pt-[100px]">
      <div v-if="section2" class="containerr">
        <h2
          class="section-title text-[#FFFFFF] font-normal md:text-[62px] md:leading-[100%] md:tracking-[0] text-center text-[40px] leading-[120%] tracking-normal will-change-transform"
        >
          {{ section2.title }}
        </h2>

        <p
          class="section-text text-[#FFFFFF] pt-[60px] md:pb-[118px] pb-[100px] font-light md:text-[16px] md:leading-[28px] md:tracking-[0] text-[14px] leading-[12 0%] tracking-normal text-center will-change-transform font-['Poppins','Inter',sans-serif]"
        >
          {{ section2.text }}
        </p>

        <img
          class="section-img w-full rounded-[30px] md:h-[700px] h-[542px] object-cover will-change-opacity"
          v-if="s2Image"
          :src="s2Image"
        />
      </div>
    </div>
  </div>
</template>

<style></style>
