<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

type ProductStorySection = {
  titleLead: string;
  titleAccent: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  variant: "image-left" | "image-right";
};

const { t, te } = useI18n();

const FALLBACK_SECTIONS: ProductStorySection[] = [
  {
    titleLead: "You are chosen at",
    titleAccent: "first glance.",
    description:
      "Decisions are made in seconds. It is the design that determines whether people stay with you or move on.",
    imageSrc: "/home/vivea.webp",
    imageAlt: "Vivea bottle packaging concept",
    variant: "image-left",
  },
  {
    titleLead: "Before they read,",
    titleAccent: "they feel.",
    description:
      "Design creates the first impression and that impression decides everything.",
    imageSrc: "/home/capp.webp",
    imageAlt: "Coffee packaging concept",
    variant: "image-right",
  },
];

const sections = computed<ProductStorySection[]>(() => {
  return FALLBACK_SECTIONS.map((fallback, index) => {
    const text = (field: "titleLead" | "titleAccent" | "description") => {
      const key = `home.firstGlance.sections.${index}.${field}`;
      return te(key) ? t(key) : fallback[field];
    };
    return {
      ...fallback,
      titleLead: text("titleLead"),
      titleAccent: text("titleAccent"),
      description: text("description"),
    } satisfies ProductStorySection;
  });
});
</script>

<template>
  <div class="first-glance-sections">
    <!-- One poster-like stage: every size and position below is a share of the
         stage width (cqw), so the composition matches the design on any screen
         instead of growing with the viewport height. -->
    <div class="first-glance-stage">
      <section
        v-for="section in sections"
        :key="section.titleLead"
        class="first-glance-section"
        :class="`first-glance-section--${section.variant}`"
      >
        <div class="first-glance-section__media">
          <!-- Intrinsic size gives the lazy image a real box before it loads (the
               box starts off-screen; a 0px-wide box never intersects the
               viewport and would never be fetched). -->
          <img :src="section.imageSrc" :alt="section.imageAlt" width="2560" height="2559" loading="lazy" decoding="async" >
        </div>

        <div class="first-glance-section__copy">
          <h2>
            {{ section.titleLead }}
            <span>{{ section.titleAccent }}</span>
          </h2>

          <p>{{ section.description }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.first-glance-sections {
  position: relative;
  z-index: 2;
  overflow: hidden;
  background: #000000;
}

.first-glance-section__media img {
  display: block;
  max-width: none;
  user-select: none;
  /* Both shots sit on pure black: "lighten" drops that black, so the coffee
     bottle's square canvas never covers the Vivea bottle and the two products
     blend into one scene as in the design. */
  mix-blend-mode: lighten;
}

.first-glance-section__copy h2 {
  margin: 0;
  color: #ffffff;
  font-weight: 900;
  line-height: 0.98;
  letter-spacing: 0;
}

.first-glance-section__copy h2 span {
  display: block;
  color: #03cb00;
}

.first-glance-section__copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
  font-weight: 400;
  line-height: 1.4;
}

/* ---- Desktop: the design composition, measured from the design file.
   Stage width W = min(100%, 2240px); stage height = 118% of W. ---- */
@media (min-width: 901px) {
  .first-glance-stage {
    position: relative;
    width: min(100%, 2240px);
    margin-inline: auto;
    container-type: inline-size;
  }

  .first-glance-section {
    position: relative;
  }

  .first-glance-section--image-left {
    height: 47cqw;
  }

  .first-glance-section--image-right {
    height: 71cqw;
  }

  .first-glance-section__media {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }

  .first-glance-section__media img {
    position: absolute;
    height: auto;
  }

  /* Vivea: the square shot is one stage-width wide; the bottle neck points to
     the top centre and the whole bottle stays left of the copy. */
  .first-glance-section--image-left .first-glance-section__media img {
    left: -24cqw;
    top: -10.7cqw;
    width: 100cqw;
  }

  /* Coffee: starts right of centre, its cap just below the Vivea copy. */
  .first-glance-section--image-right .first-glance-section__media img {
    left: 36cqw;
    top: -4cqw;
    width: 78cqw;
  }

  .first-glance-section__copy {
    position: absolute;
    z-index: 2;
    width: max-content;
  }

  .first-glance-section--image-left .first-glance-section__copy {
    left: 47.8cqw;
    top: 27.5cqw;
  }

  .first-glance-section--image-right .first-glance-section__copy {
    left: 13.9cqw;
    top: 30.5cqw;
  }

  .first-glance-section__copy::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: -1;
    width: 34cqw;
    height: 26cqw;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(255, 255, 255, 0.07), transparent 68%);
    pointer-events: none;
  }

  /* Two unbroken lines ("You are chosen at" / "first glance."). */
  .first-glance-section__copy h2 {
    font-size: max(2.5rem, 4.64cqw);
    white-space: nowrap;
  }

  .first-glance-section__copy p {
    margin-top: 1.3cqw;
    font-size: max(0.875rem, 1.3cqw);
  }

  /* Line lengths from the design: the copy breaks exactly where it does there. */
  .first-glance-section--image-left .first-glance-section__copy p {
    max-width: 35cqw;
  }

  .first-glance-section--image-right .first-glance-section__copy p {
    max-width: 25cqw;
  }
}

/* ---- Tablet / mobile: stack the bottle over the copy ---- */
@media (max-width: 900px) {
  .first-glance-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2.5rem 1.25rem 3.5rem;
  }

  .first-glance-section__media {
    display: flex;
    justify-content: center;
    width: 100%;
    pointer-events: none;
  }

  .first-glance-section__media img {
    width: min(100%, 27rem);
    height: auto;
  }

  .first-glance-section__copy {
    position: relative;
    width: 100%;
    max-width: min(100%, 34rem);
    margin-top: 1.5rem;
    text-align: left;
  }

  .first-glance-section__copy h2 {
    font-size: clamp(2.4rem, 9.5vw, 4.5rem);
  }

  .first-glance-section__copy p {
    max-width: min(100%, 31rem);
    margin-top: 0.9rem;
    font-size: 1rem;
    line-height: 1.35;
  }
}
</style>
