<script setup lang="ts">
import { computed, nextTick, ref } from "vue";

// A step-by-step flow: the current step's content (the default slot gets
// `{ step }`, 1-based), the Back / Continue footer and the step indicator. A
// Vue take on React Bits' Stepper (same props: initialStep, linear,
// disableStepIndicators, showFooter, backButtonText, nextButtonText,
// completeButtonText, indicator "bars", fade transition), with one addition:
// `validate(step)` returns a message when the step cannot be left yet.
const props = withDefaults(defineProps<{
  total: number;
  titles?: string[];
  initialStep?: number;
  /** Steps are taken in order: the indicator only goes back. */
  linear?: boolean;
  disableStepIndicators?: boolean;
  showFooter?: boolean;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  /** Returns a message when the step is not ready (shown by the parent), else null. */
  validate?: (step: number) => string | null;
  /** The last step is being sent. */
  busy?: boolean;
}>(), {
  titles: () => [],
  initialStep: 1,
  linear: true,
  disableStepIndicators: false,
  showFooter: true,
  backButtonText: "Back",
  nextButtonText: "Continue",
  completeButtonText: "Complete",
  validate: undefined,
  busy: false,
});

const emit = defineEmits<{
  "step-change": [step: number];
  "invalid": [message: string];
  "complete": [];
}>();

const step = ref(Math.min(Math.max(props.initialStep, 1), props.total));
const reached = ref(step.value);
const isLast = computed(() => step.value === props.total);
const body = ref<HTMLElement | null>(null);

const focusFirstField = async () => {
  await nextTick();
  // After the fade has started: the new step's first field.
  setTimeout(() => body.value?.querySelector<HTMLElement>("input, select, textarea, button")?.focus({ preventScroll: true }), 60);
};

const go = (to: number) => {
  if (to < 1 || to > props.total || to === step.value) return;
  step.value = to;
  reached.value = Math.max(reached.value, to);
  emit("step-change", to);
  void focusFirstField();
};

const next = () => {
  if (props.busy) return;
  const problem = props.validate?.(step.value) ?? null;
  if (problem) {
    emit("invalid", problem);
    return;
  }
  if (isLast.value) emit("complete");
  else go(step.value + 1);
};

const back = () => go(step.value - 1);

const canJump = (index: number) => {
  if (props.disableStepIndicators || index === step.value) return false;
  return props.linear ? index < step.value : index <= reached.value;
};

defineExpose({ go, step });
</script>

<template>
  <div class="stepper">
    <div ref="body" class="stepper__body" @keydown.enter.prevent="next">
      <Transition name="stepper-fade" mode="out-in">
        <div :key="step" class="stepper__step">
          <slot :step="step" />
        </div>
      </Transition>
    </div>

    <div v-if="showFooter" class="stepper__footer">
      <button v-if="step > 1" type="button" class="stepper__back" :disabled="busy" @click="back">
        {{ backButtonText }}
      </button>
      <button type="button" class="stepper__next" :disabled="busy" @click="next">
        {{ isLast ? completeButtonText : nextButtonText }}
      </button>
    </div>

    <ol class="stepper__bars" :aria-label="titles.length ? titles.join(', ') : undefined">
      <li v-for="index in total" :key="index">
        <button
          type="button"
          class="stepper__bar"
          :class="{ 'is-current': index === step, 'is-done': index < step }"
          :disabled="!canJump(index)"
          :aria-current="index === step ? 'step' : undefined"
          :aria-label="titles[index - 1] || `${index} / ${total}`"
          @click="go(index)"
        />
      </li>
    </ol>
  </div>
</template>

<style scoped>
.stepper {
  display: grid;
  gap: 1.25rem;
}

.stepper__body {
  display: grid;
  align-items: center;
}

.stepper-fade-enter-active,
.stepper-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.stepper-fade-enter-from,
.stepper-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.stepper__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.stepper__back {
  padding: 0.5rem 0.75rem;
  border: 0;
  background: none;
  color: rgb(255 255 255 / 0.6);
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;
}

.stepper__back:hover,
.stepper__back:focus-visible {
  color: #fff;
}

.stepper__next {
  min-width: 8.5rem;
  height: 2.75rem;
  padding: 0 1.75rem;
  border: 0;
  border-radius: 62.4375rem;
  background: #00e600;
  color: #021d08;
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
}

.stepper__next:hover:not(:disabled),
.stepper__next:focus-visible {
  transform: scale(1.04);
  box-shadow: 0 0 1.6rem rgb(0 230 0 / 0.4);
}

.stepper__next:disabled,
.stepper__back:disabled {
  opacity: 0.55;
  cursor: progress;
}

/* The indicator: one bar per step, the current one solid green and longer. */
.stepper__bars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.stepper__bar {
  display: block;
  width: 2.75rem;
  height: 0.75rem;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  position: relative;
}

.stepper__bar::before {
  content: "";
  position: absolute;
  inset: 0.3125rem 0;
  border: 1px solid rgb(0 230 0 / 0.45);
  background: rgb(0 230 0 / 0.06);
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.stepper__bar.is-current::before {
  background: #00e600;
  border-color: #00e600;
  box-shadow: 0 0 0.6rem rgb(0 230 0 / 0.5);
}

.stepper__bar.is-done::before {
  background: rgb(0 230 0 / 0.45);
}

.stepper__bar:disabled {
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .stepper-fade-enter-active,
  .stepper-fade-leave-active {
    transition: none;
  }
}
</style>
