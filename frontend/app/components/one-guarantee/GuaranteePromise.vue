<script setup lang="ts">
// "Our name is on it. So is our responsibility.": the shield, the six
// commitments as cards, and the line that closes them ("If it's our mistake,
// we make it right.").
import { CalendarDays, Coins, FileText, Folder, Layers, ShieldCheck } from "lucide-vue-next";
import { computed } from "vue";
import OptImage from "~/components/ui/OptImage.vue";

const { t, tm, rt } = useI18n();

// One icon per card, in the cards' order (i18n oneGuarantee.promise.cards).
const ICONS = [FileText, Layers, Coins, CalendarDays, Folder, ShieldCheck];

const cards = computed(() => {
  const text = (value: unknown) => (typeof value === "string" ? value : rt(value as never));
  return (tm("oneGuarantee.promise.cards") as Array<{ title: unknown; text: unknown }>).map((card, index) => ({
    number: String(index + 1).padStart(2, "0"),
    icon: ICONS[index] ?? ShieldCheck,
    title: text(card.title),
    text: text(card.text),
  }));
});
</script>

<template>
  <section class="og-promise">
    <div class="og-promise__lead">
      <div class="og-promise__picture">
        <OptImage
          src="/one-guarantee-page/shield.webp"
          :alt="t('oneGuarantee.promise.shieldAlt')"
          sizes="(max-width: 767px) 190vw, 100vw"
          loading="lazy"
          decoding="async"
          :preview="false"
        />
      </div>

      <div class="og-promise__copy">
        <p class="og-promise__mark type-h2" aria-hidden="true">One<span>Guarantee</span></p>
        <h2 v-blur-reveal class="og-promise__title type-h2">
          <span>{{ t("oneGuarantee.promise.line1") }}</span>
          {{ " " }}
          <span class="og-grad">{{ t("oneGuarantee.promise.line2") }}</span>
        </h2>
        <p v-rise class="og-promise__text type-intro">{{ t("oneGuarantee.promise.text") }}</p>
      </div>
    </div>

    <ol class="og-promise__cards">
      <li v-for="card in cards" :key="card.number" v-rise class="og-card">
        <p class="og-card__head">
          <span class="og-card__number type-lead">{{ card.number }}</span>
          <component :is="card.icon" class="og-card__icon" aria-hidden="true" />
        </p>
        <h3 class="og-card__title type-h4">{{ card.title }}</h3>
        <p class="og-card__text type-body">{{ card.text }}</p>
      </li>
    </ol>

    <div class="og-promise__closing">
      <p v-blur-reveal class="og-promise__mistake type-h1">
        <span>{{ t("oneGuarantee.promise.mistake1") }}</span>
        {{ " " }}
        <span class="og-promise__mistake-accent">{{ t("oneGuarantee.promise.mistake2") }}</span>
      </p>
      <p v-rise class="og-promise__closing-note type-intro">
        {{ t("oneGuarantee.promise.mistakeNote") }}
        <strong>{{ t("oneGuarantee.promise.mistakeNoteStrong") }}</strong>
      </p>
    </div>
  </section>
</template>

<style scoped>
/* The design at 1440px: the picture (2:1) as wide as the screen with the copy
   145px from its left; the cards three to a row in 1246px. Type is the
   site's scale: the outlined wordmark and the heading h2, the text the intro
   step; a card's title h4 and its text the body step; the closing lines h1. */
.og-promise {
  position: relative;
  padding-bottom: clamp(3rem, 5 * var(--fvw), 6rem);
  background: #000;
  overflow: hidden;
}

.og-promise__lead {
  position: relative;
  display: flex;
  align-items: center;
  aspect-ratio: 2 / 1;
  max-height: 60rem;
  width: 100%;
}

.og-promise__picture {
  position: absolute;
  inset: 0;
}

.og-promise__picture :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 72% 50%;
}

.og-promise__copy {
  position: relative;
  z-index: 1;
  max-width: 50%;
  margin-left: max(1.25rem, 10 * var(--fvw));
}

/* The wordmark, as an outline. */
.og-promise__mark {
  margin: 0;
  color: transparent;
  -webkit-text-stroke: 1px #14a83a;
}

.og-promise__mark span {
  -webkit-text-stroke: 1px rgb(255 255 255 / 0.9);
}

.og-promise__title {
  margin: 0.2em 0 0;
}

