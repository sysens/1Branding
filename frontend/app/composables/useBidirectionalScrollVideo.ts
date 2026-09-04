import { onBeforeUnmount, ref, type Ref } from "vue";

export type PlaybackDirection = "forward" | "reverse";

type VideoElementRef = Readonly<Ref<HTMLVideoElement | null>>;

type BidirectionalScrollVideoOptions = {
  stopDelayMs?: number;
  endEpsilonSeconds?: number;
  seekTimeoutMs?: number;
};

const clampUnit = (value: number) => Math.min(Math.max(value, 0), 1);

export const useBidirectionalScrollVideo = (
  forwardVideoRef: VideoElementRef,
  reverseVideoRef: VideoElementRef,
  options: BidirectionalScrollVideoOptions = {}
) => {
  const stopDelayMs = options.stopDelayMs ?? 160;
  const endEpsilonSeconds = options.endEpsilonSeconds ?? 1 / 30;
  const seekTimeoutMs = options.seekTimeoutMs ?? 500;
  const activeDirection = ref<PlaybackDirection>("forward");

  let previousProgress: number | null = null;
  let stopTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingDirection: PlaybackDirection | null = null;
  let switchRequestId = 0;
  let scrollActive = false;
  let disposed = false;

  const getVideo = (direction: PlaybackDirection) =>
    direction === "forward" ? forwardVideoRef.value : reverseVideoRef.value;

  const pauseVideos = () => {
    forwardVideoRef.value?.pause();
    reverseVideoRef.value?.pause();
  };

  const clearStopTimer = () => {
    if (!stopTimer) return;

    clearTimeout(stopTimer);
    stopTimer = null;
  };

  const waitForMetadata = (video: HTMLVideoElement): Promise<boolean> => {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      return Promise.resolve(Number.isFinite(video.duration) && video.duration > 0);
    }

    return new Promise<boolean>((resolve) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let settled = false;

      const finish = (ready: boolean) => {
        if (settled) return;

        settled = true;
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);

        if (timeoutId) clearTimeout(timeoutId);
        resolve(ready);
      };

      const handleLoadedMetadata = () => {
        finish(Number.isFinite(video.duration) && video.duration > 0);
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata, {
        once: true,
      });
      timeoutId = setTimeout(() => finish(false), seekTimeoutMs);
    });
  };

  const seekVideo = async (
    video: HTMLVideoElement,
    timelineRatio: number,
    direction: PlaybackDirection
  ) => {
    if (!(await waitForMetadata(video))) return false;

    const lastStableFrame = Math.max(
      video.duration - endEpsilonSeconds,
      0
    );
    const directionalRatio =
      direction === "forward" ? timelineRatio : 1 - timelineRatio;
    const targetTime = clampUnit(directionalRatio) * lastStableFrame;

    if (Math.abs(video.currentTime - targetTime) <= 1 / 60) return true;

    await new Promise<void>((resolve) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let settled = false;

      const finish = () => {
        if (settled) return;

        settled = true;
        video.removeEventListener("seeked", finish);

        if (timeoutId) clearTimeout(timeoutId);
        resolve();
      };

      video.addEventListener("seeked", finish, { once: true });
      video.currentTime = targetTime;
      timeoutId = setTimeout(finish, seekTimeoutMs);

      if (!video.seeking) queueMicrotask(finish);
    });

    return true;
  };

  const getTimelineRatio = () => {
    const video = getVideo(activeDirection.value);

    if (
      !video ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    ) {
      return 0;
    }

    const directionalRatio = clampUnit(video.currentTime / video.duration);
    return activeDirection.value === "forward"
      ? directionalRatio
      : 1 - directionalRatio;
  };

  const playIfScrolling = (video: HTMLVideoElement | null) => {
    if (!video || !scrollActive || disposed || !video.paused) return;
    if (
      Number.isFinite(video.duration) &&
      video.currentTime >= video.duration - endEpsilonSeconds
    ) {
      return;
    }

    void video.play().catch(() => undefined);
  };

  const startPlayback = async (direction: PlaybackDirection) => {
    if (pendingDirection === direction || disposed) return;

    const requestId = ++switchRequestId;

    if (direction === activeDirection.value) {
      pendingDirection = null;
      playIfScrolling(getVideo(direction));
      return;
    }

    const timelineRatio = getTimelineRatio();
    const targetVideo = getVideo(direction);

    pendingDirection = direction;
    pauseVideos();

    if (!targetVideo) {
      pendingDirection = null;
      return;
    }

    const seeked = await seekVideo(targetVideo, timelineRatio, direction);

    if (
      !seeked ||
      disposed ||
      requestId !== switchRequestId ||
      pendingDirection !== direction
    ) {
      return;
    }

    activeDirection.value = direction;
    pendingDirection = null;
    playIfScrolling(targetVideo);
  };

  const scheduleStop = () => {
    clearStopTimer();

    stopTimer = setTimeout(() => {
      stopTimer = null;
      scrollActive = false;
      pauseVideos();
    }, stopDelayMs);
  };

  const handleScrollProgress = (progress: number) => {
    if (previousProgress === null) {
      previousProgress = progress;
      return;
    }

    const progressDelta = progress - previousProgress;
    previousProgress = progress;

    if (Math.abs(progressDelta) < 0.00001) return;

    scrollActive = true;
    void startPlayback(progressDelta > 0 ? "forward" : "reverse");
    scheduleStop();
  };

  onBeforeUnmount(() => {
    disposed = true;
    switchRequestId += 1;
    clearStopTimer();
    pauseVideos();
  });

  return {
    activeDirection,
    handleScrollProgress,
  };
};
