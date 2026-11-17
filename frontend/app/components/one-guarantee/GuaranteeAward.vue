<script setup lang="ts">
// "Brand of the Year 2023": the award on its stand to the right, the lines
// about it on the left. On phones the picture stands over the text.
import OptImage from "~/components/ui/OptImage.vue";

const { t } = useI18n();
</script>

<template>
  <section class="og-award">
    <div class="og-award__picture">
      <OptImage
        src="/one-guarantee-page/award.webp"
        :alt="t('oneGuarantee.award.alt')"
        sizes="(max-width: 767px) 150vw, 100vw"
        loading="lazy"
        decoding="async"
        :preview="false"
      />
    </div>

    <div class="og-award__copy">
      <p v-rise class="og-award__lines type-h4">
        <span>{{ t("oneGuarantee.award.line1") }}</span>
        <span class="og-award__lines-accent">{{ t("oneGuarantee.award.line2") }}</span>
      </p>
      <h2 class="og-award__title">
        <span v-rise class="og-award__name type-h3 type-caps">{{ t("oneGuarantee.award.title") }}</span>
        <span v-blur-reveal class="og-award__year type-display-l og-grad">{{ t("oneGuarantee.award.year") }}</span>
      </h2>
      <p v-rise class="og-award__note type-h4">{{ t("oneGuarantee.award.note") }}</p>
    </div>
  </section>
</template>

<style scoped>
/* The design at 1440px: the section 940px tall, the copy 168px from the
   left. Type is the site's scale: the lines h4, "BRAND OF THE YEAR" h3 in
   capitals, "2023" display-l. */
/* The section is the content frame, as on the landing: as wide as the screen
   up to 1920px, centred on the black page on wider ones (--frame-max). */
.og-award {
  position: relative;
  display: flex;
  align-items: center;
  max-width: var(--frame-max);
  min-height: clamp(34rem, 65 * var(--fvw), 76rem);
  margin-inline: auto;
  background: #000;
  overflow: hidden;
}

.og-award__picture {
  position: absolute;
  inset: 0;
}

/* The picture is nearly black at its top and foot, not quite: both sink into
   the black round it, so neither ends on a line. */
.og-award__picture::before,
.og-award__picture::after {
  position: absolute;
  right: 0;
  left: 0;
  height: 9%;
  content: "";
  pointer-events: none;
}

.og-award__picture::before {
  top: 0;
  background: linear-gradient(to bottom, #000 0%, rgb(0 0 0 / 0.7) 35%, rgb(0 0 0 / 0.28) 70%, transparent 100%);
}

.og-award__picture::after {
  bottom: 0;
  background: linear-gradient(to top, #000 0%, rgb(0 0 0 / 0.7) 35%, rgb(0 0 0 / 0.28) 70%, transparent 100%);
}

/* Wider than the frame: its sides fade into the black page too. */
@media (min-width: 1921px) {
  .og-award__picture {
    -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
    mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
  }
}

.og-award__picture :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 70% 50%;
}

.og-award__copy {
  position: relative;
  z-index: 1;
  margin-left: max(1.25rem, 11.6 * var(--fvw));
  padding-block: 4rem;
}

.og-award__lines {
  display: grid;
  margin: 0;
}

.og-award__lines-accent {
  color: #1fc23c;
}

.og-award__title {
  display: grid;
  margin: clamp(2.5rem, 6.4 * var(--fvw), 7.5rem) 0 0;
}

.og-award__name {
  color: #f7ffe9;
}

.og-award__year {
  width: fit-content;
  padding-bottom: 0.04em;
}

.og-award__note {
  margin: clamp(0.5rem, 1 * var(--fvw), 1.2rem) 0 0;
}

/* Phones: the award over the copy, which is centred. */
@media (max-width: 767px) {
  .og-award {
    flex-direction: column;
    align-items: stretch;
    min-height: 0;
  }

  .og-award__picture {
    position: relative;
    inset: auto;
    aspect-ratio: 1 / 1;
  }

  .og-award__picture :deep(img) {
    object-position: 76% 50%;
  }

  /* The copy stands on the picture's foot: a deeper fade there. */
  .og-award__picture::after {
    height: 30%;
  }

  .og-award__copy {
    margin: -2.5rem 0 0;
    padding: 0 1.25rem 3.5rem;
    text-align: center;
  }

  .og-award__year {
    margin-inline: auto;
  }
}
</style>