.og-promise__title > span {
  display: block;
  padding-bottom: 0.06em;
}

.og-promise__text {
  max-width: 27em;
  margin: clamp(2rem, 11 * var(--fvw), 13rem) 0 0;
}

/* ---------- the cards ---------- */
.og-promise__cards {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.75rem, 1.25 * var(--fvw), 1.5rem);
  width: min(100% - 2.5rem, 86.5 * var(--fvw));
  margin: clamp(1.5rem, 2.6 * var(--fvw), 3.2rem) auto 0;
  padding: 0;
  list-style: none;
}

.og-card {
  padding: clamp(1.25rem, 1.8 * var(--fvw), 2.2rem) clamp(1.1rem, 1.8 * var(--fvw), 2.2rem) clamp(1.4rem, 2.2 * var(--fvw), 2.6rem);
  border: 1px solid rgb(70 225 110 / 0.42);
  border-radius: clamp(0.9rem, 1.2 * var(--fvw), 1.4rem);
  background:
    radial-gradient(ellipse 80% 90% at 100% 0, rgb(26 120 54 / 0.5), transparent 70%),
    linear-gradient(135deg, #0a2c15 0%, #06180b 60%, #0b2f17 100%);
  box-shadow: inset 0 1px 0 rgb(160 255 185 / 0.12);
}

.og-card__head {
  display: flex;
  gap: clamp(0.9rem, 1.6 * var(--fvw), 1.9rem);
  align-items: center;
  margin: 0;
}

.og-card__number {
  color: #19f03a;
  font-weight: 600;
}

.og-card__icon {
  width: clamp(1.75rem, 2.5 * var(--fvw), 3rem);
  height: clamp(1.75rem, 2.5 * var(--fvw), 3rem);
  stroke-width: 1.5;
}

.og-card__title {
  margin: clamp(0.75rem, 1.1 * var(--fvw), 1.35rem) 0 0;
  text-wrap: balance;
}

.og-card__text {
  margin: clamp(0.6rem, 0.9 * var(--fvw), 1.1rem) 0 0;
  color: rgb(255 255 255 / 0.86);
}

/* ---------- the closing lines ---------- */
.og-promise__closing {
  position: relative;
  width: min(100% - 2.5rem, 86.5 * var(--fvw));
  margin: clamp(2.5rem, 4 * var(--fvw), 5rem) auto 0;
  padding: clamp(1rem, 1.6 * var(--fvw), 2rem) 0 clamp(1.5rem, 2.4 * var(--fvw), 3rem) clamp(0rem, 1.4 * var(--fvw), 1.7rem);
}

/* A sweep of green light coming in from the lower right. */
.og-promise__closing::before {
  position: absolute;
  inset: -20% -8% -30% 45%;
  background: radial-gradient(ellipse 70% 85% at 100% 100%, rgb(20 220 70 / 0.5) 0%, rgb(10 120 40 / 0.22) 45%, transparent 72%);
  content: "";
  pointer-events: none;
}

.og-promise__mistake {
  position: relative;
  margin: 0;
}

.og-promise__mistake > span {
  display: block;
}

.og-promise__mistake-accent {
  color: #19f03a;
}

.og-promise__closing-note {
  position: relative;
  margin: 0.9em 0 0;
  color: rgb(255 255 255 / 0.72);
}

.og-promise__closing-note strong {
  color: #fff;
  font-weight: 600;
}

/* Tablets: the cards two to a row. */
@media (max-width: 1023px) {
  .og-promise__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Phones: the shield over the copy; the cards in one column. */
@media (max-width: 767px) {
  .og-promise__lead {
    flex-direction: column;
    align-items: stretch;
    aspect-ratio: auto;
    max-height: none;
  }

  .og-promise__picture {
    position: relative;
    inset: auto;
    aspect-ratio: 1 / 1;
  }

  .og-promise__picture :deep(img) {
    object-position: 82% 50%;
  }

  .og-promise__picture::after {
    position: absolute;
    inset: auto 0 0;
    height: 28%;
    background: linear-gradient(to bottom, transparent, #000);
    content: "";
  }

  .og-promise__copy {
    max-width: none;
    margin: -1.5rem 0 0;
    padding-inline: 1.25rem;
  }

  .og-promise__text {
    margin-top: 1.25rem;
  }
}

@media (max-width: 599px) {
  .og-promise__cards {
    grid-template-columns: 1fr;
  }
}
</style>
