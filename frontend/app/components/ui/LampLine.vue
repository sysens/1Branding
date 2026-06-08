<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const root = ref<HTMLElement | null>(null);
const isVisible = ref(false);

let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (!root.value) return;

  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      isVisible.value = true;
      observer?.disconnect();
      observer = null;
    },
    {
      threshold: 0.35,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <div ref="root" class="lamp-line" :class="{ 'lamp-line--visible': isVisible }">
    <div class="lamp-line__beams">
      <div class="lamp-line__beam lamp-line__beam--left"></div>
      <div class="lamp-line__beam lamp-line__beam--right"></div>
      <div class="lamp-line__mask lamp-line__mask--top"></div>
      <div class="lamp-line__glow lamp-line__glow--wide"></div>
      <div class="lamp-line__glow lamp-line__glow--core"></div>
      <div class="lamp-line__stroke"></div>
    </div>
  </div>
</template>

<style scoped>
.lamp-line {
  --lamp-color: #03cb00;
  --lamp-bg: #000000;

  position: relative;
  width: min(78vw, 44rem);
  height: clamp(4.5rem, 8vw, 7rem);
  margin-inline: auto;
  overflow: hidden;
}

.lamp-line__beams {
  position: absolute;
  inset: 0;
  isolation: isolate;
  transform: scaleY(1.08);
}

.lamp-line__beam {
  position: absolute;
  top: 0.2rem;
  height: 5.5rem;
  width: 13rem;
  opacity: 0.3;
  transition:
    width 0.8s ease-in-out,
    opacity 0.8s ease-in-out;
}

.lamp-line--visible .lamp-line__beam {
  width: 22rem;
  opacity: 0.95;
}

.lamp-line__beam--left {
  right: 50%;
  background-image: conic-gradient(from 70deg at center top, var(--lamp-color), transparent, transparent);
}

.lamp-line__beam--right {
  left: 50%;
  background-image: conic-gradient(from 290deg at center top, transparent, transparent, var(--lamp-color));
}

.lamp-line__beam::before,
.lamp-line__beam::after {
  content: "";
  position: absolute;
  z-index: 2;
  background: var(--lamp-bg);
}

.lamp-line__beam--left::before,
.lamp-line__beam--right::before {
  bottom: 0;
  width: 100%;
  height: 3.6rem;
  mask-image: linear-gradient(to top, #000, transparent);
}

.lamp-line__beam--left::after {
  bottom: 0;
  left: 0;
  width: 5rem;
  height: 100%;
  mask-image: linear-gradient(to right, #000, transparent);
}

.lamp-line__beam--right::after {
  right: 0;
  bottom: 0;
  width: 5rem;
  height: 100%;
  mask-image: linear-gradient(to left, #000, transparent);
}

.lamp-line__mask {
  position: absolute;
  left: 50%;
  top: -0.2rem;
  z-index: 5;
  width: 100vw;
  height: 2.8rem;
  transform: translateX(-50%);
  background: var(--lamp-bg);
}

.lamp-line__glow {
  position: absolute;
  left: 50%;
  z-index: 4;
  transform: translateX(-50%);
  border-radius: 9999px;
  background: var(--lamp-color);
  opacity: 0.22;
  filter: blur(2.5rem);
  transition:
    width 0.8s ease-in-out,
    opacity 0.8s ease-in-out;
}

.lamp-line__glow--wide {
  top: 0.9rem;
  width: 14rem;
  height: 3.8rem;
}

.lamp-line__glow--core {
  top: 1.15rem;
  width: 8rem;
  height: 2.2rem;
  filter: blur(1.25rem);
}

.lamp-line--visible .lamp-line__glow--wide {
  width: 31rem;
  opacity: 0.42;
}

.lamp-line--visible .lamp-line__glow--core {
  width: 17rem;
  opacity: 0.78;
}

.lamp-line__stroke {
  position: absolute;
  left: 50%;
  top: 1.2rem;
  z-index: 6;
  width: 12rem;
  height: 0.12rem;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, #b8ffb2 15%, var(--lamp-color) 50%, #b8ffb2 85%, transparent);
  box-shadow:
    0 0 0.8rem rgba(3, 203, 0, 0.9),
    0 0 2rem rgba(3, 203, 0, 0.55);
  transition: width 0.8s ease-in-out;
}

.lamp-line--visible .lamp-line__stroke {
  width: min(100%, 34rem);
}
</style>
