<script setup lang="ts">
// Under the cover: the illustration beside a short statement in large bold
// lines, its first words in green ("One brand. / One standard. / Zero
// guesswork."); well below, the green heading beside its paragraph. On
// phones they stack in that order.
import { useId } from "vue";
import type { CaseTextPart } from "~/utils/caseStudy";

defineProps<{
  image: { src: string; alt: string; width?: number; height?: number };
  lines: CaseTextPart[][];
  title: string;
  paragraphs: CaseTextPart[][];
}>();

const titleId = useId();
</script>

<template>
  <section class="case-statement" :aria-labelledby="titleId">
    <div class="case-statement__lead">
      <figure class="case-statement__figure">
        <!-- 45% of the 80% column on tablets and up, the screen on phones;
             never wider than the picture itself, so a small one stays sharp. -->
        <NuxtImg
          :src="image.src"
          :alt="image.alt"
          :width="image.width"
          :height="image.height"
          :style="image.width ? { maxWidth: `${image.width}px` } : undefined"
          sizes="xs:100vw sm:100vw md:36vw lg:36vw xl:36vw xxl:36vw"
          loading="lazy"
          decoding="async"
        />
      </figure>

      <p class="case-statement__lines">
        <span v-for="(line, index) in lines" :key="index" class="case-statement__line">
          <template v-for="(part, at) in line" :key="at">
            <span v-if="part.strong" class="case-statement__accent">{{ part.text }}</span>
            <template v-else>{{ part.text }}</template>
          </template>
        </span>
      </p>
    </div>

    <div class="case-statement__system">
      <h2 :id="titleId" class="case-statement__title"><span>{{ title }}</span></h2>
      <div class="case-statement__text">
        <p v-for="(parts, index) in paragraphs" :key="index">
          <template v-for="(part, at) in parts" :key="at">
            <strong v-if="part.strong">{{ part.text }}</strong>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* The illustration takes 45% of the column, the statement the rest, both
   centred on one line. */
.case-statement__lead {
  display: grid;
  grid-template-columns: minmax(0, 45fr) minmax(0, 55fr);
  column-gap: calc(3 * var(--fvw));
  align-items: center;
}

.case-statement__figure {
  margin: 0;
}

.case-statement__figure > :deep(img) {
  display: block;
  width: 100%;
  height: auto;
  margin-inline: auto;
}

/* As large as the longest line ("Zero guesswork.") lets it be in its half:
   a size in the paragraph's own width (about 80px at 1440), a little below
   the green "& Branding" above. */
.case-statement__lines {
  container-type: inline-size;
  margin: 0;
  color: #000;
  font-family: var(--app-font-display);
  font-weight: 700;
}

.case-statement__line {
  display: block;
  font-size: var(--type-display-s-size);
  font-size: 12.6cqi;
  line-height: 1;
  letter-spacing: var(--type-display-m-ls);
}

/* The green of "& Branding" (CaseHero). */
.case-statement__accent,
.case-statement__title > span {
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  color: transparent;
  background-image: linear-gradient(105deg, #00962e 0%, #00b232 45%, #03d436 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* The heading and its paragraph, each from the top of its half, as far
   below the statement as the illustration is tall in the design. */
.case-statement__system {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: calc(3 * var(--fvw));
  align-items: start;
  margin-top: calc(26 * var(--fvw));
}

/* The h3 step in bold capitals, on two balanced lines. */
.case-statement__title {
  max-width: 14em;
  margin: 0;
  font-family: var(--app-font-display);
  font-size: var(--type-h3-size);
  font-weight: 700;
  line-height: var(--type-h3-lh);
  letter-spacing: var(--type-caps-ls);
  text-transform: uppercase;
  text-wrap: balance;
}

.case-statement__text p {
  max-width: 30em;
  margin: 0;
  color: #626262;
  font-family: var(--app-font-sans);
  font-size: var(--type-lead-size);
  line-height: var(--type-lead-lh);
  letter-spacing: var(--type-lead-ls);
  text-wrap: pretty;
}

.case-statement__text p + p {
  margin-top: 1em;
}

.case-statement__text strong {
  color: #000;
  font-weight: 600;
}

/* Phones: illustration, statement, heading, paragraph, one under another. */
@media (max-width: 767px) {
  .case-statement__lead,
  .case-statement__system {
    grid-template-columns: minmax(0, 1fr);
  }

  .case-statement__lead {
    row-gap: 2rem;
  }

  .case-statement__system {
    row-gap: 1rem;
    margin-top: 3.5rem;
  }
}
</style>
