<script setup lang="ts">
import Sparkles from "~/components/ui/Sparkles.vue";
</script>

<template>
  <div class="footer-brand-sparkles">
    <h2 class="footer-brand-sparkles__title">
      <span>One</span>branding
    </h2>

    <div class="footer-brand-sparkles__stage" aria-hidden="true">
      <div class="footer-brand-sparkles__glow"/>
      <div class="footer-brand-sparkles__line footer-brand-sparkles__line--soft"/>
      <div class="footer-brand-sparkles__line footer-brand-sparkles__line--sharp"/>
      <div class="footer-brand-sparkles__line footer-brand-sparkles__line--core-soft"/>
      <div class="footer-brand-sparkles__line footer-brand-sparkles__line--core"/>

      <Sparkles
        class="footer-brand-sparkles__particles"
        background="transparent"
        :min-size="0.6"
        :max-size="1.6"
        :particle-density="2600"
        particle-color="#ffffff"
        :speed="0.42"
      />

      <div class="footer-brand-sparkles__edge-mask"/>
    </div>
  </div>
</template>

<style scoped>
.footer-brand-sparkles {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  overflow: visible;
  text-align: center;
}

.footer-brand-sparkles__title {
  position: relative;
  z-index: 2;
  margin: 0;
  color: #ffffff;
  /* The display-s step (96px at 1440, 44 on a phone). */
  font-family: var(--app-font-display);
  font-size: var(--type-display-s-size);
  font-weight: 700;
  line-height: var(--type-display-s-lh);
  letter-spacing: var(--type-display-s-ls);
}

.footer-brand-sparkles__title span {
  color: #03cb00;
}

.footer-brand-sparkles__stage {
  position: relative;
  width: min(54rem, 94vw);
  height: clamp(8rem, 13vw, 12rem);
  margin-top: 0.05rem;
  overflow: hidden;
}

/* green light spilling down from the line */
.footer-brand-sparkles__glow {
  position: absolute;
  top: -0.6rem;
  left: 50%;
  transform: translateX(-50%);
  width: 86%;
  height: 78%;
  background: radial-gradient(
    62% 64% at 50% 0%,
    rgba(3, 203, 0, 0.5) 0%,
    rgba(3, 203, 0, 0.24) 32%,
    rgba(3, 203, 0, 0.08) 56%,
    transparent 74%
  );
  filter: blur(6px);
  pointer-events: none;
}

.footer-brand-sparkles__line {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.footer-brand-sparkles__line--soft {
  width: 96%;
  height: 0.18rem;
  background: linear-gradient(90deg, transparent, rgba(3, 203, 0, 0.98), transparent);
  filter: blur(0.24rem);
}

.footer-brand-sparkles__line--sharp {
  width: 96%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #03cb00, transparent);
}

.footer-brand-sparkles__line--core-soft {
  width: 46%;
  height: 0.5rem;
  background: linear-gradient(90deg, transparent, #86ff80, transparent);
  filter: blur(0.4rem);
}

.footer-brand-sparkles__line--core {
  width: 46%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #d6ffd2, transparent);
}

.footer-brand-sparkles__particles {
  position: absolute;
  inset: 0;
}

.footer-brand-sparkles__edge-mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #000000;
  pointer-events: none;
  -webkit-mask-image: radial-gradient(74% 300px at top, transparent 42%, #000000 90%);
  mask-image: radial-gradient(74% 300px at top, transparent 42%, #000000 90%);
}

@media (max-width: 640px) {
  .footer-brand-sparkles__stage {
    width: min(34rem, 94vw);
    height: 8.5rem;
  }
}
</style>
