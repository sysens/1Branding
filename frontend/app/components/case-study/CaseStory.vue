<script setup lang="ts">
// A case story's blocks (a StoryView: utils/caseStories.ts), top to bottom, on
// white: the project's logo as the page's heading (or its name in type),
// centred texts in grey, rows of photographs set edge to edge, the old logo
// and the new one with an arrow between them, a mark beside a few large
// lines, a large heading, the grid of guideline pages, the palette, the
// closing line over a rule. Headings and labels are in the brand's own colour
// (--brand; --brand-ink where the text is small). Type is the site's scale.
// A click on a photograph opens it large (StoryLightbox), with the story's
// other photographs a step away.
import { computed, ref } from "vue";
import type { StoryView, ViewPicture } from "~/utils/caseStories";
import OptImage from "~/components/ui/OptImage.vue";
import StoryLightbox from "./StoryLightbox.vue";

const props = defineProps<{ story: StoryView }>();

// The first row of photographs is in or just under the first screen: it loads at once.
const firstPictures = computed(() => props.story.blocks.findIndex((block) => block.type === "pictures"));

// Every photograph of the story, in the page's order: what the lightbox steps through.
const gallery = computed(() =>
  props.story.blocks.flatMap((block) => (block.type === "pictures" ? block.rows.flat() : block.type === "grid" ? block.pictures : []))
);
/** The photograph on show in the lightbox (its place in the gallery); null while it is closed. */
const shown = ref<number | null>(null);
const open = (picture: ViewPicture) => {
  const place = gallery.value.indexOf(picture);
  if (place >= 0) shown.value = place;
};

// A photograph's width on screen, for the browser to pick a copy by: its share
// of its row, which is 90% of the screen (all of it on phones, where a row's
// pictures stand one under another).
const sizes = (row: ViewPicture[], picture: ViewPicture) => {
  const total = row.reduce((sum, item) => sum + item.ratio, 0);
  return `(max-width: 767px) 94vw, ${Math.round((90.3 * picture.ratio) / total)}vw`;
};

// A picture alone in its row is as wide as the column, unless that would
// blow a small upload up past twice its own size, or make an upright picture
// taller than the screen: then it is narrower, in the middle.
const tile = (row: ViewPicture[], picture: ViewPicture) => {
  const limits: string[] = [];
  if (row.length === 1) {
    if (picture.width) limits.push(`${picture.width * 2}px`);
    if (picture.ratio < 1.2) limits.push(`${Math.round(picture.ratio * 90)}svh`);
  }
  return {
    "--ratio": picture.ratio,
    ...(limits.length ? { maxWidth: limits.length > 1 ? `min(${limits.join(", ")})` : limits[0] } : {}),
  };
};

// The palette's tiles in one row: never larger than a quarter of the column
// (a palette of two is not two halves), and on phones in two rows past five.
const swatches = (count: number) => ({
  "--across": Math.min(Math.max(count, 4), 8),
  "--across-phone": count <= 5 ? Math.max(count, 3) : Math.ceil(count / 2),
});
</script>

