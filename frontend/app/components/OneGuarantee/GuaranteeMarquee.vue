<script setup lang="ts">
import { computed } from "vue";
import { isPlaceholderCopy } from "~/utils/seo";

type AppLocale = "ru" | "en";

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

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

const { locale } = useI18n<{ message: any }, AppLocale>();
const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

type GqlRes = {
  data?: {
    oneGuarantee?: {
      section3?: {
        comment?: Array<{
          id: string;
          authorFullName: string;
          authorQuote: string;
          authorPosition: string;
        }>;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const query = `
  query OneGuaranteeComments($locale: I18NLocaleCode) {
    oneGuarantee(locale: $locale) {
      section3 {
        comment {
          id
          authorFullName
          authorQuote
          authorPosition
        }
      }
    }
  }
`;

const { data } = await useFetch<GqlRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: { query, variables: { locale: gqlLocale.value } },
  server: false,
  key: `one-guarantee-comments-${gqlLocale.value}`,
  watch: [gqlLocale],
});

const apiItems = computed<MarqueeItem[]>(() => {
  const list = data.value?.data?.oneGuarantee?.section3?.comment ?? [];
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
    ></div>
    <div
      class="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-20"
    ></div>

    <div class="w-[120%] -ml-[10%] space-y-6">
      <div
        v-for="row in rowsConfig"
        :key="row.key"
        class="flex w-max will-change-transform"
        :class="row.animClass"
        :style="{ '--marquee-duration': marqueeDuration }"
      >
        <div class="flex md:gap-[30px] gap-[20px] md:px-[15px] px-[10px]">
          <div
            v-for="(item, i) in itemsToRender"
            :key="row.key + '-a-' + i"
            class="md:w-[520px] w-[300px] h-[306px] shrink-0"
            :class="row.opacity"
          >
            <div
              class="relative h-full w-full rounded-[30px] overflow-hidden bg-[#0b0b0b] md:py-[48px] py-[30px] px-[30px] border-[1px] border-[#FFFFFF1F]"
            >
              <div
                class="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0D0D0D] to-[#1f1e1e]"
              ></div>

              <div class="relative h-full flex flex-col justify-between">
                <div>
                  <div
                    class="text-[#03CB00] text-[56px] md:pb-[12px] pb-[20px] leading-none font-bold md:mb-[12px]"
                  >
                    <img src="/OneGuarantee/Group (2).png" alt="" />
                  </div>

                  <p
                    class="font-normal text-[15px] leading-[120%] tracking-[0%] line-clamp-5 mb-[30px] text-[#808080] font-['Poppins','Inter',sans-serif]"
                  >
                    {{ item.text }}
                  </p>
                </div>

                <div>
                  <p
                    class="font-semibold text-[20px] leading-[100%] tracking-[0%] pb-[15px] text-[#FFFFFF] font-['Poppins','Inter',sans-serif]"
                  >
                    {{ item.author }}
                  </p>
                  <p
                    v-if="item.sub"
                    class="font-normal text-[15px] leading-[120%] tracking-[0] text-[#808080] font-['Poppins','Inter',sans-serif]"
                  >
                    {{ item.sub }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex md:gap-[30px] gap-[20px] md:px-[15px] px-[10px]"
          aria-hidden="true"
        >
          <div
            v-for="(item, i) in itemsToRender"
            :key="row.key + '-b-' + i"
            class="md:w-[520px] w-[300px] h-[306px] shrink-0"
            :class="row.opacity"
          >
            <div
              class="relative h-full w-full rounded-[30px] overflow-hidden bg-[#0b0b0b] md:py-[48px] py-[30px] px-[30px] border-[1px] border-[#FFFFFF1F]"
            >
              <div
                class="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0D0D0D] to-[#1f1e1e]"
              ></div>

              <div class="relative h-full flex flex-col justify-between">
                <div>
                  <div
                    class="text-[#03CB00] text-[56px] md:pb-[12px] pb-[20px] leading-none font-bold"
                  >
                    <img src="/OneGuarantee/Group (2).png" alt="" />
                  </div>

                  <p
                    class="font-normal text-[15px] leading-[120%] tracking-[0%] line-clamp-5 mb-[30px] text-[#808080] font-['Poppins','Inter',sans-serif]"
                  >
                    {{ item.text }}
                  </p>
                </div>

                <div>
                  <p
                    class="font-semibold text-[20px] leading-[100%] tracking-[0%] pb-[15px] text-[#FFFFFF] font-['Poppins','Inter',sans-serif]"
                  >
                    {{ item.author }}
                  </p>
                  <p
                    v-if="item.sub"
                    class="font-normal text-[15px] leading-[120%] tracking-[0] text-[#808080] font-['Poppins','Inter',sans-serif]"
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
