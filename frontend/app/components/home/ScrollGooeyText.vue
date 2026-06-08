<script setup lang="ts">
import { computed, useId, type CSSProperties } from "vue";

type Props = {
  texts: string[];
  progress: number;
};

type MorphState = {
  currentText: string;
  nextText: string;
  currentVisibility: number;
  nextVisibility: number;
};

const props = defineProps<Props>();

const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
const filterId = `scroll-gooey-threshold-${rawId}`;
const filterUrl = computed(() => `url(#${filterId})`);

const clampUnit = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
};

const toBlur = (visibility: number) => {
  if (visibility <= 0) {
    return 100;
  }

  return Math.min(8 / visibility - 8, 100);
};

const toTextStyle = (visibility: number): CSSProperties => ({
  filter: `blur(${toBlur(visibility).toFixed(3)}px)`,
  opacity: Number(Math.pow(clampUnit(visibility), 0.4).toFixed(4)),
});

const morphState = computed<MorphState>(() => {
  const texts = props.texts.map((text) => text.trim()).filter(Boolean);
  const count = texts.length;

  if (count === 0) {
    return {
      currentText: "",
      nextText: "",
      currentVisibility: 0,
      nextVisibility: 0,
    };
  }

  if (count === 1) {
    return {
      currentText: texts[0],
      nextText: texts[0],
      currentVisibility: 1,
      nextVisibility: 0,
    };
  }

  const maxStep = count - 1;
  const scaledProgress = clampUnit(props.progress) * maxStep;
  const currentIndex = Math.min(Math.floor(scaledProgress), maxStep);
  const nextIndex = Math.min(currentIndex + 1, maxStep);
  const fraction = currentIndex === maxStep ? 0 : scaledProgress - currentIndex;

  return {
    currentText: texts[currentIndex],
    nextText: texts[nextIndex],
    currentVisibility: currentIndex === maxStep ? 1 : 1 - fraction,
    nextVisibility: currentIndex === maxStep ? 0 : fraction,
  };
});

const currentTextStyle = computed<CSSProperties>(() =>
  toTextStyle(morphState.value.currentVisibility)
);

const nextTextStyle = computed<CSSProperties>(() =>
  toTextStyle(morphState.value.nextVisibility)
);

const stageStyle = computed<CSSProperties>(() => {
  const isMorphing =
    morphState.value.currentVisibility > 0.02 &&
    morphState.value.nextVisibility > 0.02;

  return {
    filter: isMorphing ? filterUrl.value : "none",
  };
});
</script>

<template>
  <div class="gooey-scroll-text">
    <svg class="gooey-scroll-text__filter" aria-hidden="true" focusable="false">
      <defs>
        <filter :id="filterId">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 255 -140"
          />
        </filter>
      </defs>
    </svg>

    <div class="gooey-scroll-text__stage" :style="stageStyle">
      <span class="gooey-scroll-text__item" :style="currentTextStyle">
        {{ morphState.currentText }}
      </span>
      <span class="gooey-scroll-text__item" :style="nextTextStyle">
        {{ morphState.nextText }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.gooey-scroll-text {
  position: relative;
}

.gooey-scroll-text__filter {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.gooey-scroll-text__stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gooey-scroll-text__item {
  position: absolute;
  display: inline-block;
  width: 100%;
  color: inherit;
  font: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-align: inherit;
  text-transform: inherit;
  user-select: none;
  will-change: filter, opacity;
}
</style>
