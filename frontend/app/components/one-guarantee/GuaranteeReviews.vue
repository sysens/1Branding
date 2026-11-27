<script setup lang="ts">
// "What our clients say": the CMS's client reviews in two rows that never
// stop, the upper one moving right and the lower one left. Each row is its
// cards twice over, sliding by half its width, so the loop has no seam; a row
// with few reviews repeats them until it is wider than any screen.
//
// Placeholder copy ("Lorem ipsum", "Pellentesque ...") is never shown as a
// client's words: made-up testimonials cost trust and search rankings. With
// no real review in the CMS the whole section is left out.
import { computed } from "vue";
import { isPlaceholderCopy } from "~/utils/seo";

type Review = { text: string; author: string; role: string };

const { t } = useI18n();
const { own, fallback } = await useOneGuaranteePage();

// On the dev server the CMS's placeholder reviews are let through, so the
// section can be seen and worked on before real reviews exist. Never in a build.
const SHOW_PLACEHOLDERS = import.meta.dev;

const reviews = computed<Review[]>(() => {
  const mine = own.value?.section3?.comment ?? [];
  const list = mine.length ? mine : fallback.value?.section3?.comment ?? [];
  return list
    .map((item) => ({
      text: (item?.authorQuote ?? "").trim(),
      author: (item?.authorFullName ?? "").trim(),
      role: (item?.authorPosition ?? "").trim(),
    }))
    .filter((item) => item.text && item.author && (SHOW_PLACEHOLDERS || !isPlaceholderCopy(`${item.text} ${item.author} ${item.role}`)));
});

// At least this many cards in one half of a row.
const MIN_CARDS = 8;
const SECONDS_PER_CARD = 7;

const fill = (list: Review[]) => {
  if (!list.length) return [];
  const out: Review[] = [];
  while (out.length < MIN_CARDS) out.push(...list);
  return out;
};

const rows = computed(() => {
  const list = reviews.value;
  if (!list.length) return [];
  // The lower row starts half-way through the list, so the two rows do not
  // show the same review one over the other.
  const shift = Math.ceil(list.length / 2);
  const lower = [...list.slice(shift), ...list.slice(0, shift)];
  return [
    { key: "upper", cards: fill(list), direction: "right" },
    { key: "lower", cards: fill(lower), direction: "left" },
  ].map((row) => ({ ...row, duration: `${row.cards.length * SECONDS_PER_CARD}s` }));
});
</script>

<template>
  <section v-if="rows.length" class="og-reviews" aria-labelledby="og-reviews-title">
    <h2 id="og-reviews-title" v-blur-reveal class="og-reviews__title type-display-s">
      {{ t("oneGuarantee.reviews.titleBefore") }}
      <span class="og-grad ob-green">{{ t("oneGuarantee.reviews.titleAccent") }}</span>
      {{ t("oneGuarantee.reviews.titleAfter") }}
    </h2>

    <div class="og-reviews__rows">
      <div
        v-for="row in rows"
        :key="row.key"
        class="og-reviews__row"
        :class="`og-reviews__row--${row.direction}`"
        :style="{ '--duration': row.duration }"
      >
        <!-- The second copy only closes the loop: hidden from screen readers. -->
        <ul v-for="copy in 2" :key="copy" class="og-reviews__track" :aria-hidden="copy === 2 ? 'true' : undefined">
          <li v-for="(review, index) in row.cards" :key="index" class="og-review">
            <svg class="og-review__mark" viewBox="0 0 30 22" aria-hidden="true" focusable="false">
              <path d="M0 22V12.6C0 5.2 3.9 1 11.6 0v4.9c-3.2.7-4.8 2.7-4.9 5.8h4.9V22H0Zm17 0V12.6C17 5.2 20.9 1 28.6 0v4.9c-3.2.7-4.8 2.7-4.9 5.8h4.9V22H17Z" />
            </svg>
            <blockquote class="og-review__text type-small">{{ review.text }}</blockquote>
            <p class="og-review__author type-lead">{{ review.author }}</p>
            <p v-if="review.role" class="og-review__role type-caption">{{ review.role }}</p>
          </li>
        </ul>
      </div>
    </div>

    <p v-rise class="og-reviews__caption type-intro">{{ t("oneGuarantee.reviews.caption") }}</p>
  </section>
