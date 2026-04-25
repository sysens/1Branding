<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";

type ColorCard = { HexColorCode: string; id: string };

type Props = {
  title?: string | null;
  text?: string | null;
  colors?: ColorCard[] | null;
};

const props = withDefaults(defineProps<Props>(), {
  title: null,
  text: null,
  colors: null,
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

    const title = el.querySelector<HTMLElement>(".cp-title");
    const cards = el.querySelector<HTMLElement>(".cp-cards");
    const text = el.querySelector<HTMLElement>(".cp-text");

    if (title) {
      gsap.set(title, { x: 160, opacity: 0 });
    }

    if (cards) {
      gsap.set(cards, { y: 260, opacity: 0 });
    }

    if (text) {
      gsap.set(text, { opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
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

        if (cards) {
          tl.to(
            cards,
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
            },
            0.12
          );
        }

        if (text) {
          tl.to(
            text,
            {
              opacity: 1,
              duration: 0.8,
            },
            0.24
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

  const rect = root.value.getBoundingClientRect();
  const inViewNow = rect.top < window.innerHeight && rect.bottom > 0;
  if (inViewNow) initGsap();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) initGsap();
    },
    { threshold: 0.01, rootMargin: "200px 0px 200px 0px" }
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

const section3 = computed(() => {
  if (!props.title && !props.text && !(props.colors && props.colors.length)) return null;
  return { title: props.title ?? "", text: props.text ?? "" };
});

const colors = computed(() => props.colors ?? []);
</script>

<template>
  <div ref="root">
    <div class="containerr">
      <div class="w-full md:pt-[167px] pt-[100px]">
        <h1
          class="cp-title text-white font-normal md:text-[62px] md:leading-[1] mb-[27px] md:px-0 px-[20px] text-[40px] leading-[100%] tracking-normal text-center will-change-transform"
        >
          {{ section3?.title || "Color palette" }}
        </h1>

        <div
          class="cp-cards md:flex md:justify-center md:mb-[130px] flex gap-6 mb-[100px] overflow-x-auto md:overflow-visible snap-x snap-mandatory [-webkit-overflow-scrolling:touch] will-change-transform"
        >
          <div
            v-for="c in colors"
            :key="c.id"
            class="md:w-[202px] md:h-[225px] bg-white/5 md:rounded-[30px] flex flex-col items-center justify-center gap-4 shrink-0 snap-start w-[134.67px] h-[150px] opacity-100 border-t border-[#FFFFFF0D]/5 rounded-[20px] py-[20px] px-[16px]"
          >
            <div
              class="md:w-[154px] md:h-[127px] md:rounded-[20px] w-[102.67px] h-[84.67px] rounded-[13.33px] opacity-100 rotate-0"
              :style="{ backgroundColor: c.HexColorCode || '#000' }"
            ></div>

            <h1
              class="text-white font-medium md:text-[22px] md:leading-[31.29px] text-center text-[14.67px] leading-[20.86px] tracking-normal font-['Poppins','Inter',sans-serif]"
            >
              {{ c.HexColorCode || "" }}
            </h1>
          </div>
        </div>
      </div>

      <p
        class="cp-text font-light text-white text-[16px] leading-[120%] md:leading-[28px] tracking-normal text-center will-change-transform"
      >
        {{ section3?.text || "" }}
      </p>
    </div>
  </div>
</template>

<style>
.cp-cards::-webkit-scrollbar {
  display: none;
}

.cp-cards {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
