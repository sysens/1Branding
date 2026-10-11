<script setup lang="ts">
import { computed, ref, useId } from "vue";

// "Frequently asked questions": one answer open at a time; it unfolds by
// animating the row's grid track (0fr → 1fr), so any answer length eases open.

const { t, tm, rt } = useI18n();
const items = computed(() => (tm("home.faq.items") as Array<{ q: unknown; a: unknown }>).map((item) => ({
  question: rt(item.q as never),
  answer: rt(item.a as never),
})));

const open = ref<number | null>(null);
const toggle = (index: number) => {
  open.value = open.value === index ? null : index;
};
const base = useId();
</script>

<template>
  <!-- The copy is English in both locales. -->
  <section class="faq" lang="en" aria-labelledby="faq-title">
    <h2 id="faq-title" class="faq__title">
      {{ t("home.faq.titleLead") }} <span class="faq__green">{{ t("home.faq.titleAccent") }}</span>
    </h2>

    <ul class="faq__list">
      <li v-for="(item, index) in items" :key="index" class="faq__item" :class="{ 'is-open': open === index }">
        <h3 class="faq__heading">
          <button
            :id="`${base}-q${index}`"
            type="button"
            class="faq__question"
            :aria-expanded="open === index"
            :aria-controls="`${base}-a${index}`"
            @click="toggle(index)"
          >
            <span>{{ item.question }}</span>
            <span class="faq__icon" aria-hidden="true" />
          </button>
        </h3>
        <div :id="`${base}-a${index}`" class="faq__panel" role="region" :aria-labelledby="`${base}-q${index}`">
          <div class="faq__panel-inner">
            <p class="faq__answer">{{ item.answer }}</p>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* --u is one pixel of the 2000px design frame. */
.faq {
  --u: 0.05vw;
  position: relative;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(83 * var(--u)) 1.25rem calc(120 * var(--u));
  background: #000;
  color: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

.faq__title {
  margin: 0;
  font-size: calc(100 * var(--u));
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  text-align: center;
}

.faq__green {
  background: linear-gradient(90deg, #00e632 0%, #00d83a 55%, #1fb34f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.faq__list {
  display: flex;
  flex-direction: column;
  gap: calc(17 * var(--u));
  width: calc(1474 * var(--u));
  margin: calc(46 * var(--u)) 0 0;
  padding: 0;
  list-style: none;
}

.faq__item {
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.04);
  border-radius: calc(16 * var(--u));
  background: linear-gradient(90deg, #151515 0%, #131313 70%, #101010 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.03);
  transition: border-color 0.4s ease, background-color 0.4s ease, box-shadow 0.4s ease;
}

.faq__item:hover {
  border-color: rgb(255 255 255 / 0.09);
}

.faq__item.is-open {
  border-color: rgb(0 230 70 / 0.35);
  box-shadow: 0 0 calc(40 * var(--u)) rgb(0 230 70 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.05);
}

.faq__heading {
  margin: 0;
  font: inherit;
}

.faq__question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  width: 100%;
  min-height: calc(88 * var(--u));
  padding: 0 calc(32 * var(--u));
  border: 0;
  background: none;
  color: #c9c9c9;
  font: inherit;
  font-size: calc(21.5 * var(--u));
  font-weight: 500;
  letter-spacing: -0.02em;
  text-align: left;
  cursor: pointer;
  transition: color 0.3s ease;
}

.faq__question:hover,
.faq__item.is-open .faq__question {
  color: #fff;
}

.faq__question:focus-visible {
  outline: 2px solid #00e632;
  outline-offset: -4px;
  border-radius: calc(16 * var(--u));
}

/* A plus drawn with two bars; the vertical one turns flat when open. */
.faq__icon {
  position: relative;
  flex: none;
  width: calc(20 * var(--u));
  height: calc(20 * var(--u));
  transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.faq__icon::before,
.faq__icon::after {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: calc(2.2 * var(--u));
  margin-top: calc(-1.1 * var(--u));
  border-radius: 2px;
  background: #e8e8e8;
  content: "";
  transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1), background-color 0.3s ease;
}

.faq__icon::after {
  transform: rotate(90deg);
}

.faq__item.is-open .faq__icon {
  transform: rotate(180deg);
}

.faq__item.is-open .faq__icon::after {
  transform: rotate(0deg);
}

.faq__item.is-open .faq__icon::before,
.faq__item.is-open .faq__icon::after {
  background: #00e632;
}

.faq__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.faq__item.is-open .faq__panel {
  grid-template-rows: 1fr;
}

.faq__panel-inner {
  min-height: 0;
  overflow: hidden;
}

.faq__answer {
  max-width: 62em;
  margin: 0;
  padding: 0 calc(32 * var(--u)) calc(30 * var(--u));
  color: #9a9da1;
  font-size: calc(20 * var(--u));
  line-height: 1.55;
  opacity: 0;
  transform: translateY(calc(-8 * var(--u)));
  transition: opacity 0.35s ease, transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.faq__item.is-open .faq__answer {
  opacity: 1;
  transform: none;
  transition-delay: 0.12s;
}

@media (max-width: 767px) {
  .faq {
    padding: 4rem 1.25rem 4.5rem;
  }

  .faq__title {
    font-size: 9.6vw;
  }

  .faq__list {
    gap: 0.6rem;
    width: 100%;
    margin-top: 1.75rem;
  }

  .faq__item {
    border-radius: 0.9rem;
  }

  .faq__question {
    min-height: 3.75rem;
    padding: 0.9rem 1.1rem;
    font-size: 1rem;
  }

  .faq__icon {
    width: 1rem;
    height: 1rem;
  }

  .faq__icon::before,
  .faq__icon::after {
    height: 2px;
    margin-top: -1px;
  }

  .faq__answer {
    padding: 0 1.1rem 1.1rem;
    font-size: 0.95rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .faq__panel,
  .faq__answer,
  .faq__icon,
  .faq__icon::before,
  .faq__icon::after {
    transition: none;
  }
}
</style>