</template>

<style scoped>
/* The design at 1440px: the upper row's cards 330px wide, the lower row's
   390px, 36px apart. Type is the site's scale: the heading display-s, a
   review the small step, its author the lead step (600), the role a caption,
   the line under the rows the intro step. */
.og-reviews {
  position: relative;
  z-index: 1;
  padding-bottom: clamp(4rem, 9 * var(--fvw), 10rem);
  background: #fff;
  color: #000;
  overflow-x: clip;
}

.og-reviews__title {
  margin: 0;
  padding-inline: 1.25rem;
  text-align: center;
  text-wrap: balance;
}

/* The rows fade out towards the sides of the screen. */
.og-reviews__rows {
  display: grid;
  gap: clamp(1.1rem, 2.4 * var(--fvw), 2.6rem);
  margin-top: clamp(1.5rem, 2.6 * var(--fvw), 3rem);
  padding-block: 1rem 2rem;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%);
}

.og-reviews__row {
  --gap: clamp(1rem, 2.5 * var(--fvw), 2.4rem);
  display: flex;
  width: max-content;
  animation: og-reviews-slide var(--duration, 60s) linear infinite;
  will-change: transform;
}

/* The upper row runs the other way: to the right. */
.og-reviews__row--right {
  animation-direction: reverse;
}

.og-reviews__rows:hover .og-reviews__row {
  animation-play-state: paused;
}

.og-reviews__track {
  display: flex;
  gap: var(--gap);
  margin: 0;
  padding: 0 calc(var(--gap) / 2);
  list-style: none;
}

.og-review {
  display: flex;
  flex: none;
  flex-direction: column;
  box-sizing: border-box;
  width: clamp(17.5rem, 23 * var(--fvw), 26rem);
  padding: clamp(1.5rem, 2.4 * var(--fvw), 2.6rem) clamp(1.25rem, 1.9 * var(--fvw), 2.1rem);
  border-radius: clamp(1.25rem, 1.9 * var(--fvw), 2rem);
  background: #fff;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 0.03), 0 0.75rem 2.25rem rgb(0 0 0 / 0.07);
}

.og-reviews__row--left .og-review {
  width: clamp(19rem, 27 * var(--fvw), 30rem);
}

.og-review__mark {
  width: clamp(1.5rem, 2 * var(--fvw), 2.1rem);
  height: auto;
  fill: #6fe04a;
}

.og-review__text {
  flex: 1;
  margin: clamp(1rem, 1.9 * var(--fvw), 2rem) 0 0;
  color: #1b1b1b;
  /* A long review ends in an ellipsis instead of stretching its row. */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
  line-clamp: 6;
  overflow: hidden;
}

.og-review__author {
  margin: clamp(1.25rem, 2.2 * var(--fvw), 2.4rem) 0 0;
  font-weight: 600;
}

.og-review__role {
  margin: 0.35rem 0 0;
  color: #8b8b8b;
}

.og-reviews__caption {
  max-width: var(--type-measure-intro);
  margin: clamp(0.5rem, 1 * var(--fvw), 1.25rem) auto 0;
  padding-inline: 1.25rem;
  color: #b4b4b4;
  text-align: center;
  text-wrap: balance;
}

@keyframes og-reviews-slide {
  to {
    transform: translateX(-50%);
  }
}

/* No endless motion: the rows can be swiped through instead. */
@media (prefers-reduced-motion: reduce) {
  .og-reviews__rows {
    overflow-x: auto;
    -webkit-mask-image: none;
    mask-image: none;
  }

  .og-reviews__row {
    animation: none;
  }

  .og-reviews__track[aria-hidden="true"] {
    display: none;
  }
}
</style>
