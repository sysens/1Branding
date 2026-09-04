<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef } from "vue";
import ContainerScrollAnimation from "~/components/ui/container-scroll-animation.vue";

type PlaybackDirection = "forward" | "reverse";

const SCROLL_STOP_DELAY_MS = 160;
const VIDEO_END_EPSILON_SECONDS = 1 / 30;

const forwardVideoRef = useTemplateRef<HTMLVideoElement>("forwardVideoRef");
const reverseVideoRef = useTemplateRef<HTMLVideoElement>("reverseVideoRef");
const activeDirection = ref<PlaybackDirection>("forward");

let previousProgress: number | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

const getActiveVideo = () =>
  activeDirection.value === "forward"
    ? forwardVideoRef.value
    : reverseVideoRef.value;

const pauseVideos = () => {
  forwardVideoRef.value?.pause();
  reverseVideoRef.value?.pause();
};

const clearStopTimer = () => {
  if (!stopTimer) return;

  clearTimeout(stopTimer);
  stopTimer = null;
};

const getTimelineRatio = () => {
  const forwardVideo = forwardVideoRef.value;
  const reverseVideo = reverseVideoRef.value;

  if (
    !forwardVideo ||
    !reverseVideo ||
    !Number.isFinite(forwardVideo.duration) ||
    !Number.isFinite(reverseVideo.duration) ||
    forwardVideo.duration <= 0 ||
    reverseVideo.duration <= 0
  ) {
    return 0;
  }

  if (activeDirection.value === "forward") {
    return Math.min(Math.max(forwardVideo.currentTime / forwardVideo.duration, 0), 1);
  }

  return Math.min(
    Math.max(1 - reverseVideo.currentTime / reverseVideo.duration, 0),
    1
  );
};

const syncVideoToTimeline = (
  video: HTMLVideoElement,
  direction: PlaybackDirection,
  timelineRatio: number
) => {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;

  const lastStableFrame = Math.max(
    video.duration - VIDEO_END_EPSILON_SECONDS,
    0
  );
  const directionalRatio =
    direction === "forward" ? timelineRatio : 1 - timelineRatio;

  video.currentTime = directionalRatio * lastStableFrame;
};

const startPlayback = (direction: PlaybackDirection) => {
  const timelineRatio = getTimelineRatio();

  if (direction !== activeDirection.value) {
    pauseVideos();
    activeDirection.value = direction;

    const targetVideo = getActiveVideo();

    if (targetVideo) {
      syncVideoToTimeline(targetVideo, direction, timelineRatio);
    }
  }

  const activeVideo = getActiveVideo();

  if (activeVideo?.paused) {
    void activeVideo.play().catch(() => undefined);
  }
};

const scheduleStop = () => {
  clearStopTimer();

  stopTimer = setTimeout(() => {
    stopTimer = null;
    pauseVideos();
  }, SCROLL_STOP_DELAY_MS);
};

const handleScrollProgress = (progress: number) => {
  if (previousProgress === null) {
    previousProgress = progress;
    return;
  }

  const progressDelta = progress - previousProgress;
  previousProgress = progress;

  if (Math.abs(progressDelta) < 0.00001) return;

  startPlayback(progressDelta > 0 ? "forward" : "reverse");
  scheduleStop();
};

onBeforeUnmount(() => {
  clearStopTimer();
  pauseVideos();
});
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
        src="/home/video.mp4"
        muted
        loop
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
        loop
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
