<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

type GsapContext = {
  revert: () => void;
};

type ScaleValues = {
  from: number;
  to: number;
};

const DESKTOP_INITIAL_ROTATE_X_DEG = 58;
const MOBILE_INITIAL_ROTATE_X_DEG = 42;

const containerRef = ref<HTMLElement | null>(null);
const headerRef = ref<HTMLElement | null>(null);
const cardRef = ref<HTMLElement | null>(null);

let ctx: GsapContext | null = null;
let resizeTimer: ReturnType<typeof setTimeout> | null = null;

const getScaleDimensions = (): ScaleValues => {
  if (!process.client) {
    return { from: 1.05, to: 1 };
  }

  return window.innerWidth <= 768
    ? { from: 0.7, to: 0.9 }
    : { from: 1.05, to: 1 };
};

const getInitialRotateX = () => {
  if (!process.client) {
    return DESKTOP_INITIAL_ROTATE_X_DEG;
  }

  return window.innerWidth <= 768
    ? MOBILE_INITIAL_ROTATE_X_DEG
    : DESKTOP_INITIAL_ROTATE_X_DEG;
};

const initScrollAnimation = async () => {
  await nextTick();

  if (!containerRef.value || !headerRef.value || !cardRef.value) {
    return;
  }

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");

  gsap.registerPlugin(ScrollTrigger);

  ctx?.revert();
  ctx = null;

  ctx = gsap.context(() => {
    const scale = getScaleDimensions();

    gsap.set(headerRef.value, {
      y: 0,
      willChange: "transform",
    });

    gsap.set(cardRef.value, {
      rotateX: getInitialRotateX(),
      scale: scale.from,
      transformPerspective: 1000,
      transformOrigin: "center top",
      willChange: "transform",
    });

    gsap.to(headerRef.value, {
      y: -100,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.value,
        start: "top 65%",
        end: "bottom 20%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    gsap.to(cardRef.value, {
      rotateX: 0,
      scale: scale.to,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.value,
        start: "top 65%",
        end: "bottom 20%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
  }, containerRef.value);
};

const scheduleRefresh = () => {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }

  resizeTimer = setTimeout(() => {
    resizeTimer = null;
    void initScrollAnimation();
  }, 160);
};

onMounted(async () => {
  await initScrollAnimation();
  window.addEventListener("resize", scheduleRefresh);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", scheduleRefresh);

  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }

  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div ref="containerRef" class="container-scroll">
    <div class="container-scroll__stage">
      <div ref="headerRef" class="container-scroll__header">
        <slot name="title" />
      </div>

      <div ref="cardRef" class="container-scroll__card">
        <div class="container-scroll__viewport">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container-scroll {
  position: relative;
  display: flex;
  height: 60rem;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.container-scroll__stage {
  position: relative;
  width: 100%;
  padding-block: 2.5rem;
  perspective: 1000px;
}

.container-scroll__header {
  position: relative;
  z-index: 1;
  max-width: 64rem;
  margin-inline: auto;
  text-align: center;
}

.container-scroll__card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 64rem;
  height: 30rem;
  margin: -7.25rem auto 0;
  padding: 0.5rem;
  border: 4px solid #6c6c6c;
  border-radius: 30px;
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
  border-radius: 16px;
  background: #18181b;
}

@media (min-width: 768px) {
  .container-scroll {
    height: 80rem;
    padding: 5rem;
  }

  .container-scroll__stage {
    padding-block: 8.5rem 10rem;
  }

  .container-scroll__card {
    height: 40rem;
    margin-top: -9.25rem;
    padding: 1.5rem;
  }

  .container-scroll__viewport {
    border-radius: 16px;
    padding: 1rem;
  }
}
</style>
