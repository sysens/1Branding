<script setup lang="ts">
import MovementClock from "./MovementClock.vue";

// The top of the contact page: the green chronograph in the middle, its light
// band running through it, then the call to action under it.
const { t } = useI18n();
const { open } = useContactModal();
</script>

<template>
  <section class="contact-hero" aria-labelledby="contact-hero-title">
    <MovementClock centered />

    <div class="contact-hero__content">
      <h2 id="contact-hero-title" v-blur-reveal class="contact-hero__title">
        <span class="contact-hero__line">{{ t("contacts.hero.titleFirst") }}</span>
        <span class="contact-hero__line contact-hero__line--accent">{{ t("contacts.hero.titleSecond") }}</span>
      </h2>
      <p v-rise class="contact-hero__text">{{ t("contacts.hero.text") }}</p>
      <!-- The OneGuarantee pill's look (.site-guarantee, assets/css/guarantee-pill.css). -->
      <button v-rise type="button" class="site-guarantee contact-hero__cta" aria-haspopup="dialog" @click="open">
        <span class="site-guarantee__rest">{{ t("contacts.hero.cta") }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.contact-hero {
  /* The clock's diameter, and how far its top edge is from the top of the page
     (clear of the floating header). */
  --clock: clamp(13rem, 24vw, 21rem);
  --clock-top: clamp(6.5rem, 9vw, 8.5rem);
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: calc(var(--clock-top) + var(--clock) + clamp(2rem, 4vw, 3.5rem)) 1.25rem clamp(2.5rem, 5vw, 4.5rem);
  text-align: center;
}

.contact-hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.contact-hero__title {
  margin: 0;
  color: #fff;
  font-family: var(--app-font-display);
  font-size: clamp(2.5rem, 1rem + 5.6vw, 6.25rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}

.contact-hero__line {
  display: block;
}

/* The accent line is lit the way the call-to-action button is (.ob-button in
   tailwind.css): a green ground with a dark patch and a bright patch drifting
   through it, here clipped to the letters. The patches' centres are two
   registered custom properties, so the browser can animate them. */
@property --hero-dark-x {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 20%;
}

@property --hero-light-x {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 70%;
}

.contact-hero__line--accent {
  background:
    radial-gradient(ellipse 34% 120% at var(--hero-dark-x) 62%, rgb(2 34 10 / 0.8), rgb(2 34 10 / 0) 100%),
    radial-gradient(ellipse 30% 100% at var(--hero-light-x) 36%, rgb(120 255 130 / 0.85), rgb(120 255 130 / 0) 100%),
    linear-gradient(100deg, #0b9a2d 0%, #13b538 50%, #1fd048 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /* Room for the descender-less line not to cut the clip's edges. */
  padding-bottom: 0.08em;
  animation:
    contact-hero-dark 6s ease-in-out infinite alternate,
    contact-hero-light 7.5s ease-in-out infinite alternate;
}

@keyframes contact-hero-dark {
  from { --hero-dark-x: -5%; }
  to { --hero-dark-x: 75%; }
}

@keyframes contact-hero-light {
  from { --hero-light-x: 105%; }
  to { --hero-light-x: 15%; }
}

@media (prefers-reduced-motion: reduce) {
  .contact-hero__line--accent {
    animation: none;
  }
}

.contact-hero__text {
  margin: clamp(0.75rem, 1.5vw, 1.25rem) 0 clamp(1.5rem, 2.5vw, 2rem);
  max-width: 34em;
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-lead-size);
  font-weight: 500;
  line-height: var(--type-lead-lh);
  letter-spacing: var(--type-lead-ls);
}

/* The pill at the hero's scale (it is 36px tall in the header). */
.contact-hero__cta {
  cursor: pointer;
  height: 3.25rem;
  padding: 0 2.25rem;
  border-radius: 62.4375rem;
  font-size: var(--type-lead-size);
  text-transform: uppercase;
}
</style>
