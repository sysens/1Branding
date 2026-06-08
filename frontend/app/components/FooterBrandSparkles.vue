<script setup lang="ts">
import Sparkles from "~/components/ui/sparkles.vue";
</script>

<template>
  <div class="footer-brand-sparkles">
    <h2 class="footer-brand-sparkles__title">
      <span>One</span>branding
    </h2>

    <div class="footer-brand-sparkles__stage" aria-hidden="true">
      <div class="footer-brand-sparkles__line footer-brand-sparkles__line--soft"></div>
      <div class="footer-brand-sparkles__line footer-brand-sparkles__line--sharp"></div>
      <div class="footer-brand-sparkles__line footer-brand-sparkles__line--core-soft"></div>
      <div class="footer-brand-sparkles__line footer-brand-sparkles__line--core"></div>

      <Sparkles
        class="footer-brand-sparkles__particles"
        background="transparent"
        :min-size="0.45"
        :max-size="1"
        :particle-density="1200"
        particle-color="#ffffff"
        :speed="0.42"
      />

      <div class="footer-brand-sparkles__edge-mask"></div>
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
  font-size: clamp(3.4rem, 7.2vw, 6.25rem);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: 0;
}

.footer-brand-sparkles__title span {
  color: #03cb00;
}

.footer-brand-sparkles__stage {
  position: relative;
  width: min(40rem, 86vw);
  height: clamp(7rem, 11vw, 10rem);
  margin-top: 0.05rem;
  overflow: hidden;
}

.footer-brand-sparkles__line {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.footer-brand-sparkles__line--soft {
  width: 76%;
  height: 0.14rem;
  background: linear-gradient(90deg, transparent, rgba(3, 203, 0, 0.95), transparent);
  filter: blur(0.22rem);
}

.footer-brand-sparkles__line--sharp {
  width: 76%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #03cb00, transparent);
}

.footer-brand-sparkles__line--core-soft {
  width: 27%;
  height: 0.36rem;
  background: linear-gradient(90deg, transparent, #86ff80, transparent);
  filter: blur(0.35rem);
}

.footer-brand-sparkles__line--core {
  width: 27%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #b8ffb2, transparent);
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
  -webkit-mask-image: radial-gradient(350px 200px at top, transparent 20%, #000000 72%);
  mask-image: radial-gradient(350px 200px at top, transparent 20%, #000000 72%);
}

@media (max-width: 640px) {
  .footer-brand-sparkles__title {
    font-size: clamp(3rem, 17vw, 4.6rem);
  }

  .footer-brand-sparkles__stage {
    width: min(34rem, 94vw);
    height: 7.5rem;
  }
}
</style>