<template>
  <article class="story" :style="{ '--brand': story.accent, '--brand-ink': story.ink, '--soft': story.soft }">
    <template v-for="(block, index) in story.blocks" :key="index">
      <!-- The logo is the heading: its words are the project's name and what
           was made, for search engines and screen readers. -->
      <header v-if="block.type === 'logo'" class="story__logo">
        <h1>
          <span class="sr-only">{{ story.title }}</span>
          <img :src="block.mark.src" alt="" :width="block.mark.width" :height="block.mark.height" decoding="async" fetchpriority="high" >
        </h1>
      </header>

      <!-- Without a logo the heading is set in type: the name, and under it
           what was made ("Raviosta" / "logo and identity for…"). -->
      <header v-else-if="block.type === 'title'" class="story__title">
        <h1>
          <span class="story__title-name type-display-s">{{ block.name }}</span>
          <template v-if="block.label">
            <span class="sr-only">: </span>
            <span class="story__title-label">{{ block.label }}</span>
          </template>
        </h1>
      </header>

      <p v-else-if="block.type === 'text'" v-rise class="story__text type-lead">{{ block.text }}</p>

      <div v-else-if="block.type === 'pictures'" class="story__pictures">
        <div v-for="(row, rowIndex) in block.rows" :key="rowIndex" v-rise class="story__row">
          <figure v-for="picture in row" :key="picture.id" class="story__tile" :style="tile(row, picture)">
            <button type="button" class="story__zoom" aria-haspopup="dialog" @click="open(picture)">
              <OptImage
                :src="picture.src"
                :alt="picture.alt"
                :sizes="sizes(row, picture)"
                :loading="index === firstPictures && rowIndex === 0 ? 'eager' : 'lazy'"
                decoding="async"
              />
            </button>
          </figure>
        </div>
      </div>

      <section v-else-if="block.type === 'compare'" class="story__compare">
        <div v-rise class="story__compare-logos">
          <figure>
            <img :src="block.from.src" :alt="block.from.alt" :width="block.from.width" :height="block.from.height" loading="lazy" decoding="async" >
            <figcaption class="story__label">{{ block.from.label }}</figcaption>
          </figure>
          <svg class="story__arrow" viewBox="0 0 100 24" aria-hidden="true" focusable="false">
            <path d="M0 12h98M88 2l10 10-10 10" />
          </svg>
          <figure>
            <img :src="block.to.src" :alt="block.to.alt" :width="block.to.width" :height="block.to.height" loading="lazy" decoding="async" >
            <figcaption class="story__label">{{ block.to.label }}</figcaption>
          </figure>
        </div>
        <p v-rise class="story__text type-lead">{{ block.text }}</p>
      </section>

      <section v-else-if="block.type === 'statement'" class="story__statement" :class="{ 'story__statement--alone': !block.mark }">
        <img v-if="block.mark" v-rise class="story__statement-mark" :src="block.mark.src" :alt="block.mark.alt" :width="block.mark.width" :height="block.mark.height" loading="lazy" decoding="async" >
        <p v-rise class="story__statement-text">{{ block.text }}</p>
      </section>

      <section v-else-if="block.type === 'heading'" class="story__heading">
        <h2 v-blur-reveal class="type-h1">{{ block.title }}</h2>
        <p v-if="block.text" v-rise class="story__text type-lead">{{ block.text }}</p>
      </section>

      <ul v-else-if="block.type === 'grid'" class="story__grid">
        <li v-for="picture in block.pictures" :key="picture.id" v-rise class="story__tile" :style="{ '--ratio': picture.ratio }">
          <button type="button" class="story__zoom" aria-haspopup="dialog" @click="open(picture)">
            <OptImage :src="picture.src" :alt="picture.alt" sizes="(max-width: 599px) 94vw, (max-width: 1023px) 46vw, 30vw" loading="lazy" decoding="async" />
          </button>
        </li>
      </ul>

      <section v-else-if="block.type === 'palette'" class="story__palette">
        <h2 v-rise class="story__label">{{ block.label }}</h2>
        <ul v-rise class="story__swatches" :style="swatches(block.colors.length)">
          <li v-for="hex in block.colors" :key="hex">
            <span class="story__swatch" :style="{ background: hex }" />
            <span class="story__hex">{{ hex }}</span>
          </li>
        </ul>
        <p v-if="block.text" v-rise class="story__text type-lead">{{ block.text }}</p>
      </section>

      <div v-else-if="block.type === 'closing'" class="story__closing">
        <p v-blur-reveal class="type-h1">{{ block.text }}</p>
        <span v-rise class="story__rule" aria-hidden="true" />
      </div>
    </template>

    <StoryLightbox v-model:index="shown" :pictures="gallery" />
  </article>
</template>

<style scoped>
/* The design at 1440px: a column 1300px wide (90.3% of the screen), its
   pictures 6px apart; the logo 605px wide, 300px from the top; texts 19px in
   grey, the large lines in the brand's red. Spaces are in --fvw, so they scale
   with the screen up to the 1920px frame. */
.story {
  --gap: clamp(0.25rem, 0.42 * var(--fvw), 0.5rem);
  width: min(100% - 2.5rem, 90.3 * var(--fvw));
  margin-inline: auto;
  padding-top: clamp(9.5rem, 20.8 * var(--fvw), 25rem);
  color: #111;
}

/* ---------- the logo ---------- */
.story__logo h1,
.story__title h1 {
  margin: 0;
}

