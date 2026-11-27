<script setup lang="ts">
// "500+ Designers", on white, under a lit green horizon. The white sheet's top
// edge lies flat until scrolling has brought it a quarter of the way up the
// screen; from there it bows into an arc as it goes on up, and flattens again
// on the way back. The bow is the height of a half-ellipse cap (--arc, 0..1),
// set from the scroll position.
import { onBeforeUnmount, onMounted, ref } from "vue";

const { t } = useI18n();

const horizon = ref<HTMLElement | null>(null);
let frame = 0;

const measure = () => {
  frame = 0;
  const element = horizon.value;
  if (!element) return;
  const edge = element.getBoundingClientRect().bottom;
  const screen = window.innerHeight;
  // Flat while the edge is in the lowest quarter of the screen; fully bowed
  // once it is 30% from the top.
  const raw = (screen * 0.75 - edge) / (screen * 0.45);
  const progress = Math.min(1, Math.max(0, raw));
  // Ease in and out, so the bow neither starts nor stops with a jolt.
  const eased = progress * progress * (3 - 2 * progress);
  element.style.setProperty("--arc", eased.toFixed(4));
};

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(measure);
};

onMounted(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // No scroll-driven motion: the arc as designed.
    horizon.value?.style.setProperty("--arc", "1");
    return;
  }
  measure();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <section class="og-designers">
    <div ref="horizon" class="og-horizon" aria-hidden="true">
      <span class="og-horizon__cap" />
    </div>

    <div class="og-designers__body">
      <p class="og-designers__figure">
        <span class="og-designers__count type-display-xl">
          <span class="og-designers__number">{{ t("oneGuarantee.designers.number") }}</span><span class="sr-only">+</span>
        </span>
        <span v-rise class="og-designers__word type-display-m og-grad ob-green" :style="{ '--chars': t('oneGuarantee.designers.word').length }">{{ t("oneGuarantee.designers.word") }}<span class="og-designers__plus ob-green" aria-hidden="true">+</span></span>
      </p>
      <p v-rise class="og-designers__text type-intro">{{ t("oneGuarantee.designers.text") }}</p>
    </div>
  </section>
</template>

<style scoped>
/* The design at 1440px: the horizon rises 60px in the middle. Type is the
   site's scale, not the design's sizes: "500" is display-xl (the largest
   step), "Designers" display-m over its foot (half its size, as designed),
   the text the intro step. */
.og-designers {
  position: relative;
  background: #fff;
  color: #000;
}

/* The black above the sheet, with room for the glow.
   The cap is a half-ellipse twice as wide as the screen, so the screen shows
   only the middle of its curve, which reads as an arc of a circle. It grows
   up from its foot and sinks by the height its curve has at the screen's
   edges (0.866 of its own: sqrt(1 - 0.5^2)), so the edges stay on the
   horizon's line and only the middle rises, by --rise. 0 high it is a
   straight edge. (7.464 = 1 / (1 - 0.866), 6.464 = 7.464 * 0.866.) */
.og-horizon {
  --arc: 0;
  --rise: clamp(2.25rem, 4.2 * var(--fvw), 5.5rem);
  position: relative;
  height: clamp(7rem, 12 * var(--fvw), 14rem);
  background: #000;
}

/* The glow gathers in the middle as the horizon bows. */
.og-horizon::before {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 92%;
  height: 100%;
  background: radial-gradient(ellipse 50% 100% at 50% 100%, rgb(0 255 10 / 0.6) 0%, rgb(0 220 10 / 0.25) 38%, transparent 70%);
  content: "";
  opacity: calc(0.25 + 0.75 * var(--arc));
  translate: -50% calc(var(--rise) * var(--arc) * -1);
}

.og-horizon__cap {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 200%;
  height: calc(var(--rise) * 7.464 * var(--arc));
  /* A hairline of height even when flat, so the glow has an edge to hang on. */
  min-height: 1px;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  background: #fff;
  box-shadow:
    0 0 0 0.09rem #19ff2c,
    0 -0.15rem 0.9rem 0.1rem #00ff0a,
    0 -0.75rem 2.2rem 0.4rem rgb(0 255 10 / 0.75),
    0 -2rem 4.5rem 0.75rem rgb(0 235 10 / 0.4);
  translate: -50% calc(var(--rise) * 6.464 * var(--arc));
  will-change: height, translate;
}

/* Over the horizon's glow, which also spreads below the cap's foot. */
.og-designers__body {
  position: relative;
  z-index: 1;
  background: #fff;
  padding: clamp(3rem, 8 * var(--fvw), 9rem) 1.25rem clamp(4rem, 10 * var(--fvw), 12rem);
  text-align: center;
}

.og-designers__figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
}

/* "500": one clean outline, fading towards its foot. (It had a second,
   finer outline just off the first, which read as a doubled, frayed line.)
   Its "+" stands lower, at the upper right of the word under it (see the
   word), where the number's foot meets the word. */
.og-designers__count {
  position: relative;
  display: inline-block;
}

.og-designers__number {
  display: inline-block;
  color: transparent;
  -webkit-text-stroke: 0.016em #17c241;
  -webkit-mask-image: linear-gradient(to bottom, #000 40%, rgb(0 0 0 / 0.35) 92%);
  mask-image: linear-gradient(to bottom, #000 40%, rgb(0 0 0 / 0.35) 92%);
}

/* "Designers" stands over the foot of the number. The word is as long as its
   language makes it ("дизайнеров" is a tenth wider), so its size is also held
   to what fits the screen: a bold letter is about 0.58em wide, and the "+"
   hanging at the word's right needs its width kept free on both sides (the
   word stays in the middle of the page). */
.og-designers__word {
  position: relative;
  margin-top: -0.52em;
  padding-bottom: 0.14em;
  font-size: min(var(--type-display-m-size), (100vw - 2.5rem) / ((var(--chars, 9) + 1.5) * 0.58));
  line-height: 1;
  white-space: nowrap;
}

/* The "+" of "500+": outside the word's box, at its upper right. */
.og-designers__plus {
  position: absolute;
  top: 0.12em;
  left: calc(100% + 0.1em);
  font-size: 0.62em;
  font-weight: 700;
  line-height: 1;
}

.og-designers__text {
  max-width: 24em;
  margin: clamp(0.5rem, 1 * var(--fvw), 1.25rem) auto 0;
  text-wrap: balance;
}
</style>
