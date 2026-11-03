<script setup lang="ts">
// The case study's heading, centred: what was made in two display lines,
// "Rebranding" in light grey fading out towards its foot and "& Branding" in
// bold green pulled up over it. The project's name is the page's h1 for
// search engines and screen readers.
defineProps<{ name: string; title: string; accent: string }>();
</script>

<template>
  <header class="case-hero">
    <h1 class="sr-only">{{ name || [title, accent].filter(Boolean).join(" & ") }}</h1>
    <p class="case-hero__lines">
      <span v-if="title" class="case-hero__title"><span>{{ title }}</span></span>
      <span class="case-hero__accent" :class="{ 'case-hero__accent--alone': !title }">
        <span>{{ title ? `& ${accent}` : accent }}</span>
      </span>
    </p>
  </header>
</template>

<style scoped>
.case-hero {
  text-align: center;
}

/* The display-l step (64 / 176 / 224). The lines sit 0.6em apart, baseline
   to baseline, so the green caps rise just above the grey line's foot. */
.case-hero__lines {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: var(--type-display-l-size);
  font-weight: 700;
  line-height: 1;
  letter-spacing: var(--type-display-l-ls);
  overflow-wrap: anywhere;
}

.case-hero__title,
.case-hero__accent {
  display: block;
}

/* Each line of the text gets its own gradient (clone), measured from the top
   of the glyphs' box: full grey at the caps' top, a pale trace at the
   baseline, nothing below. */
.case-hero__title > span,
.case-hero__accent > span {
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
}

.case-hero__title > span {
  background-image: linear-gradient(
    to bottom,
    rgb(148 148 148) 0.25em,
    rgb(148 148 148 / 0.55) 0.62em,
    rgb(148 148 148 / 0.12) 0.98em,
    rgb(148 148 148 / 0) 1.1em
  );
}

/* The brand green, deeper at the top left and brighter to the bottom right. */
.case-hero__accent > span {
  background-image: linear-gradient(105deg, #00962e 0%, #00b232 45%, #03d436 100%);
}

.case-hero__accent {
  margin-top: -0.4em;
}

.case-hero__accent--alone {
  margin-top: 0;
}

/* The lines come up in turn as the page opens. */
@media (prefers-reduced-motion: no-preference) {
  .case-hero__title,
  .case-hero__accent {
    animation: case-hero-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .case-hero__accent {
    animation-delay: 0.12s;
  }
}

@keyframes case-hero-rise {
  from {
    opacity: 0;
    translate: 0 0.25em;
  }
}
</style>
