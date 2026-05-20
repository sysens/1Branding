<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";

type AppLocale = "ru" | "en";
type GsapContext = { revert: () => void };

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const LOCAL_INFO_MEDIA_FALLBACK = "/home/quaker.mp4";

const i18n = useI18n();
const locale = i18n.locale;

type Media = { url?: string | null };
type SectionBlock = {
  title?: string | null;
  description?: string | null;
  image?: Media | null;
};
type TitleParts = {
  lead: string;
  accent: string;
};
type MediaKind = "image" | "video";
type InfoDisplayBlock = {
  titleParts: TitleParts;
  description: string;
  mediaSrc: string;
  mediaKind: MediaKind;
};

type LandingRes = {
  data?: {
    landingPage?: {
      section10?: Array<SectionBlock | null> | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

const query = `
  query LandingPage($locale: I18NLocaleCode) {
    landingPage(locale: $locale) {
      section10 {
        title
        description
        image { url }
      }
    }
  }
`;

const { data } = await useFetch<LandingRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: computed(() => ({
    query,
    variables: { locale: gqlLocale.value },
  })),
  server: false,
  key: "landing-section10",
  watch: [gqlLocale],
});

const page = computed(() => data.value?.data?.landingPage ?? null);
const s10 = computed(() => page.value?.section10 ?? []);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/home/") || url.startsWith("/General/")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

const fallbackBlock = computed<SectionBlock>(() =>
  gqlLocale.value === "ru"
    ? {
        title: "Фирменный стиль ключ к узнаваемости продукта.",
        description:
          "Именно единый визуальный язык формирует первое впечатление и закрепляется в памяти клиента. Когда бренд последователен в цветах, форме и подаче, его легко узнать среди сотен конкурентов.",
        image: { url: LOCAL_INFO_MEDIA_FALLBACK },
      }
    : {
        title: "Brand identity is the key to product recognition.",
        description:
          "A consistent visual language creates the first impression and stays in the customer's memory. When a brand is consistent in colors, shapes, and presentation, it becomes easy to recognize among hundreds of competitors.",
        image: { url: LOCAL_INFO_MEDIA_FALLBACK },
      }
);

const getMediaKind = (src: string): MediaKind =>
  /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(src) ? "video" : "image";

const splitTitle = (title?: string | null): TitleParts => {
  const text = (title ?? "").trim();

  if (!text) {
    return { lead: "", accent: "" };
  }

  const lower = text.toLocaleLowerCase();
  const markers = ["key to ", "ключ к "];

  for (const marker of markers) {
    const index = lower.indexOf(marker);

    if (index >= 0) {
      const accentStart = index + marker.length;

      return {
        lead: text.slice(0, accentStart).trim(),
        accent: text.slice(accentStart).trim(),
      };
    }
  }

  const words = text.split(/\s+/);

  if (words.length <= 2) {
    return { lead: text, accent: "" };
  }

  return {
    lead: words.slice(0, -2).join(" "),
    accent: words.slice(-2).join(" "),
  };
};

const isVisibleSectionBlock = (
  block: SectionBlock | null
): block is SectionBlock =>
  Boolean(block?.title || block?.description || block?.image?.url);

const infoBlocks = computed<InfoDisplayBlock[]>(() =>
  (s10.value.filter(isVisibleSectionBlock).length
    ? s10.value.filter(isVisibleSectionBlock)
    : [fallbackBlock.value]
  ).map((block) => ({
      titleParts: splitTitle(block.title),
      description: block.description ?? "",
      mediaSrc: resolveMedia(block.image?.url) || LOCAL_INFO_MEDIA_FALLBACK,
      mediaKind: getMediaKind(resolveMedia(block.image?.url) || LOCAL_INFO_MEDIA_FALLBACK),
    }))
);

const root = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let ctx: GsapContext | null = null;
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
    const copyBlocks = el.querySelectorAll<HTMLElement>(".info-copy");
    const imageFrames = el.querySelectorAll<HTMLElement>(".info-image-frame");

    copyBlocks.forEach((item) => {
      gsap.set(item, { y: 42, opacity: 0 });
    });

    imageFrames.forEach((item) => {
      gsap.set(item, { y: 56, opacity: 0, scale: 0.96 });
    });

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        copyBlocks.forEach((item, index) => {
          tl.to(
            item,
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
            },
            index * 0.12
          );
        });

        imageFrames.forEach((item, index) => {
          tl.to(
            item,
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.9,
            },
            index * 0.12 + 0.18
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
  <div ref="root" class="relative">
    <img
      src="/General/Ellipse (3).png"
      alt=""
      class="absolute left-1/2 bottom-[250px] -translate-x-1/2 w-[900px] h-[900px] object-contain pointer-events-none select-none -z-10"
    />

    <img
      src="/General/Ellipse (3).png"
      alt=""
      class="absolute right-[1200px] top-[280px] w-[900px] h-[900px] object-contain pointer-events-none select-none -z-10"
    />

    <div class="info-stack containerr">
      <section
        v-for="(block, index) in infoBlocks"
        :key="`${block.titleParts.lead}-${index}`"
        class="info-block"
      >
        <div class="info-copy will-change-transform">
          <h2 class="info-title">
            <span v-if="block.titleParts.lead">
              {{ block.titleParts.lead }}{{ block.titleParts.accent ? " " : "" }}
            </span>
            <span v-if="block.titleParts.accent" class="info-title__accent">
              {{ block.titleParts.accent }}
            </span>
          </h2>

          <p v-if="block.description" class="info-description">
            {{ block.description }}
          </p>
        </div>

        <div v-if="block.mediaSrc" class="info-image-frame will-change-transform">
          <video
            v-if="block.mediaKind === 'video'"
            class="info-media"
            :src="block.mediaSrc"
            autoplay
            muted
            loop
            playsinline
            preload="metadata"
          ></video>

          <img v-else class="info-media" :src="block.mediaSrc" alt="" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.info-stack {
  display: grid;
  gap: clamp(4rem, 8vw, 7.5rem);
  padding-top: clamp(2.5rem, 6vw, 5.5rem);
  padding-bottom: clamp(3.5rem, 7vw, 6rem);
}

.info-block {
  display: grid;
  justify-items: center;
  gap: clamp(1.5rem, 3vw, 2.25rem);
}

.info-copy {
  max-width: 70rem;
  text-align: center;
}

.info-title {
  color: #fff;
  font-size: clamp(2.35rem, 5.3vw, 4.9rem);
  font-weight: 700;
  line-height: 0.98;
  letter-spacing: 0;
  text-transform: uppercase;
}

.info-title span {
  display: inline;
}

.info-title__accent {
  color: #3bff28;
}

.info-description {
  max-width: 62rem;
  margin: 1rem auto 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(0.875rem, 1.18vw, 1.05rem);
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: 0;
}

.info-image-frame {
  width: min(100%, 74rem);
  height: clamp(20rem, 54vw, 39.5rem);
  overflow: hidden;
  border-radius: clamp(1.4rem, 3vw, 2.25rem);
  background: rgba(255, 255, 255, 0.04);
}

.info-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 767px) {
  .info-stack {
    gap: 4rem;
    padding-top: 3rem;
    padding-bottom: 4rem;
  }

  .info-title {
    font-size: clamp(2rem, 12vw, 3.2rem);
    line-height: 1.05;
  }

  .info-description {
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .info-image-frame {
    height: 18rem;
    border-radius: 1.5rem;
  }
}
</style>
