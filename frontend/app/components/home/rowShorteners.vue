<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import type { LandingSection11 } from "~/types/landingPayload";

type GsapContext = { revert: () => void };

const { t, tm } = useI18n();

const props = withDefaults(
  defineProps<{
    section?: LandingSection11 | null;
  }>(),
  {
    section: null,
  }
);

const openIndex = ref<number | null>(null);
const root = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let ctx: GsapContext | null = null;
let inited = false;

const toggle = (i: number) => {
  openIndex.value = openIndex.value === i ? null : i;
};

const fallbackFaqs = computed(() => {
  const list = tm("home.rowShorteners.faqs") as Array<{
    title: string;
    text: string;
  }> | null;
  return Array.isArray(list) ? list : [];
});

const section11 = computed(() => props.section ?? null);

const faqTitle = computed(() => section11.value?.title || t("home.rowShorteners.title"));

const faqs = computed(() => {
  const arr = section11.value?.AnswerQuestions ?? null;
  if (!arr || arr.length === 0) return fallbackFaqs.value;

  const mapped = arr
    .map((q) => ({
      title: q?.question ?? "",
      text: q?.answer ?? "",
    }))
    .filter((x) => x.title || x.text);

  return mapped.length ? mapped : fallbackFaqs.value;
});

const initGsap = async () => {
  if (inited || !root.value) return;
  inited = true;

  await nextTick();

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
    const el = root.value!;
    const title = el.querySelector<HTMLElement>(".faq-title");
    const items = el.querySelectorAll<HTMLElement>(".faq-item");

    if (title) {
      gsap.set(title, { y: 24, opacity: 0 });
    }

    items.forEach((card, idx) => {
      const fromX = idx % 2 === 0 ? -160 : 160;
      gsap.set(card, { x: fromX, opacity: 0 });
    });

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
              y: 0,
              opacity: 1,
              duration: 0.7,
            },
            0
          );
        }

        items.forEach((card, idx) => {
          tl.to(
            card,
            {
              x: 0,
              opacity: 1,
              duration: 0.72,
            },
            0.1 + idx * 0.08
          );
        });
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
    {
      threshold: 0,
      rootMargin: "250px 0px 250px 0px",
    }
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
</script>

<template>
  <div ref="root">
    <div class="main containerr">
      <div class="heading">
        <h1
          class="faq-title text-[#FFFFFF] font-normal pb-[83px] md:text-[3.875rem] md:leading-[4.25rem] text-[40px] leading-[120%] tracking-normal text-center font-['Poppins','Inter',sans-serif]"
        >
          {{ faqTitle }}
        </h1>
      </div>

      <div class="flex flex-col gap-4">
        <div
          v-for="(item, i) in faqs"
          :key="i"
          @click="toggle(i)"
          class="faq-item item rounded-[16px] bg-gradient-to-r from-[#0D0D0D] to-[#161515] border-t border-gray-800 p-[30px] will-change-transform"
        >
          <div class="flex items-center justify-between w-full">
            <h1
              class="text-[#FFFFFFD9]/85 font-normal md:text-[1.25rem] text-[16px] leading-[120%] tracking-normal font-['Poppins','Inter',sans-serif]"
            >
              {{ item.title }}
            </h1>

            <button>
              <img
                src="/home/Vector(6).png"
                alt="toggle"
                class="transition-transform duration-300 ease-in-out"
                :class="openIndex === i ? 'rotate-45' : 'rotate-0'"
              />
            </button>
          </div>
          <div
            class="grid transition-[grid-template-rows] duration-500 ease-in-out"
            :class="openIndex === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
          >
            <div class="overflow-hidden">
              <p
                class="md:pt-[2.6875rem] pt-[30px] font-normal md:text-[1rem] md:leading-[1.9556rem] font-['Poppins','Inter',sans-serif] text-[#FFFFFFBF]/70 text-[13px] leading-[120%] tracking-normal"
              >
                {{ item.text }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
