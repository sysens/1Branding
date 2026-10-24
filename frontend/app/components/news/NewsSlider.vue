<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";

const root = ref<HTMLElement | null>(null);

const [container, slider] = useKeenSlider({
  loop: true,
  mode: "free-snap",
  slides: {
    perView: 3,
    spacing: 32,
  },
  breakpoints: {
    "(max-width: 1024px)": {
      slides: { perView: 2, spacing: 20 },
    },
    "(max-width: 640px)": {
      slides: { perView: 1.1, spacing: 16 },
    },
  },
});

const prev = () => slider.value?.prev();
const next = () => slider.value?.next();

useGsapContext(root, ({ gsap, ScrollTrigger }) => {
    const el = root.value!;
    const title = el.querySelector<HTMLElement>(".news-title");
    const sliderEl = el.querySelector<HTMLElement>(".news-slider");

    if (title) {
      gsap.set(title, { x: 360, opacity: 0 });
    }

    if (sliderEl) {
      gsap.set(sliderEl, { x: -360, opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 40%",
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
              duration: 1,
            },
            0
          );
        }

        if (sliderEl) {
          tl.to(
            sliderEl,
            {
              x: 0,
              opacity: 1.5,
              duration: 1.5,
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

const locale = useCmsLocale();
const fetchNewsPage = useNewsPages();
const resolveImage = useCmsMedia();
const formatDate = formatNewsDate;
const pickDate = newsDate;

const pageSize = 10;
const items = ref<NewsNode[]>([]);
const pageInfo = ref<NewsPageInfo>(null);

// Own language first; English when the CMS has no news in it.
const fetchPage = async (p: number) => {
  const current = await fetchNewsPage(p, pageSize, locale.value);
  if (current.nodes.length || locale.value === "en") return current;
  return await fetchNewsPage(p, pageSize, "en");
};

const localePath = useLocalePath();
const toNewsSlug = (id: string) => localePath(`/news/${id}`);

const collectFromPages = async (startPage: number, maxPages: number, need: number) => {
  const out: NewsNode[] = [];
  const seen = new Set<string>();

  let p = startPage;
  let tries = 0;
  const limit = Math.max(1, maxPages);

  while (out.length < need && tries < limit) {
    const res = await fetchPage(p);
    for (const n of res.nodes ?? []) {
      if (!n?.documentId) continue;
      if (seen.has(n.documentId)) continue;
      seen.add(n.documentId);
      out.push(n);
      if (out.length >= need) break;
    }
    p = p >= maxPages ? 1 : p + 1;
    tries++;
  }

  return out.slice(0, need);
};

const initItems = async () => {
  const first = await fetchPage(1);
  pageInfo.value = first.pageInfo;

  const max = Number(first.pageInfo?.pageCount ?? 1) || 1;
  const randomPage = Math.floor(Math.random() * max) + 1;

  const filled = await collectFromPages(randomPage, max, pageSize);
  items.value = filled;

  await nextTick();
  slider.value?.update();
};

onMounted(async () => {
  await initItems();
});

watch(locale, async () => {
  await initItems();
});
</script>

<template>
  <section ref="root" class="relative md:pt-[26px]">
    <div class="news-title flex items-center justify-between px-[8px] pb-[18px]">
      <div class="text-white w-full md:w-auto">
        <h2
          class="type-h2 text-center md:text-left text-[#FFFFFF] md:pb-[64px] pb-[12px] will-change-transform"
        >
          {{ $t("news.otherNews") }}
        </h2>
      </div>

      <div class="gap-[41px] hidden md:flex">
        <button
          class="group bg-[length:440%] bg-right w-[81px] h-[81px] rounded-full flex items-center justify-center bg-[url('/home/Component3.png')] bg-no-repeat hover:bg-[length:420%] transition-[background-size,box-shadow] duration-700 ease-out hover:shadow-[0_0_30px_rgba(3,203,0,0.9)]"
          type="button"
          :aria-label="$t('common.prev')"
          @click="prev"
        >
          <img src="/News/vector-10.png" alt="" >
        </button>

        <button
          class="group bg-[length:340%] bg-top w-[81px] h-[81px] rounded-full flex items-center justify-center bg-[url('/home/Component3.png')] bg-no-repeat hover:bg-[length:420%] transition-[background-size,box-shadow] duration-700 ease-out hover:shadow-[0_0_30px_rgba(3,203,0,0.9)]"
          type="button"
          :aria-label="$t('common.next')"
          @click="next"
        >
          <img src="/News/vector-11.png" alt="" >
        </button>
      </div>
    </div>

    <div
      class="pointer-events-none absolute left-0 top-[78px] bottom-0 w-[80px] z-[5]"
    />
    <div
      class="pointer-events-none absolute right-0 top-[78px] bottom-0 w-[80px] z-[5]"
    />

    <div
      ref="container"
      class="news-slider keen-slider md:px-[0px] px-[10px] md: will-change-transform"
    >
      <NuxtLink
        v-for="item in items"
        :key="item.documentId"
        :to="toNewsSlug(item.documentId)"
        class="keen-slider__slide min-h-[1px] h-auto rounded-[20px] bg-[#FFFFFF0D] block"
      >
        <article class="rounded-[14px] overflow-hidden">
          <div class="relative h-[360px] overflow-hidden">
            <img
              class="w-full h-full object-cover block"
              :src="
                item.image?.url
                  ? resolveImage(item.image.url)
                  : '/home/rectangle-42016.png'
              "
              alt=""
            >
            <div class="absolute inset-0"/>
          </div>

          <div class="px-[30px]">
            <div
              class="flex items-center gap-[8px] pt-[24px] pb-[30px] text-[#bfbfbf] opacity-[0.9]"
            >
              <img
                class="w-[14px] h-[14px] opacity-[0.9]"
                src="/News/vector-9.png"
                alt=""
              >
              <p class="type-small">
                {{ formatDate(pickDate(item)) }}
              </p>
            </div>

            <p
              class="type-h5 pb-[30px] line-clamp-2 text-[#FFFFFF]"
            >
              {{ item.title }}
            </p>
          </div>
        </article>
      </NuxtLink>
    </div>

    <div class="buttonMobile pt-[30px]">
      <div class="md:hidden flex w-full justify-center items-center gap-[30px]">
        <button
          class="group bg-[length:440%] bg-right w-[50px] h-[50px] rounded-full flex items-center justify-center bg-[url('/home/Component3.png')] bg-no-repeat hover:bg-[length:420%] transition-[background-size,box-shadow] duration-700 ease-out hover:shadow-[0_0_30px_rgba(3,203,0,0.9)]"
          type="button"
          :aria-label="$t('common.prev')"
          @click="prev"
        >
          <img class="w-[19px] h-auto" src="/News/vector-10.png" alt="" >
        </button>

        <button
          class="group bg-[length:340%] bg-top w-[50px] h-[50px] rounded-full flex items-center justify-center bg-[url('/home/Component3.png')] bg-no-repeat hover:bg-[length:420%] transition-[background-size,box-shadow] duration-700 ease-out hover:shadow-[0_0_30px_rgba(3,203,0,0.9)]"
          type="button"
          :aria-label="$t('common.next')"
          @click="next"
        >
          <img class="w-[19px] h-auto" src="/News/vector-11.png" alt="" >
        </button>
      </div>
    </div>
  </section>
</template>
