<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

type GsapContext = {
  revert: () => void;
};

const root = ref<HTMLElement | null>(null);
const header = ref<HTMLElement | null>(null);
const card = ref<HTMLElement | null>(null);

let ctx: GsapContext | null = null;
let resizeTimer: ReturnType<typeof setTimeout> | null = null;

const getScaleValues = () => {
  if (!process.client) {
    return { from: 1.04, to: 1 };
  }

  return window.innerWidth <= 768
    ? { from: 0.84, to: 0.94 }
    : { from: 1.04, to: 1 };
};

const getAnimationEnd = () => {
  if (!process.client) {
    return "+=280";
  }

  return `+=${Math.round(Math.min(Math.max(window.innerHeight * 0.32, 230), 320))}`;
};

const initAnimation = async () => {
  await nextTick();

  if (!root.value || !header.value || !card.value) {
    return;
  }

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");

  gsap.registerPlugin(ScrollTrigger);

  ctx?.revert();
  ctx = null;

  ctx = gsap.context(() => {
    const scale = getScaleValues();

    gsap.set(header.value, {
      y: 0,
      willChange: "transform",
    });

    gsap.set(card.value, {
      rotateX: 22,
      scale: scale.from,
      transformPerspective: 1000,
      transformOrigin: "center center",
      willChange: "transform",
    });

    gsap.to(header.value, {
      y: -100,
      ease: "none",
      scrollTrigger: {
        trigger: root.value,
        start: "top top",
        end: getAnimationEnd,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    gsap.to(card.value, {
      rotateX: 0,
      scale: scale.to,
      ease: "none",
      scrollTrigger: {
        trigger: root.value,
        start: "top top",
        end: getAnimationEnd,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
  }, root.value);
};

const scheduleAnimationRefresh = () => {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }

  resizeTimer = setTimeout(() => {
    resizeTimer = null;
    void initAnimation();
  }, 160);
};

onMounted(async () => {
  await initAnimation();
  window.addEventListener("resize", scheduleAnimationRefresh);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", scheduleAnimationRefresh);

  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }

  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <section ref="root" class="container-scroll">
    <div class="container-scroll__inner">
      <div ref="header" class="container-scroll__header">
        <slot name="title" />
      </div>

      <div ref="card" class="container-scroll__card">
        <div class="container-scroll__viewport">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.container-scroll {
  position: relative;
  display: flex;
  min-height: clamp(40rem, 94svh, 53rem);
  align-items: flex-start;
  justify-content: center;
  padding: clamp(5.75rem, 11svh, 7.25rem) clamp(0.75rem, 5vw, 5rem) clamp(2.5rem, 6svh, 4rem);
  background: #09090b;
  isolation: isolate;
}

.container-scroll::before,
.container-scroll::after {
  position: absolute;
  left: 0;
  z-index: 3;
  width: 100%;
  content: "";
  pointer-events: none;
}

.container-scroll::before {
  top: 0;
  height: clamp(7rem, 16svh, 11rem);
  background:
    radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.18), transparent 58%),
    linear-gradient(180deg, rgba(9, 9, 11, 0.98) 0%, rgba(9, 9, 11, 0.54) 40%, rgba(9, 9, 11, 0) 100%);
  filter: blur(12px);
}

.container-scroll::after {
  bottom: 0;
  height: clamp(6rem, 12svh, 9rem);
  background:
    radial-gradient(ellipse at center bottom, rgba(255, 255, 255, 0.14), transparent 58%),
    linear-gradient(0deg, rgba(9, 9, 11, 0.95) 0%, rgba(9, 9, 11, 0.42) 44%, rgba(9, 9, 11, 0) 100%);
  filter: blur(12px);
}

.container-scroll__inner {
  position: relative;
  z-index: 1;
  width: min(100%, 68rem);
  padding-block: 0 clamp(2.5rem, 6vw, 5.5rem);
  perspective: 1000px;
}

.container-scroll__header {
  position: relative;
  z-index: 1;
  margin-inline: auto;
  max-width: 68rem;
  text-align: center;
}

.container-scroll__card {
  position: relative;
  z-index: 2;
  width: min(100%, 68rem);
  height: clamp(24rem, 40vw, 34rem);
  margin: -1.6rem auto 0;
  padding: clamp(0.5rem, 1.25vw, 1.25rem);
  overflow: hidden;
  border: 0.25rem solid #6c6c6c;
  border-radius: clamp(1.35rem, 2.4vw, 2rem);
  background: #222222;
  box-shadow:
    0 0 0 rgba(0, 0, 0, 0.3),
    0 9px 20px rgba(0, 0, 0, 0.29),
    0 37px 37px rgba(0, 0, 0, 0.26),
    0 84px 50px rgba(0, 0, 0, 0.15),
    0 149px 60px rgba(0, 0, 0, 0.04),
    0 233px 65px rgba(0, 0, 0, 0.01);
}

.container-scroll__viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: clamp(1rem, 1.8vw, 1.5rem);
  background: #18181b;
}

@media (max-width: 767px) {
  .container-scroll {
    min-height: clamp(37rem, 94svh, 46rem);
    padding-block: 5.75rem 3.5rem;
  }

  .container-scroll__inner {
    padding-block: 0 4rem;
  }

  .container-scroll__card {
    height: clamp(18rem, 62vw, 24rem);
    margin-top: -2rem;
  }
}
</style>
