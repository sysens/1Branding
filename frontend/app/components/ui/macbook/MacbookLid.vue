<script setup lang="ts">
import { onMounted, ref } from "vue";
import { motion, type MotionValue } from "motion-v";
import { w1280Srcset } from "~/utils/responsiveImage";

defineProps<{
  src?: string;
  alt: string;
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  rotate: MotionValue<number>;
  translate: MotionValue<number>;
}>();

// The screenshot is added after hydration (the section hydrates as it nears the
// viewport), keeping it out of the requests made for the first screen.
const mounted = ref(false);
onMounted(() => { mounted.value = true; });
</script>

<template>
  <div class="macbook-lid">
    <div class="macbook-lid__back" aria-hidden="true">
      <div class="macbook-lid__inside">
        <svg width="12" height="12" viewBox="0 0 66 65" fill="none">
          <path
            d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
            stroke="currentColor" stroke-width="15" stroke-miterlimit="3.86874" stroke-linecap="round"
          />
        </svg>
      </div>
    </div>
    <motion.img
      v-if="src && mounted" :src="src" :alt="alt" width="512" height="384" loading="lazy" decoding="async"
      :srcset="w1280Srcset(src)"
      :sizes="w1280Srcset(src) ? '(max-width: 767px) 700px, 2560px' : undefined"
      class="macbook-scroll__screen"
      :style="{ scaleX, scaleY, rotateX: rotate, translateY: translate, transformStyle: 'flat', transformOrigin: 'top' }"
    />
  </div>
</template>

<style scoped>
.macbook-lid { position: relative; perspective: 50rem; }
.macbook-lid__back {
  position: relative;
  width: 32rem;
  height: 12rem;
  padding: 0.5rem;
  border-radius: 1rem;
  background: #010101;
  transform: perspective(50rem) rotateX(-25deg) translateZ(0);
  transform-origin: bottom;
  transform-style: preserve-3d;
}
.macbook-lid__inside {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: #010101;
  box-shadow: 0 0.125rem 0 0.125rem #171717 inset;
  color: white;
}
.macbook-scroll__screen {
  position: absolute;
  inset: 0;
  width: 32rem;
  height: 24rem;
  padding: 0.5rem;
  border-radius: 1rem;
  background: #010101;
  display: block;
  object-fit: cover;
  object-position: left top;
}
</style>
