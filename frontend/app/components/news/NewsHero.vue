<script setup lang="ts">
import { computed } from "vue";
import ArticleInline from "~/components/news/ArticleInline.vue";
import { articleBlocks, isStructuredArticle } from "~/utils/articleText";

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
const blocks = computed(() => articleBlocks(text.value));
// A short news text keeps the design's two columns; an article with headings
// is read in one column at a reading measure.
const structured = computed(() => isStructuredArticle(text.value));
const heroImageSrc = computed(() => resolveImage(props.news?.image?.url));

const images = computed(() => props.news?.images_connection?.nodes ?? []);
const leftImg = computed(() => resolveImage(images.value?.[0]?.url));
const rightImg = computed(() => resolveImage(images.value?.[1]?.url));
</script>

<template>
  <div ref="root" class="mb-[8.3125rem]">
    <div>
      <div class="products">
        <div
          class="flex gap-2 justify-center items-center md:pt-[7.5rem] pt-[7.5rem] md:pb-[3.75rem] pb-[2.3125rem]"
        >
          <p class="type-small text-white">
            <time v-if="published" :datetime="published.iso">{{ published.label }}</time>
          </p>
        </div>

        <h1
          class="type-h2 text-white max-w-[62.5rem] mx-auto md:mb-[3.75rem] mb-[2.5rem] text-center px-[1.25rem] md:px-0"
        >
          {{ title }}
        </h1>
      </div>

      <div>
        <NuxtImg
          v-if="heroImageSrc"
          :src="heroImageSrc"
          :alt="title"
          class="gsapDiv md:h-[43.75rem] h-[33.875rem] object-cover rounded-[1.875rem] w-full"
        />
      </div>

      <div
        class="leftBlock type-body my-[2.5rem] text-[#FFFFFF]"
        :class="structured ? 'news-article' : 'md:columns-2 gap-[6.25rem]'"
      >
        <template v-for="(block, index) in blocks" :key="index">
          <h2 v-if="block.type === 'h2'" class="type-h3"><ArticleInline :parts="block.parts" /></h2>
          <ul v-else-if="block.type === 'ul'">
            <li v-for="(item, itemIndex) in block.items" :key="itemIndex"><ArticleInline :parts="item" /></li>
          </ul>
          <p v-else><ArticleInline :parts="block.parts" /></p>
        </template>
      </div>

      <div class="md:flex justify-between gap-[0.625rem]">
        <div class="md:w-[34%] md:h-[33.1875rem] h-[18.75rem] mb-[0.3125rem]">
          <img
            v-if="leftImg"
            :src="leftImg"
            :alt="title"
            loading="lazy"
            class="leftSide leftImg w-full h-full object-cover md:rounded-l-[1.875rem] mb-[0.3125rem]"
          >
        </div>

        <div class="md:w-[66%] md:h-[33.1875rem] h-[18.75rem]">
          <img
            v-if="rightImg"
            :src="rightImg"
            :alt="title"
            loading="lazy"
            class="rightSide rightImg w-full h-full object-cover md:rounded-r-[1.875rem] rounded-b-[1.25rem] md:rounded-b-[0px]"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leftBlock p + p {
  margin-top: 1em;
}

.news-article {
  max-width: var(--type-measure);
  margin-inline: auto;
}

.news-article h2 {
  margin: 2.5rem 0 1rem;
  font-family: var(--app-font-display);
}

.news-article p + p,
.news-article ul + p,
.news-article p + ul {
  margin-top: 1em;
}

.news-article ul {
  padding-left: 1.25em;
  list-style: disc;
}

.news-article li + li {
  margin-top: 0.4em;
}

.news-article :deep(.article-link) {
  color: #0ccc3c;
  text-decoration: underline;
  text-underline-offset: 0.18em;
}
</style>