.story__logo img {
  display: block;
  width: clamp(15rem, 42 * var(--fvw), 50rem);
  max-width: 100%;
  /* An upright logo (a CMS upload) is no taller than the wide one is wide. */
  max-height: clamp(9rem, 21.7 * var(--fvw), 26rem);
  height: auto;
  margin-inline: auto;
  object-fit: contain;
}

/* ---------- the heading in type ---------- */
.story__title {
  text-align: center;
}

.story__title-name {
  display: block;
  color: var(--brand);
  text-wrap: balance;
  overflow-wrap: anywhere;
}

/* Letter-spaced capitals in the brand's colour: this line under the name, the
   captions under the two logos, the palette's name. (The indent balances the
   space the tracking leaves after the last letter.) */
.story__label,
.story__title-label {
  margin: 0;
  color: var(--brand-ink);
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  font-weight: 400;
  line-height: var(--type-body-lh);
  letter-spacing: 0.32em;
  text-align: center;
  text-indent: 0.32em;
  text-transform: uppercase;
  text-wrap: balance;
}

.story__title-label {
  display: block;
  max-width: 44em;
  margin: clamp(1rem, 1.9 * var(--fvw), 2.3rem) auto 0;
}

/* ---------- texts ---------- */
/* pre-line: a CMS text keeps its paragraphs (a blank line between them). */
.story__text {
  max-width: 58em;
  margin: clamp(3rem, 8.9 * var(--fvw), 10.5rem) auto 0;
  color: #666;
  text-align: center;
  text-wrap: pretty;
  white-space: pre-line;
}

/* ---------- photographs ---------- */
.story__pictures {
  display: grid;
  gap: var(--gap);
  margin-top: clamp(3rem, 6.6 * var(--fvw), 8rem);
}

.story__text + .story__pictures {
  margin-top: clamp(1.75rem, 2.5 * var(--fvw), 3rem);
}

.story__compare + .story__pictures {
  margin-top: clamp(2.5rem, 5.3 * var(--fvw), 6.5rem);
}

/* A row: its pictures share one height, each as wide as its own proportions
   make it (flex-grow is the picture's width over its height). A picture held
   narrower than its row (see tile() above) stands in the middle. */
.story__row {
  display: flex;
  justify-content: center;
  gap: var(--gap);
}

.story__tile {
  position: relative;
  flex: var(--ratio) 1 0;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  aspect-ratio: var(--ratio);
}

/* The photograph is a button: a click opens it large. */
.story__zoom {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
}

.story__zoom:focus-visible {
  outline: 3px solid var(--brand);
  outline-offset: -3px;
}

/* :deep: the <img> sits inside OptImage, past this component's scope. */
.story__tile :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
}

@media (hover: hover) {
  .story__zoom:hover :deep(img) {
    transform: scale(1.025);
  }
}

/* ---------- old logo, new logo ---------- */
.story__compare {
  margin-top: clamp(4rem, 8.3 * var(--fvw), 10rem);
}

.story__compare-logos {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: clamp(1rem, 7.5 * var(--fvw), 9rem);
}

.story__compare-logos figure {
  margin: 0;
}

.story__compare-logos img {
  display: block;
  width: auto;
  height: clamp(8rem, 21.7 * var(--fvw), 26rem);
}

.story__compare-logos figcaption {
  margin-top: clamp(1rem, 2.4 * var(--fvw), 2.9rem);
}

/* The arrow stands at the logos' middle (they are as tall as each other). */
.story__arrow {
  flex: none;
  width: clamp(2.5rem, 7 * var(--fvw), 8.4rem);
  height: auto;
  margin-top: calc(clamp(8rem, 21.7 * var(--fvw), 26rem) / 2 + 2%);
  fill: none;
  stroke: color-mix(in srgb, var(--soft), #5a3a2a 22%);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.story__compare .story__text {
  max-width: 50em;
  margin-top: clamp(3rem, 7.6 * var(--fvw), 9rem);
}

/* ---------- the mark beside the large lines ---------- */
.story__statement {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1.5rem, 6.9 * var(--fvw), 8.3rem);
  margin-top: clamp(3.5rem, 6.6 * var(--fvw), 8rem);
}

