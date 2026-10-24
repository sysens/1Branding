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
    class="div max-w-[46.625rem] pt-[6.25rem] md:mb-[23.5625rem] mb-[10.9375rem] mx-auto md:px-0 md:[2.5rem]"
  >
    <div class="eff-head will-change-transform">
      <h2
        class="type-h2 type-caps text-[#FFFFFF] mb-[5rem] text-center"
      >
        {{ title }}
      </h2>
    </div>

    <div class="eff-list will-change-transform">
      <div class="flex flex-col mx-[1.25rem] md:gap-[2.8125rem] gap-[1.5625rem]">
        <div
          v-for="(item, i) in items"
          :key="i"
          class="Item flex shrink-0 items-center gap-[1.875rem]"
        >
          <div class="shrink-0 w-[2.5rem] h-[2.1875rem]">
            <img
              class="w-[2.5rem] h-[2.1875rem]"
              :src="resolveImg(item.checkMark?.url)"
              alt=""
            >
          </div>

          <div>
            <p
              class="type-lead text-[#FFFFFF]"
            >
              {{ item.text }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
