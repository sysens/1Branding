<script setup lang="ts">
// The end of the contact page: the green "1", "The scroll ends. The story
// doesn't." and a button that takes the visitor back to the top.
const { t } = useI18n();
const nuxtApp = useNuxtApp();

const toTop = () => {
  const lenis = nuxtApp.$lenis as { scrollTo?: (target: number, options?: { duration?: number }) => void } | undefined;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (lenis?.scrollTo) lenis.scrollTo(0, { duration: reduced ? 0 : 1.6 });
  else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
};
</script>

<template>
  <section class="scroll-end" aria-labelledby="scroll-end-title">
    <div v-rise class="scroll-end__mark" aria-hidden="true">
      <svg viewBox="384 214 182 274" focusable="false">
        <defs>
          <linearGradient id="scroll-end-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#00e83c" />
            <stop offset="1" stop-color="#0aa133" />
          </linearGradient>
        </defs>
        <path
          class="scroll-end__one"
          fill="url(#scroll-end-gradient)"
          d="M482.8 214.3H565.5L493.5 487.2C464 487.2 435.5 481.8 409.5 470.8L451 322L530.5 299.5H384Z"
        />
        <!-- A thin band of the mark slips sideways now and then. -->
        <path
          class="scroll-end__slip"
          fill="url(#scroll-end-gradient)"
          d="M482.8 214.3H565.5L493.5 487.2C464 487.2 435.5 481.8 409.5 470.8L451 322L530.5 299.5H384Z"
        />
      </svg>
    </div>

    <h2 id="scroll-end-title" v-blur-reveal class="scroll-end__title">
      <span class="scroll-end__line">{{ t("contacts.scrollEnd.first") }}</span>
      <span class="scroll-end__line scroll-end__line--accent">{{ t("contacts.scrollEnd.second") }}</span>
    </h2>

    <button v-rise type="button" class="scroll-end__button" @click="toTop">
      <span>{{ t("contacts.scrollEnd.button") }}</span>
    </button>
  </section>
</template>

<style scoped>
.scroll-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(3rem, 7vw, 6rem) 1.25rem clamp(2.5rem, 5vw, 4.5rem);
  text-align: center;
}

.scroll-end__mark {
  display: block;
  width: clamp(4.5rem, 9vw, 8rem);
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
}

.scroll-end__mark svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 0 1.5rem rgb(0 232 60 / 0.25));
}

.scroll-end__one,
.scroll-end__slip {
  transform-box: fill-box;
}

.scroll-end__slip {
  /* Only a band across the middle shows; it stays put until the slip. */
  clip-path: inset(41% 0 41% 0);
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .scroll-end__one {
    animation: scroll-end-float 7s ease-in-out infinite;
  }

  .scroll-end__slip {
    animation: scroll-end-slip 6s steps(1, end) infinite;
  }
}

@keyframes scroll-end-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4%); }
}

@keyframes scroll-end-slip {
  0%, 86%, 100% { opacity: 0; transform: translate(0, 0); }
  88% { opacity: 1; transform: translate(6%, 0); }
  91% { opacity: 1; transform: translate(-4%, 0); }
  94% { opacity: 0; transform: translate(0, 0); }
}

.scroll-end__title {
  margin: 0;
  color: #fff;
  font-family: var(--app-font-display);
  font-size: clamp(2.25rem, 1rem + 4.4vw, 5rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.03em;
}

.scroll-end__line {
  display: block;
}

.scroll-end__line--accent {
  background: linear-gradient(90deg, #00e03c 0%, #0aa133 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding-bottom: 0.1em;
}

/* An outlined pill: a green gradient edge, black inside; filled green on hover. */
.scroll-end__button {
  position: relative;
  isolation: isolate;
  margin-top: clamp(1.5rem, 3vw, 2.25rem);
  padding: 0.95rem 1.75rem;
  border: 2px solid transparent;
  border-radius: 62.4375rem;
  background:
    linear-gradient(#000, #000) padding-box,
    linear-gradient(100deg, #00e03c, #0aa133) border-box;
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-lead-size);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: var(--type-lead-ls);
  cursor: pointer;
  transition: box-shadow 0.35s ease, transform 0.35s ease, background 0.35s ease;
}

.scroll-end__button:hover,
.scroll-end__button:focus-visible {
  background:
    linear-gradient(100deg, #0aa133, #0a8a2d) padding-box,
    linear-gradient(100deg, #00e03c, #0aa133) border-box;
  box-shadow: 0 0 2rem rgb(0 224 60 / 0.35);
  transform: scale(1.04);
}

@media (prefers-reduced-motion: reduce) {
  .scroll-end__button { transition: none; }
}
</style>
