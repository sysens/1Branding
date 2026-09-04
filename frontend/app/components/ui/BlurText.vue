<script setup lang="ts">
import { Motion, type Transition } from "motion-v";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

type AnimationValue = string | number;
type AnimationSnapshot = Record<string, AnimationValue>;
type AnimateBy = "words" | "letters";
type Direction = "top" | "bottom";
type TextTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

type BlurTextProps = {
  animateBy?: AnimateBy;
  animationFrom?: AnimationSnapshot;
  animationTo?: AnimationSnapshot[];
  className?: string;
  delay?: number;
  direction?: Direction;
  easing?: (progress: number) => number;
  rootMargin?: string;
  stepDuration?: number;
  tag?: TextTag;
  text?: string;
  threshold?: number;
};

const props = withDefaults(defineProps<BlurTextProps>(), {
  animateBy: "words",
  className: "",
  delay: 200,
  direction: "top",
  easing: (progress: number) => progress,
  rootMargin: "0px",
  stepDuration: 0.35,
  tag: "p",
  text: "",
  threshold: 0.1,
});

const emit = defineEmits<{
  "animation-complete": [];
}>();

const rootRef = ref<HTMLElement | null>(null);
const inView = ref(false);
let observer: IntersectionObserver | null = null;

const elements = computed(() =>
  props.animateBy === "words" ? props.text.split(" ") : Array.from(props.text)
);

const defaultFrom = computed<AnimationSnapshot>(() => ({
  filter: "blur(10px)",
  opacity: 0,
  y: props.direction === "top" ? -50 : 50,
}));

const defaultTo = computed<AnimationSnapshot[]>(() => [
  {
    filter: "blur(5px)",
    opacity: 0.5,
    y: props.direction === "top" ? 5 : -5,
  },
  {
    filter: "blur(0px)",
    opacity: 1,
    y: 0,
  },
]);

const fromSnapshot = computed(() => props.animationFrom ?? defaultFrom.value);
const toSnapshots = computed(() => props.animationTo ?? defaultTo.value);

const buildKeyframes = (
  from: AnimationSnapshot,
  steps: AnimationSnapshot[]
): Record<string, AnimationValue[]> => {
  const keys = new Set<string>([
    ...Object.keys(from),
    ...steps.flatMap((step) => Object.keys(step)),
  ]);
  const keyframes: Record<string, AnimationValue[]> = {};

  keys.forEach((key) => {
    const firstDefinedValue =
      from[key] ??
      steps
        .map((step) => step[key])
        .find((value): value is AnimationValue => value !== undefined);

    if (firstDefinedValue === undefined) return;

    let previousValue = firstDefinedValue;
    keyframes[key] = [
      firstDefinedValue,
      ...steps.map((step) => {
        previousValue = step[key] ?? previousValue;
        return previousValue;
      }),
    ];
  });

  return keyframes;
};

const keyframes = computed(() =>
  buildKeyframes(fromSnapshot.value, toSnapshots.value)
);
const stepCount = computed(() => toSnapshots.value.length + 1);
const totalDuration = computed(
  () => props.stepDuration * Math.max(stepCount.value - 1, 0)
);
const times = computed(() =>
  Array.from({ length: stepCount.value }, (_, index) =>
    stepCount.value <= 1 ? 0 : index / (stepCount.value - 1)
  )
);

const getTransition = (index: number): Transition => ({
  delay: (index * props.delay) / 1000,
  duration: totalDuration.value,
  ease: props.easing,
  times: times.value,
});

const stopObserving = () => {
  observer?.disconnect();
  observer = null;
};

const observe = () => {
  const root = rootRef.value;

  if (!root) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    inView.value = true;
    return;
  }

  stopObserving();
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];

      if (!entry?.isIntersecting) return;

      inView.value = true;
      observer?.unobserve(root);
    },
    {
      rootMargin: props.rootMargin,
      threshold: props.threshold,
    }
  );
  observer.observe(root);
};

const handleAnimationComplete = (index: number) => {
  if (index === elements.value.length - 1) {
    emit("animation-complete");
  }
};

onMounted(observe);

watch(
  () => [
    props.animateBy,
    props.delay,
    props.direction,
    props.rootMargin,
    props.text,
    props.threshold,
  ],
  async () => {
    inView.value = false;
    await nextTick();
    observe();
  }
);

onBeforeUnmount(stopObserving);
</script>

<template>
  <component
    :is="tag"
    ref="rootRef"
    :class="['blur-text', className]"
  >
    <Motion
      v-for="(segment, index) in elements"
      :key="`${index}-${segment}`"
      as="span"
      :initial="fromSnapshot"
      :animate="inView ? keyframes : fromSnapshot"
      :transition="getTransition(index)"
      class="blur-text__segment"
      @motioncomplete="handleAnimationComplete(index)"
    >
      {{ segment === " " ? "\u00A0" : segment }}<template
        v-if="animateBy === 'words' && index < elements.length - 1"
      >&nbsp;</template>
    </Motion>
  </component>
</template>

<style scoped>
.blur-text {
  display: flex;
  flex-wrap: wrap;
}

.blur-text__segment {
  display: inline-block;
  will-change: transform, filter, opacity;
}

@media (prefers-reduced-motion: reduce) {
  .blur-text__segment {
    will-change: auto;
  }
}
</style>