/* As tall as the two logos above (the design's mark is 265px wide, 313px
   tall); a wide illustration is wider at that height. */
.story__statement-mark {
  flex: none;
  width: auto;
  max-width: 46%;
  height: clamp(9.5rem, 21.7 * var(--fvw), 26rem);
  object-fit: contain;
}

/* The h3 step, regular: lines to be read, not a heading. The first sentence
   has a line of its own (a line break in the text, kept by pre-line). */
.story__statement-text {
  max-width: 22em;
  margin: 0;
  white-space: pre-line;
  color: var(--brand);
  font-family: var(--app-font-display);
  font-size: var(--type-h3-size);
  font-weight: 400;
  line-height: 1.22;
  letter-spacing: var(--type-h3-ls);
  text-wrap: pretty;
}

/* Without a mark the lines stand alone, in the middle. */
.story__statement--alone .story__statement-text {
  text-align: center;
}

/* ---------- the large heading ---------- */
.story__heading {
  margin-top: clamp(4rem, 7.5 * var(--fvw), 9rem);
  text-align: center;
}

.story__heading h2 {
  margin: 0;
  color: var(--brand);
  text-wrap: balance;
}

.story__heading .story__text {
  max-width: 62em;
  margin-top: clamp(1rem, 1.7 * var(--fvw), 2rem);
}

/* ---------- the guideline pages ---------- */
.story__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.375rem, 0.7 * var(--fvw), 0.85rem);
  margin: clamp(3rem, 6 * var(--fvw), 7.2rem) 0 0;
  padding: 0;
  list-style: none;
}

/* ---------- the palette ---------- */
.story__palette {
  margin-top: clamp(4rem, 7.5 * var(--fvw), 9rem);
}

/* The colours as square tiles in a row, the gap of the photographs between
   them, each over its hex code. */
.story__swatches {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(1.25rem, 2 * var(--fvw), 2.4rem) var(--gap);
  margin: clamp(1.5rem, 2.9 * var(--fvw), 3.5rem) 0 0;
  padding: 0;
  list-style: none;
}

.story__swatches li {
  flex: 0 0 calc((100% - (var(--across) - 1) * var(--gap)) / var(--across));
  min-width: 0;
}

/* A light colour (white, cream) keeps an outline on the white page. */
.story__swatch {
  display: block;
  aspect-ratio: 1;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
}

.story__hex {
  display: block;
  margin-top: clamp(0.5rem, 1 * var(--fvw), 1.2rem);
  color: #666;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  letter-spacing: 0.12em;
  text-align: center;
  text-indent: 0.12em;
}

.story__palette .story__text {
  max-width: 50em;
  margin-top: clamp(2rem, 4.2 * var(--fvw), 5rem);
}

/* ---------- the closing line ---------- */
.story__closing {
  margin-top: clamp(3rem, 4.65 * var(--fvw), 5.6rem);
  text-align: center;
}

.story__closing p {
  max-width: 17em;
  margin: 0 auto;
  color: var(--brand);
  text-wrap: balance;
}

.story__rule {
  display: block;
  width: min(100%, 80 * var(--fvw));
  height: 2px;
  margin: clamp(1.5rem, 3 * var(--fvw), 3.6rem) auto 0;
  border-radius: 2px;
  background: var(--brand);
}

/* Tablets: the guideline pages two to a row. */
@media (max-width: 1023px) {
  .story__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Phones: a row's pictures one under another, each at its own proportions;
   the mark over its lines; the labels' tracking closer, so they keep to a
   line or two. */
@media (max-width: 767px) {
  .story__row {
    flex-direction: column;
    align-items: center;
  }

  .story__tile {
    flex: none;
    width: 100%;
  }

  .story__statement {
    flex-direction: column;
    text-align: center;
  }

  .story__statement-mark {
    max-width: 100%;
  }

  .story__label,
  .story__title-label {
    letter-spacing: 0.2em;
    text-indent: 0.2em;
  }

  .story__swatches li {
    flex-basis: calc((100% - (var(--across-phone) - 1) * var(--gap)) / var(--across-phone));
  }

  .story__hex {
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
    text-indent: 0;
  }
}

@media (max-width: 599px) {
  .story__grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story__tile :deep(img) {
    transition: none;
  }
}
</style>
