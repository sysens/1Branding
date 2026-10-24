<script setup lang="ts">
import { ref, computed } from "vue";

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

useGsapContext(root, ({ gsap, ScrollTrigger }) => {
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
  }, { scrollTrigger: true, whenVisible: { threshold: 0.01, rootMargin: "200px 0px 200px 0px" } });

const section3 = computed(() => {
  if (!props.title && !props.text && !(props.colors && props.colors.length)) return null;
  return { title: props.title ?? "", text: props.text ?? "" };
});

const colors = computed(() => props.colors ?? []);
// More than about two lines of running text reads better left-aligned.
const textIsLong = computed(() => (section3.value?.text ?? "").trim().length > 180);
</script>

<template>
  <div ref="root">
    <div class="containerr">
      <div class="w-full md:pt-[10.4375rem] pt-[6.25rem]">
        <h2
          class="cp-title type-h2 text-white mb-[1.6875rem] md:px-0 px-[1.25rem] text-center will-change-transform"
        >
          {{ section3?.title || $t("project.palette") }}
        </h2>

        <div
          class="cp-cards md:flex md:justify-center md:mb-[8.125rem] flex gap-6 mb-[6.25rem] overflow-x-auto md:overflow-visible snap-x snap-mandatory [-webkit-overflow-scrolling:touch] will-change-transform"
        >
          <div
            v-for="c in colors"
            :key="c.id"
            class="md:w-[12.625rem] md:h-[14.0625rem] bg-white/5 md:rounded-[1.875rem] flex flex-col items-center justify-center gap-4 shrink-0 snap-start w-[8.41687rem] h-[9.375rem] opacity-100 border-t border-[#FFFFFF0D]/5 rounded-[1.25rem] py-[1.25rem] px-[1rem]"
          >
            <div
              class="md:w-[9.625rem] md:h-[7.9375rem] md:rounded-[1.25rem] w-[6.41688rem] h-[5.29188rem] rounded-[0.83313rem] opacity-100 rotate-0"
              :style="{ backgroundColor: c.HexColorCode || '#000' }"
            />

            <p
              class="type-lead font-semibold text-white text-center"
            >
              {{ c.HexColorCode || "" }}
            </p>
          </div>
        </div>
      </div>

      <!-- CMS copy: one or two lines stay centred, a longer text is
           left-aligned at a reading measure (the block stays centred). -->
      <p
        class="cp-text type-body type-measure mx-auto text-white will-change-transform"
        :class="textIsLong ? 'text-left' : 'text-center'"
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
