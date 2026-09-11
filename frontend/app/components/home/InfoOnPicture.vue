<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import type { LandingSection10Block } from "~/types/landingPayload";

type AppLocale = "ru" | "en";
type GsapContext = { revert: () => void };

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const LOCAL_INFO_MEDIA_FALLBACK = "/home/quaker.mp4";

const i18n = useI18n();
const locale = i18n.locale;

type SectionBlock = LandingSection10Block;
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
  mediaAlt: string;
};

const props = withDefaults(
  defineProps<{
    section?: SectionBlock | Array<SectionBlock | null> | null;
  }>(),
  {
    section: null,
  }
);

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

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

const s10 = computed<SectionBlock | null>(() => {
  const source = props.section;

  if (Array.isArray(source)) {
    return source.find(isVisibleSectionBlock) ?? null;
  }

  return source ?? null;
});

const infoBlock = computed<InfoDisplayBlock>(() => {
  const block = isVisibleSectionBlock(s10.value) ? s10.value : fallbackBlock.value;
  const mediaSrc = resolveMedia(block.image?.url) || LOCAL_INFO_MEDIA_FALLBACK;

  return {
    titleParts: splitTitle(block.title),
    description: block.description ?? "",
    mediaSrc,
    mediaKind: getMediaKind(mediaSrc),
    mediaAlt: block.image?.alternativeText?.trim() || block.title?.trim() || "",
  };
});

const root = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let ctx: GsapContext | null = null;
let inited = false;

const initGsap = async () => {
  if (inited || !root.value) return;
  inited = true;

  await nextTick();

  const el = root.value;
  if (!el) {
    inited = false;
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
    const wordmark = el.querySelector<HTMLElement>(".info-wordmark");
    const copyBlocks = el.querySelectorAll<HTMLElement>(".info-copy");
    const imageFrames = el.querySelectorAll<HTMLElement>(".info-image-frame");

    if (wordmark) {
      gsap.set(wordmark, { y: 54, opacity: 0 });
    }

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

        if (wordmark) {
          tl.to(wordmark, { y: 0, opacity: 1, duration: 1.05 }, 0);
        }

        copyBlocks.forEach((item, index) => {
          tl.to(
            item,
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
            },
            index * 0.12 + 0.08
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
            index * 0.12 + 0.24
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
  <section ref="root" class="brand-identity-feature">
    <div class="info-stack">
      <section class="info-block">
        <div class="info-wordmark" aria-hidden="true">ONE</div>

        <div class="info-copy will-change-transform">
          <h2 class="info-title">
            <span v-if="infoBlock.titleParts.lead">
              {{ infoBlock.titleParts.lead }}{{ infoBlock.titleParts.accent ? " " : "" }}
            </span>
            <span v-if="infoBlock.titleParts.accent" class="info-title__accent">
              {{ infoBlock.titleParts.accent }}
            </span>
          </h2>

          <p v-if="infoBlock.description" class="info-description">
            {{ infoBlock.description }}
          </p>
        </div>

        <div v-if="infoBlock.mediaSrc" class="info-image-frame will-change-transform">
          <video
            v-if="infoBlock.mediaKind === 'video'"
            class="info-media info-media--video"
            :src="infoBlock.mediaSrc"
            autoplay
            muted
            loop
            playsinline
            preload="auto"
          ></video>

          <img
            v-else
            class="info-media"
            :src="infoBlock.mediaSrc"
            :alt="infoBlock.mediaAlt"
            decoding="async"
          />
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped src="./InfoOnPicture.css"></style>
