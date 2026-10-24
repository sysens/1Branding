<script setup lang="ts">
import { computed } from "vue";

const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap }) => {
    const main = root.value?.querySelector<HTMLElement>(".gsapDiv");
    if (!main) return;

    gsap.fromTo(
      main,
      { x: -160, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
    );
  });

type Media = { url?: string | null };
type NewsItem = {
  title?: string | null;
  createdAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  image?: Media | null;
  text?: string | null;
  images_connection?: { nodes?: Media[] | null } | null;
};

const props = defineProps<{ news: NewsItem | null }>();
const resolveImage = useCmsMedia();

const { locale } = useI18n();
const title = computed(() => (props.news?.title ?? "").toString());
// The visible publication date (and its machine-readable form for crawlers).
// A fixed time zone keeps the server and the browser on the same day.
const published = computed(() => {
  const value = props.news?.publishedAt || props.news?.createdAt;
  if (!value || Number.isNaN(Date.parse(value))) return null;
  const date = new Date(value);
  return {
    iso: date.toISOString(),
    label: new Intl.DateTimeFormat(locale.value, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Tashkent" }).format(date),
  };
});
const text = computed(() => (props.news?.text ?? "").toString());
const heroImageSrc = computed(() => resolveImage(props.news?.image?.url));

const images = computed(() => props.news?.images_connection?.nodes ?? []);
const leftImg = computed(() => resolveImage(images.value?.[0]?.url));
const rightImg = computed(() => resolveImage(images.value?.[1]?.url));
</script>

<template>
  <div ref="root" class="mb-[133px]">
    <div>
      <div class="products">
        <div
          class="flex gap-2 justify-center items-center md:pt-[120px] pt-[120px] md:pb-[60px] pb-[37px]"
        >
          <p
            class="font-normal text-[16px] text-white leading-[28px] tracking-normal font-['Poppins','Inter',sans-serif]"
          >
            <time v-if="published" :datetime="published.iso">{{ published.label }}</time>
          </p>
        </div>

        <h1
          class="text-white max-w-[1000px] mx-auto md:font-normal md:mb-[60px] mb-[40px] md:text-[62px] md:leading-[62px] md:tracking-normal font-normal text-[40px] leading-[120%] tracking-[0%] text-center px-[20px] md:px-0"
        >
          {{ title }}
        </h1>
      </div>

      <div>
        <NuxtImg
          v-if="heroImageSrc"
          :src="heroImageSrc"
          :alt="title"
          class="gsapDiv md:h-[700px] h-[542px] object-cover rounded-[30px] w-full"
        />
      </div>

      <p
        class="leftBlock md:font-normal md:columns-2 my-[40px] gap-[100px] md:text-[16px] md:leading-[28px] md:tracking-normal text-[#FFFFFF] font-light text-[14px] leading-[28px] tracking-[0%] font-['Poppins','Inter',sans-serif]"
      >
        {{ text }}
      </p>

      <div class="md:flex justify-between gap-[10px]">
        <div class="md:w-[34%] md:h-[531px] h-[300px] mb-[5px]">
          <img
            v-if="leftImg"
            :src="leftImg"
            :alt="title"
            loading="lazy"
            class="leftSide leftImg w-full h-full object-cover md:rounded-l-[30px] mb-[5px]"
          >
        </div>

        <div class="md:w-[66%] md:h-[531px] h-[300px]">
          <img
            v-if="rightImg"
            :src="rightImg"
            :alt="title"
            loading="lazy"
            class="rightSide rightImg w-full h-full object-cover md:rounded-r-[30px] rounded-b-[20px] md:rounded-b-[0px]"
          >
        </div>
      </div>
    </div>
  </div>
</template>
