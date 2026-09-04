<script setup lang="ts">
import { useTemplateRef } from "vue";
import ContainerScrollAnimation from "~/components/ui/container-scroll-animation.vue";
import { useBidirectionalScrollVideo } from "~/composables/useBidirectionalScrollVideo";

const forwardVideoRef = useTemplateRef<HTMLVideoElement>("forwardVideoRef");
const reverseVideoRef = useTemplateRef<HTMLVideoElement>("reverseVideoRef");
const { activeDirection, handleScrollProgress } = useBidirectionalScrollVideo(
  forwardVideoRef,
  reverseVideoRef
);
</script>

<template>
  <ContainerScrollAnimation @scroll-progress="handleScrollProgress">
    <template #title>
      <div class="project-tablet__copy">
        <h2 class="project-tablet__title">
          We build digital experiences<br />
          that feel <span>premium</span> work flawlessly
        </h2>
        <p class="project-tablet__description">
          and turn every interaction into a stronger connection between the
          brand and its audience.
        </p>
      </div>
    </template>

    <div
      class="project-tablet__media"
      role="img"
      aria-label="OneBranding digital project showcase"
    >
      <video
        ref="forwardVideoRef"
        class="project-tablet__video"
        :class="{
          'project-tablet__video--active': activeDirection === 'forward',
        }"
        src="/home/video-forward.mp4"
        muted
        playsinline
        preload="auto"
        aria-hidden="true"
      ></video>

      <video
        ref="reverseVideoRef"
        class="project-tablet__video"
        :class="{
          'project-tablet__video--active': activeDirection === 'reverse',
        }"
        src="/home/video-reverse.mp4"
        muted
        playsinline
        preload="auto"
        aria-hidden="true"
      ></video>
    </div>
  </ContainerScrollAnimation>
</template>

<style scoped>
.project-tablet__copy {
  color: #ffffff;
  font-family: var(
    --app-font-display,
    "SF Pro Display",
    "SF Pro Text",
    sans-serif
  );
  text-align: center;
}

.project-tablet__title {
  margin: 0;
  font-size: clamp(2.5rem, 5.4vw, 5.25rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: 0;
}

.project-tablet__title span {
  color: #03cb00;
}

.project-tablet__description {
  max-width: 58rem;
  margin: clamp(0.8rem, 1.6vw, 1.25rem) auto 0;
  color: #ffffff;
  font-size: clamp(1rem, 1.45vw, 1.45rem);
  line-height: 1.35;
}

.project-tablet__media {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000000;
}

.project-tablet__video {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 80ms linear;
}

.project-tablet__video--active {
  opacity: 1;
}
</style>
