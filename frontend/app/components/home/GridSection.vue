<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import type { LandingSection7 } from "~/types/landingPayload";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
type GsapContext = { revert: () => void };

const props = withDefaults(
  defineProps<{
    section?: LandingSection7 | null;
  }>(),
  {
    section: null,
  }
);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

const sectionTitle = computed(() => props.section?.title ?? "");

const imagesRaw = computed(() => props.section?.images ?? []);

const images = computed(() => {
  const arr = [...imagesRaw.value];
  arr.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return ta - tb;
  });
  return arr;
});

const imgAt = (i: number) =>
  resolveMedia(images.value[i]?.url ?? null) || "/home/aaaa.png";

const root = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let ctx: GsapContext | null = null;
let inited = false;

const initGsap = async () => {
  if (inited || !root.value) return;
  inited = true;

  await nextTick();

  const gsapModule = await import("gsap");
  const stModule = await import("gsap/ScrollTrigger");

  const gsap = gsapModule.gsap;
  const ScrollTrigger = stModule.ScrollTrigger;

  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
    const el = root.value!;

    const leftEls = el.querySelectorAll(".div1, .div2");
    const rightEls = el.querySelectorAll(".div4, .div5");
    const midEl = el.querySelector(".div3");
    const bottomEl = el.querySelector(".div6");
    const titleEl = el.querySelector("h1");

    if (titleEl) {
      gsap.set(titleEl, { y: 40, opacity: 0 });
    }

    if (leftEls.length) {
      gsap.set(leftEls, { x: -160, opacity: 0 });
    }

    if (rightEls.length) {
      gsap.set(rightEls, { x: 160, opacity: 0 });
    }

    if (midEl) {
      gsap.set(midEl, { scale: 0.94, opacity: 0, y: 30 });
    }

    if (bottomEl) {
      gsap.set(bottomEl, { y: 140, opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 30%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: {
            ease: "power3.out",
          },
        });

        if (titleEl) {
          tl.to(
            titleEl,
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
            },
            0
          );
        }

        if (midEl) {
          tl.to(
            midEl,
            {
              scale: 1,
              y: 0,
              opacity: 1,
              duration: 0.95,
            },
            0.08
          );
        }

        if (leftEls.length) {
          tl.to(
            leftEls,
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.12,
            },
            0.16
          );
        }

        if (rightEls.length) {
          tl.to(
            rightEls,
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.12,
            },
            0.2
          );
        }

        if (bottomEl) {
          tl.to(
            bottomEl,
            {
              y: 0,
              opacity: 1,
              duration: 0.85,
            },
            0.34
          );
        }
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
    { threshold: 0.15 }
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
  <div class="">
    <div ref="root" class="containerr grid-section-shell">
      <h1
        class="font-normal md:text-[3.875rem] pb-[31px] text-white md:leading-[150%] md:tracking-[-0.04em] text-[40px] leading-[100%] tracking-[0] text-center"
      >
        {{ sectionTitle }}
      </h1>

      <div class="parent">
        <div class="card div1">
          <img class="img" :src="imgAt(0)" alt="" />
        </div>
        <div class="card div2">
          <img class="img" :src="imgAt(1)" alt="" />
        </div>
        <div class="card div3">
          <img class="img" :src="imgAt(2)" alt="" />
        </div>
        <div class="card div4">
          <img class="img" :src="imgAt(3)" alt="" />
        </div>
        <div class="card div5">
          <img class="img" :src="imgAt(4)" alt="" />
        </div>
        <div class="card div6">
          <img class="img" :src="imgAt(5)" alt="" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.v {
  padding: 40px 0;
  min-height: 100vh;
}

.grid-section-shell {
  margin-top: clamp(6rem, 12vw, 14rem);
}

.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 25px;
}

.card {
  border-radius: 30px;
  overflow: hidden;
  background: #0b0b0b;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.6);
}

.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.div1 {
  grid-area: 1 / 1 / 3 / 2;
  height: 625px;
}

.div2 {
  grid-area: 3 / 1 / 4 / 2;
  height: 300px;
}

.div3 {
  grid-area: 1 / 2 / 4 / 3;
  height: 950px;
}

.div4 {
  grid-area: 1 / 3 / 2 / 4;
  height: 300px;
}

.div5 {
  grid-area: 2 / 3 / 4 / 4;
  height: 625px;
}

.div6 {
  grid-area: 4 / 1 / 5 / 4;
  height: 441px;
}

@media (max-width: 767px) {
  .parent {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .div1,
  .div2,
  .div3,
  .div4,
  .div5,
  .div6 {
    grid-area: auto !important;
    height: 173px !important;
  }

  .card {
    height: 173px !important;
    border-radius: 20px;
  }

  .img {
    height: 173px !important;
  }
}
</style>
