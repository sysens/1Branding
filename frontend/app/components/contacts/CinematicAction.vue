<script setup lang="ts">
import { ref } from "vue";

defineProps<{ to: string }>();
const lightX = ref("calc(100% - 6px)");
const moveLight = (event: PointerEvent) => {
  if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  const rect = target.getBoundingClientRect();
  lightX.value = `${Math.max(6, Math.min(rect.width - 6, event.clientX - rect.left))}px`;
};
const resetLight = () => { lightX.value = "calc(100% - 6px)"; };
</script>

<template>
  <span class="cinematic-action" :style="{ '--light-x': lightX }">
    <span class="cinematic-action__halo" aria-hidden="true" />
    <NuxtLink
      :to="to" class="cinematic-action__link"
      @pointerenter="moveLight" @pointermove="moveLight" @pointerleave="resetLight"
      @focus="lightX = '50%'" @blur="resetLight"
    >
      <span class="cinematic-action__light" aria-hidden="true">
        <span class="cinematic-action__warm" />
        <span class="cinematic-action__core" />
      </span>
      <span class="cinematic-action__label"><slot /></span>
    </NuxtLink>
  </span>
</template>

<style scoped>
.cinematic-action {
  position: relative;
  display: inline-flex;
  width: 174px;
  height: 40px;
  isolation: isolate;
  vertical-align: middle;
}
.cinematic-action__link {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid #ffffff99;
  border-radius: 999px;
  background: #d1d1d1;
  color: #5a250a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
  text-decoration: none;
}
.cinematic-action__light {
  position: absolute;
  left: var(--light-x);
  top: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  transition: left 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.cinematic-action__halo {
  position: absolute;
  inset: -4px;
  z-index: -1;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(5px);
}
.cinematic-action__halo::before {
  position: absolute;
  inset: 0;
  padding: 4px;
  border-radius: inherit;
  content: "";
  background: radial-gradient(ellipse 70px 45px at var(--light-x) 50%, #ff7735, #ff531bb3 42%, transparent 100%);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
.cinematic-action__light { width: 204px; height: 121px; }
.cinematic-action__warm,
.cinematic-action__core {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.cinematic-action__warm {
  width: 121px;
  height: 121px;
  background: radial-gradient(#fffff5 3.5%, #ffaa81 26.5%, #ffda9f 37.5%, #ffaa8180 49%, #d26a3a00 92.5%);
}
.cinematic-action__core {
  width: 204px;
  height: 103px;
  filter: blur(5px);
  background: radial-gradient(ellipse, #fffff7 29%, #fffacd 48.5%, #f4d2bf 60.71%, #d6d3d200 100%);
}
.cinematic-action__label { position: relative; z-index: 1; }
.cinematic-action__link:focus-visible { outline: 2px solid white; outline-offset: 4px; }
@media (prefers-reduced-motion: reduce) {
  .cinematic-action { --light-x: 50% !important; }
  .cinematic-action__light { transition: none; }
}
</style>
