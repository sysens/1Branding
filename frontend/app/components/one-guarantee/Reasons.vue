<script setup lang="ts">
import { ref, computed } from "vue";

const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap, ScrollTrigger }) => {
    const el = root.value!;
    const headWrap = el.querySelector<HTMLElement>(".eff-head");
    const listWrap = el.querySelector<HTMLElement>(".eff-list");

    if (headWrap) {
      gsap.set(headWrap, { x: 260, opacity: 0 });
    }

    if (listWrap) {
      gsap.set(listWrap, { x: -260, opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        if (headWrap) {
          tl.to(
            headWrap,
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
            },
            0
          );
        }

        if (listWrap) {
          tl.to(
            listWrap,
            {
              x: 0,
              opacity: 1,
              duration: 0.9,
            },
            0.12
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

const { t } = useI18n();

type WhyItem = NonNullable<NonNullable<OneGuaranteeEntry["section5"]>["whyItWorks"]>[number];

const { own: guarantee, fallback: fallbackGuarantee } = await useOneGuaranteePage();

const section5 = computed(() => guarantee.value?.section5);
const fallbackSection5 = computed(() => fallbackGuarantee.value?.section5);

// The title keeps its i18n copy; only the list comes from the English entry.
const title = computed(() => section5.value?.title || t("oneGuarantee.reasonsTitle"));

const items = computed<WhyItem[]>(() =>
  section5.value?.whyItWorks?.length ? section5.value.whyItWorks : fallbackSection5.value?.whyItWorks || []
);

const resolveImg = useCmsMedia();
</script>

<template>
  <div
    ref="root"
    class="div max-w-[746px] pt-[100px] md:mb-[377px] mb-[175px] mx-auto md:px-0 md:[40px]"
  >
    <div class="eff-head will-change-transform">
      <h2
        class="font-normal md:text-[62px] md:leading-[100%] md:tracking-tighter text-[#FFFFFF] mb-[80px] text-[40px] leading-[120%] tracking-normal text-center font-['Inter']"
      >
        {{ title }}
      </h2>
    </div>

    <div class="eff-list will-change-transform">
      <div class="flex flex-col mx-[20px] md:gap-[45px] gap-[25px]">
        <div
          v-for="(item, i) in items"
          :key="i"
          class="Item flex shrink-0 items-center gap-[30px]"
        >
          <div class="shrink-0 w-[40px] h-[35px]">
            <img
              class="w-[40px] h-[35px]"
              :src="resolveImg(item.checkMark?.url)"
              alt=""
            >
          </div>

          <div>
            <p
              class="font-light md:text-[24px] md:leading-[28px] tracking-normal text-[#FFFFFF] text-[14px] leading-[120%] font-['Inter']"
            >
              {{ item.text }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
