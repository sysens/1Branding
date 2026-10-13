<!-- components/ProjectSlug/ProjectGrid.vue -->
<script setup lang="ts">
import { ref, nextTick, computed, watch } from "vue";

type Props = {
  images?: string[] | null;

  topSrc?: string | null;
  bottomLeftSrc?: string | null;
  bottomRightSrc?: string | null;

  topFallback?: string;
  bottomLeftFallback?: string;
  bottomRightFallback?: string;
};

const props = withDefaults(defineProps<Props>(), {
  images: null,

  topSrc: null,
  bottomLeftSrc: null,
  bottomRightSrc: null,

  topFallback: "/home/Rectangle 42016.png",
  bottomLeftFallback: "/home/Rectangle 42016.png",
  bottomRightFallback: "/home/Rectangle 42016.png",
});

const root = ref<HTMLElement | null>(null);
const { locale } = useI18n();
const imageAlt = (position: number) =>
  `${locale.value === "ru" ? "Галерея проекта, изображение" : "Project gallery image"} ${position}`;

const resolvedImages = computed(() => {
  const arr = (props.images ?? []).filter(Boolean);
  if (arr.length) return arr;

  return [props.topSrc, props.bottomLeftSrc, props.bottomRightSrc].filter(
    (x): x is string => !!x
  );
});

type Block =
  | { kind: "triple"; top: string; left: string; right: string }
  | { kind: "single"; src: string }
  | { kind: "double"; left: string; right: string };

const blocks = computed<Block[]>(() => {
  const list = resolvedImages.value;

  if (!list.length) {
    return [
      {
        kind: "triple",
        top: props.topFallback,
        left: props.bottomLeftFallback,
        right: props.bottomRightFallback,
      },
    ];
  }

  const out: Block[] = [];
  let i = 0;

  while (i < list.length) {
    const remaining = list.length - i;

    if (remaining === 1) {
      out.push({ kind: "single", src: list[i]! });
      break;
    }

    if (remaining === 2) {
      out.push({ kind: "double", left: list[i]!, right: list[i + 1]! });
      break;
    }

    out.push({
      kind: "triple",
      top: list[i] || props.topFallback,
      left: list[i + 1] || props.bottomLeftFallback,
      right: list[i + 2] || props.bottomRightFallback,
    });

    i += 3;
  }

  return out;
});

const { refresh } = useGsapContext(
  root,
  ({ gsap, ScrollTrigger, el }) => {
    const host = el;
    const sections = Array.from(host.querySelectorAll<HTMLElement>(".grid-block"));

    sections.forEach((section) => {
      const topImg = section.querySelector<HTMLElement>(".top-img");
      const bottomLeft = section.querySelector<HTMLElement>(".bottom-left");
      const bottomRight = section.querySelector<HTMLElement>(".bottom-right");
      const singleImg = section.querySelector<HTMLElement>(".single-img");
      const doubleLeft = section.querySelector<HTMLElement>(".double-left");
      const doubleRight = section.querySelector<HTMLElement>(".double-right");

      if (topImg) {
        gsap.set(topImg, { y: 160, opacity: 0 });
      }

      if (bottomLeft) {
        gsap.set(bottomLeft, { x: -230, opacity: 0 });
      }

      if (bottomRight) {
        gsap.set(bottomRight, { x: 230, opacity: 0 });
      }

      if (singleImg) {
        gsap.set(singleImg, { y: 160, opacity: 0 });
      }

      if (doubleLeft) {
        gsap.set(doubleLeft, { x: -230, opacity: 0 });
      }

      if (doubleRight) {
        gsap.set(doubleRight, { x: 230, opacity: 0 });
      }

      ScrollTrigger?.create({
        trigger: section,
        start: "top 80%",
        once: true,
        onEnter: () => {
          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
          });

          if (topImg) {
            tl.to(
              topImg,
              {
                y: 0,
                opacity: 1,
                duration: 0.9,
              },
              0
            );
          }

          if (singleImg) {
            tl.to(
              singleImg,
              {
                y: 0,
                opacity: 1,
                duration: 0.9,
              },
              0
            );
          }

          if (bottomLeft) {
            tl.to(
              bottomLeft,
              {
                x: 0,
                opacity: 1,
                duration: 0.85,
              },
              0.12
            );
          }

          if (bottomRight) {
            tl.to(
              bottomRight,
              {
                x: 0,
                opacity: 1,
                duration: 0.85,
              },
              0.2
            );
          }

          if (doubleLeft) {
            tl.to(
              doubleLeft,
              {
                x: 0,
                opacity: 1,
                duration: 0.85,
              },
              0.08
            );
          }

          if (doubleRight) {
            tl.to(
              doubleRight,
              {
                x: 0,
                opacity: 1,
                duration: 0.85,
              },
              0.16
            );
          }
        },
      });
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger?.refresh();
      });
    });
  },
  { scrollTrigger: true, whenVisible: { threshold: 0.15 } }
);

watch(
  () => blocks.value.length,
  async () => {
    await nextTick();
    await refresh();
  }
);

</script>

<template>
  <div ref="root">
    <div>
      <div class="containerr">
        <div v-for="(b, i) in blocks" :key="`grid-${i}`" class="grid-block">
          <div :class="i === 0 ? '' : 'pt-[10px] md:pt-[10px]'">
            <template v-if="b.kind === 'triple'">
              <div>
                <img
                  class="top-img w-full object-cover pb-[5px] md:pb-0 md:h-[700px] h-[542px] md:rounded-t-[30px] rounded-t-[20px] will-change-transform"
                  :src="b.top"
                  :alt="imageAlt(i * 3 + 1)"
                />
              </div>

              <div
                class="flex flex-col md:flex-row gap-[5px] md:pt-[10px] pt-0 md:gap-[10px]"
              >
                <img
                  class="bottom-left object-cover md:w-[33%] md:h-[531px] h-[400px] md:rounded-bl-[30px] will-change-transform"
                  :src="b.left"
                  :alt="imageAlt(i * 3 + 2)"
                />
                <img
                  class="bottom-right object-cover w-full md:h-[531px] md:max-w-[66.5%] h-[400px] md:rounded-br-[30px] rounded-b-[20px] md:rounded-b-[0px] will-change-transform"
                  :src="b.right"
                  :alt="imageAlt(i * 3 + 3)"
                />
              </div>
            </template>

            <template v-else-if="b.kind === 'single'">
              <div>
                <img
                  class="single-img w-full object-cover md:h-[700px] h-[542px] md:rounded-[30px] rounded-[20px] will-change-transform"
                  :src="b.src"
                  :alt="imageAlt(i * 3 + 1)"
                />
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col md:flex-row gap-[5px] md:gap-[10px]">
                <img
                  class="double-left object-cover w-full md:w-1/2 md:h-[531px] h-[400px] md:rounded-bl-[30px] md:rounded-tl-[30px] rounded-t-[20px] will-change-transform"
                  :src="b.left"
                  :alt="imageAlt(i * 3 + 1)"
                />
                <img
                  class="double-right object-cover w-full md:w-1/2 md:h-[531px] h-[400px] md:rounded-br-[30px] md:rounded-tr-[30px] rounded-b-[20px] will-change-transform"
                  :src="b.right"
                  :alt="imageAlt(i * 3 + 2)"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.bottom-right,
.bottom-left,
.top-img {
  object-position: center;
  object-fit: cover;
  display: block;
}
</style>
