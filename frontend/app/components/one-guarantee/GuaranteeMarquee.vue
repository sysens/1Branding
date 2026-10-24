<script setup lang="ts">
import { computed } from "vue";
import { isPlaceholderCopy } from "~/utils/seo";

type MarqueeItem = {
  text: string;
  author: string;
  sub?: string;
};

type Props = {
  items?: MarqueeItem[];
  rows?: number;
  durationSeconds?: number;
  linkTo?: string;
};

const props = withDefaults(defineProps<Props>(), {
  items: undefined,
  rows: 3,
  durationSeconds: 120,
  linkTo: "/",
});

// Placeholder copy ("Lorem ipsum", "Pellentesque…") must never be shown as a
// client review: made-up testimonials hurt trust and search rankings. Without
// real reviews from the CMS the whole block (heading included) is hidden.
const isRealReview = (item: MarqueeItem) =>
  item.text.trim().length > 0 && item.author.trim().length > 0 &&
  !isPlaceholderCopy(`${item.text} ${item.author} ${item.sub ?? ""}`);

const { own: guarantee, fallback: fallbackGuarantee } = await useOneGuaranteePage();

const apiItems = computed<MarqueeItem[]>(() => {
  const own = guarantee.value?.section3?.comment ?? [];
  const list = own.length ? own : fallbackGuarantee.value?.section3?.comment ?? [];
  return list
    .filter((c) => (c?.authorQuote || "").trim().length)
    .map((c) => ({
      text: c.authorQuote || "",
      author: c.authorFullName || "",
      sub: c.authorPosition || "",
    }));
});

const itemsToRender = computed(() =>
  (props.items?.length ? props.items : apiItems.value).filter(isRealReview)
);

const marqueeDuration = computed(() => `${props.durationSeconds}s`);

const rowsConfig = computed(() =>
  Array.from({ length: props.rows }, (_, i) => ({
    key: `row-${i}`,
    animClass: i % 2 ? "animate-marquee-reverse" : "animate-marquee",
    opacity: i % 2 ? "opacity-80" : "opacity-95",
  }))
);
</script>

<template>
  <div v-if="itemsToRender.length">
  <slot name="header" />
  <section class="relative w-full overflow-hidden bg-black py-20">
    <div
      class="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-20"
    />
    <div
      class="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-20"
    />

    <div class="w-[120%] -ml-[10%] space-y-6">
      <div
        v-for="row in rowsConfig"
        :key="row.key"
        class="flex w-max will-change-transform"
        :class="row.animClass"
        :style="{ '--marquee-duration': marqueeDuration }"
      >
        <div class="flex md:gap-[1.875rem] gap-[1.25rem] md:px-[0.9375rem] px-[0.625rem]">
          <div
            v-for="(item, i) in itemsToRender"
            :key="row.key + '-a-' + i"
            class="md:w-[32.5rem] w-[18.75rem] h-[19.125rem] shrink-0"
            :class="row.opacity"
          >
            <div
              class="relative h-full w-full rounded-[1.875rem] overflow-hidden bg-[#0b0b0b] md:py-[3rem] py-[1.875rem] px-[1.875rem] border-[1px] border-[#FFFFFF1F]"
            >
              <div
                class="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0D0D0D] to-[#1f1e1e]"
              />

              <div class="relative h-full flex flex-col justify-between">
                <div>
                  <div class="md:pb-[0.75rem] pb-[1.25rem] md:mb-[0.75rem]">
                    <img class="block" src="/OneGuarantee/group-2.png" alt="" >
                  </div>

                  <p
                    class="type-small line-clamp-5 mb-[1.875rem] text-[#8f8f8f]"
                  >
                    {{ item.text }}
                  </p>
                </div>

                <div>
                  <p
                    class="type-h5 pb-[0.9375rem] text-[#FFFFFF]"
                  >
                    {{ item.author }}
                  </p>
                  <p
                    v-if="item.sub"
                    class="type-small text-[#8f8f8f]"
                  >
                    {{ item.sub }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex md:gap-[1.875rem] gap-[1.25rem] md:px-[0.9375rem] px-[0.625rem]"
          aria-hidden="true"
        >
          <div
            v-for="(item, i) in itemsToRender"
            :key="row.key + '-b-' + i"
            class="md:w-[32.5rem] w-[18.75rem] h-[19.125rem] shrink-0"
            :class="row.opacity"
          >
            <div
              class="relative h-full w-full rounded-[1.875rem] overflow-hidden bg-[#0b0b0b] md:py-[3rem] py-[1.875rem] px-[1.875rem] border-[1px] border-[#FFFFFF1F]"
            >
              <div
                class="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0D0D0D] to-[#1f1e1e]"
              />

              <div class="relative h-full flex flex-col justify-between">
                <div>
                  <div class="md:pb-[0.75rem] pb-[1.25rem]">
                    <img class="block" src="/OneGuarantee/group-2.png" alt="" >
                  </div>

                  <p
                    class="type-small line-clamp-5 mb-[1.875rem] text-[#8f8f8f]"
                  >
                    {{ item.text }}
                  </p>
                </div>

                <div>
                  <p
                    class="type-h5 pb-[0.9375rem] text-[#FFFFFF]"
                  >
                    {{ item.author }}
                  </p>
                  <p
                    v-if="item.sub"
                    class="type-small text-[#8f8f8f]"
                  >
                    {{ item.sub }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  </div>
</template>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  animation: marquee var(--marquee-duration) linear infinite;
}

.animate-marquee-reverse {
  animation: marquee var(--marquee-duration) linear infinite reverse;
}
</style>
