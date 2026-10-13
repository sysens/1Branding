<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from "vue";

// gsap declares its option types in a global namespace.
type TweenVars = gsap.TweenVars;

type SplitTextTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
type SplitType = "chars" | "words" | "lines";
type SplitUnit = {
  key: string;
  value: string;
  isSpace: boolean;
};

type Props = {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: SplitType;
  from?: TweenVars;
  to?: TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: SplitTextTag;
  textAlign?: CSSProperties["textAlign"];
};

const props = withDefaults(defineProps<Props>(), {
  className: "",
  delay: 50,
  duration: 0.75,
  ease: "power3.out",
  splitType: "chars",
  from: () => ({ opacity: 0, y: 40 }),
  to: () => ({ opacity: 1, y: 0 }),
  threshold: 0.1,
  rootMargin: "-100px",
  tag: "p",
  textAlign: "center",
});

const emit = defineEmits<{
  "animation-complete": [];
}>();

const elRef = ref<HTMLElement | null>(null);
const fontsLoaded = ref(false);

let cleanupAnimation: (() => void) | null = null;

const normalizeSpace = (value: string) => value.replace(/ /g, "\u00A0");

const buildCharUnits = (text: string): SplitUnit[] =>
  Array.from(text).map((char, index) => ({
    key: `char-${index}-${char}`,
    value: char === " " ? "\u00A0" : char,
    isSpace: /\s/.test(char),
  }));

const buildWordUnits = (text: string): SplitUnit[] =>
  text.split(/(\s+)/).map((part, index) => ({
    key: `word-${index}-${part}`,
    value: /\s+/.test(part) ? normalizeSpace(part) : part,
    isSpace: /^\s+$/.test(part),
  }));

const buildLineUnits = (text: string): SplitUnit[] =>
  text.split(/(\n)/).map((part, index) => ({
    key: `line-${index}-${part}`,
    value: part === "\n" ? "\n" : part,
    isSpace: part === "\n",
  }));

const units = computed<SplitUnit[]>(() => {
  if (props.splitType === "words") {
    return buildWordUnits(props.text);
  }

  if (props.splitType === "lines") {
    return buildLineUnits(props.text);
  }

  return buildCharUnits(props.text);
});

const styles = computed<CSSProperties>(() => ({
  textAlign: props.textAlign,
  wordWrap: "break-word",
  willChange: "transform, opacity",
}));

const classes = computed(() =>
  ["split-text-reveal", props.className].filter(Boolean).join(" ")
);

const getScrollStart = () => {
  const startPct = (1 - props.threshold) * 100;
  const match = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(props.rootMargin);
  const marginValue = match ? Number.parseFloat(match[1] ?? "0") : 0;
  const marginUnit = match?.[2] ?? "px";

  if (marginValue === 0) {
    return `top ${startPct}%`;
  }

  const sign = marginValue < 0 ? "-=" : "+=";

  return `top ${startPct}%${sign}${Math.abs(marginValue)}${marginUnit}`;
};

const stopAnimation = () => {
  cleanupAnimation?.();
  cleanupAnimation = null;
};

const runAnimation = async () => {
  if (!process.client || !fontsLoaded.value) {
    return;
  }

  await nextTick();

  const el = elRef.value;

  if (!el || !props.text.trim()) {
    return;
  }

  stopAnimation();

  const targets = Array.from(
    el.querySelectorAll<HTMLElement>(".split-text-reveal__unit:not([data-space='true'])")
  );

  if (!targets.length) {
    return;
  }

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");

  gsap.registerPlugin(ScrollTrigger);
  gsap.set(targets, props.from);

  const tween = gsap.to(targets, {
    ...props.to,
    duration: props.duration,
    ease: props.ease,
    stagger: props.delay / 1000,
    scrollTrigger: {
      trigger: el,
      start: getScrollStart(),
      once: true,
      fastScrollEnd: true,
      anticipatePin: 0.4,
    },
    onComplete: () => {
      emit("animation-complete");
    },
    willChange: "transform, opacity",
    force3D: true,
  });

  cleanupAnimation = () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
};

onMounted(() => {
  if (document.fonts.status === "loaded") {
    fontsLoaded.value = true;
    void runAnimation();
    return;
  }

  void document.fonts.ready.then(() => {
    fontsLoaded.value = true;
    void runAnimation();
  });
});

watch(
  () => [
    props.text,
    props.delay,
    props.duration,
    props.ease,
    props.splitType,
    props.threshold,
    props.rootMargin,
    fontsLoaded.value,
  ],
  () => {
    void runAnimation();
  }
);

onBeforeUnmount(() => {
  stopAnimation();
});
</script>

<template>
  <component :is="tag" ref="elRef" :style="styles" :class="classes">
    <span
      v-for="unit in units"
      :key="unit.key"
      class="split-text-reveal__unit"
      :data-space="unit.isSpace ? 'true' : undefined"
    >
      {{ unit.value }}
    </span>
  </component>
</template>

<style scoped>
.split-text-reveal {
  display: inline-block;
  overflow: hidden;
  white-space: normal;
}

.split-text-reveal__unit {
  display: inline-block;
  white-space: pre;
  will-change: transform, opacity;
}
</style>
