<script setup lang="ts">
import { computed } from "vue";

// A line whose letters roll over one by one, left to right, as scrolltide's
// Team Roster names do. Each word is a one-line window. When `on` turns true
// every letter is pushed up out of the window by a copy of itself coming up
// from below in the "on" colour; when it turns false the letter drops out of
// the bottom while an "off"-coloured copy comes down from above. The copy is
// a text-shadow that exists only while a letter rolls, and a letter waiting
// for its turn keeps the old look, so the colour change travels across the
// word with the roll. The colours are --roll-idle and --roll-active; the
// first letter starts --roll-delay after the change. Nothing plays until
// `live`. With `rise` the letters only come up from below, once, as the
// component mounts: for a line that has just replaced another one.
// Screen readers get the line whole; the letters are hidden from them.

const props = withDefaults(defineProps<{ text: string; on?: boolean; live?: boolean; rise?: boolean }>(), { on: false, live: false, rise: false });

const count = computed(() => Array.from(props.text.replaceAll(" ", "")).length);
const words = computed(() => {
  let index = 0;
  return props.text.split(" ").filter(Boolean).map((word) => Array.from(word).map((char) => ({ char, index: index++ })));
});
</script>

<template>
  <span class="roll-text" :class="{ 'is-on': on, 'is-live': live, 'roll-text--rise': rise }" :style="{ '--n': count }"><span class="sr-only">{{ text }}</span><span aria-hidden="true"><template v-for="(word, w) in words" :key="w"><span class="roll-text__word"><span v-for="letter in word" :key="letter.index" class="roll-text__char" :style="{ '--i': letter.index }">{{ letter.char }}</span></span>{{ w < words.length - 1 ? " " : "" }}</template></span></span>
</template>

<style scoped>
.roll-text:not(.roll-text--rise) {
  color: var(--roll-idle, currentColor);
}

.roll-text.is-on:not(.roll-text--rise) {
  color: var(--roll-active, currentColor);
}

/* The window is one line plus a hair above and below for accents and
   descenders; a copy waits exactly one window away, out of sight. */
.roll-text__word {
  --roll-step: calc(1lh + 0.2em);
  display: inline-block;
  overflow: hidden;
  margin-block: -0.1em;
  padding-block: 0.1em;
  vertical-align: top;
  white-space: nowrap;
}

.roll-text__char {
  display: inline-block;
}

/* As measured on the reference: about 0.2 s a letter, the next one 20 ms
   later; a long name packs its letters closer so the whole roll still takes
   about as long as a short one (the first to the last letter in 0.26 s). */
@media (prefers-reduced-motion: no-preference) {
  .roll-text.is-live .roll-text__char {
    animation: roll-text-off 0.22s cubic-bezier(0.55, 0, 0.3, 1) calc(var(--roll-delay, 0s) + var(--i) * min(20ms, 260ms / var(--n))) backwards;
  }

  .roll-text.is-live.is-on .roll-text__char {
    animation-name: roll-text-on;
  }

  .roll-text--rise.is-live .roll-text__char {
    animation: roll-text-rise 0.45s cubic-bezier(0.3, 0, 0.2, 1) calc(var(--i) * min(18ms, 260ms / var(--n))) both;
  }
}

/* Each animation holds the old colour on the letter and the new one on its
   copy; when it ends the letter is back in place in its new resting colour,
   which is exactly where the copy stood. */
@keyframes roll-text-on {
  from {
    color: var(--roll-idle);
    text-shadow: 0 var(--roll-step) var(--roll-active);
    transform: translateY(0);
  }

  to {
    color: var(--roll-idle);
    text-shadow: 0 var(--roll-step) var(--roll-active);
    transform: translateY(calc(-1 * var(--roll-step)));
  }
}

@keyframes roll-text-off {
  from {
    color: var(--roll-active);
    text-shadow: 0 calc(-1 * var(--roll-step)) var(--roll-idle);
    transform: translateY(0);
  }

  to {
    color: var(--roll-active);
    text-shadow: 0 calc(-1 * var(--roll-step)) var(--roll-idle);
    transform: translateY(var(--roll-step));
  }
}

@keyframes roll-text-rise {
  from {
    transform: translateY(var(--roll-step));
  }

  to {
    transform: translateY(0);
  }
}
</style>
