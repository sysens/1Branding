<script setup lang="ts">
// Parked for the upcoming Services page: the Quaker packaging showcase that
// used to close the landing's "ONE" section (InfoOnPicture.vue). It is not
// mounted anywhere yet; drop <ServicesQuakerShowcase /> into the Services page.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import QuakerFrames from "~/components/home/QuakerFrames.vue";

type MediaKind = "image" | "video";
type GsapContext = { revert: () => void };
type Media = { url?: string | null; alternativeText?: string | null } | null;

const props = withDefaults(
  defineProps<{
    /** Optional CMS media replacing the Quaker frames (image or video). */
    image?: Media;
    /** Fallback alt text when the media has none. */
    title?: string | null;
  }>(),
  { image: null, title: null },
);

const QUAKER_FRAMES = [
  "/home/Quaker.webp",
  "/home/Quaker 2.webp",
  "/home/Quaker 3.webp",
  "/home/Quaker 4.webp",
  "/home/Quaker 5.webp",
  "/home/Quaker 6.webp",
  "/home/Quaker 7.webp",
  "/home/Quaker 8.webp",
] as const;

const cmsMedia = useCmsMedia();

const resolveMedia = (url?: string | null) =>
  url?.startsWith("/home/") || url?.startsWith("/General/") ? url : cmsMedia(url);

const media = computed(() => {
  const src = resolveMedia(props.image?.url) || QUAKER_FRAMES[0];
  return {
    src,
    kind: (/\.(mp4|webm|mov)(?:[?#].*)?$/i.test(src) ? "video" : "image") as MediaKind,
    alt: props.image?.alternativeText?.trim() || props.title?.trim() || "",
    quaker: QUAKER_FRAMES.some((frame) => frame === src),
  };
});

const root = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
let ctx: GsapContext | null = null;
let inited = false;

// Rises into place the first time it comes near the screen.
const reveal = async () => {
  if (inited || !root.value) return;
  inited = true;
  await nextTick();
  const el = root.value;
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
    gsap.set(el, { y: 56, opacity: 0, scale: 0.96 });
    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => gsap.to(el, { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }),
    });
    requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
  }, el);
};

onMounted(() => {
  if (!root.value) return;
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) void reveal();
    },
    { threshold: 0, rootMargin: "250px 0px 250px 0px" },
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
  <div ref="root" class="quaker-showcase will-change-transform">
    <QuakerFrames v-if="media.quaker" :frames="QUAKER_FRAMES" :alt="media.alt" />

    <video
      v-else-if="media.kind === 'video'"
      class="quaker-showcase__media"
      :src="media.src"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
    ></video>

    <img
      v-else
      class="quaker-showcase__media"
      :src="media.src"
      :alt="media.alt"
      loading="lazy"
      decoding="async"
    />
  </div>
</template>

<style scoped>
.quaker-showcase {
  --showcase-surface: #fff4df;
  position: relative;
  width: 100%;
  /* The Quaker frames are 3:2 with the pack ending at ~87% of their height;
     following their ratio keeps the whole pack (incl. the quality badge) in view
     on wide screens instead of cover-cropping the bottom off. */
  aspect-ratio: 3 / 2;
  min-height: 30rem;
  overflow: hidden;
  background: var(--showcase-surface);
}

.quaker-showcase::before {
  position: absolute;
  inset: 0 0 auto;
  z-index: 2;
  height: clamp(4rem, 10vw, 9rem);
  content: "";
  pointer-events: none;
  background: linear-gradient(180deg, var(--showcase-surface) 0%, rgba(255, 244, 223, 0) 100%);
}

.quaker-showcase__media {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
  object-position: center top;
}

@media (min-width: 768px) and (max-width: 1023px) {
  .quaker-showcase {
    min-height: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .quaker-showcase {
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
