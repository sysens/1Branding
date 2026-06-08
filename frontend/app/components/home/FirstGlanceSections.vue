<script setup lang="ts">
type ProductStorySection = {
  titleLead: string;
  titleAccent: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  variant: "image-left" | "image-right";
};

const sections: ProductStorySection[] = [
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
</script>

<template>
  <div class="first-glance-sections">
    <section
      v-for="section in sections"
      :key="section.titleLead"
      class="first-glance-section"
      :class="`first-glance-section--${section.variant}`"
    >
      <div class="first-glance-section__media">
        <img :src="section.imageSrc" :alt="section.imageAlt" loading="lazy" />
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
</template>

<style scoped>
.first-glance-sections {
  position: relative;
  z-index: 2;
  overflow: hidden;
  background: #000000;
}

.first-glance-section {
  position: relative;
  display: flex;
  align-items: center;
  min-height: clamp(40rem, 84vh, 58rem);
  width: min(100%, 1728px);
  margin-inline: auto;
  /* no overflow:hidden / no background here — let the two bottles bleed across
     the seam and blend into one scene; the wrapper clips the outer edges. */
}

.first-glance-section--image-right {
  min-height: clamp(48rem, 104vh, 72rem);
}

/* ---- Bottle image: large & dominant, copy overlaps its dark side (square source, black bg) ---- */
.first-glance-section__media {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.first-glance-section--image-left .first-glance-section__media {
  justify-content: flex-start;
}

.first-glance-section--image-right .first-glance-section__media {
  justify-content: flex-end;
}

.first-glance-section__media img {
  display: block;
  width: auto;
  max-width: none;
  user-select: none;
}

.first-glance-section--image-left .first-glance-section__media img {
  height: 200%;
  margin-left: -20%;
  margin-top: 33%;
}

.first-glance-section--image-right .first-glance-section__media img {
  height: clamp(60rem, 105vh, 68rem);
  margin-right: -12%;
}

/* ---- Copy: vertically centred, overlapping the bottle's darker half ---- */
.first-glance-section__copy {
  position: absolute;
  top: 70%;
  z-index: 2;
  max-width: 42rem;
  transform: translateY(-50%);
}

.first-glance-section--image-left .first-glance-section__copy {
  left: 47%;
  width: min(42rem, 46vw);
}

.first-glance-section--image-right .first-glance-section__copy {
  right: 47%;
  width: min(42rem, 46vw);
}

.first-glance-section__copy::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: -1;
  width: 34rem;
  height: 28rem;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08), transparent 68%);
  pointer-events: none;
}

.first-glance-section__copy h2 {
  margin: 0;
  color: #ffffff;
  font-size: clamp(3.2rem, 5.2vw, 6rem);
  font-weight: 900;
  line-height: 0.98;
  letter-spacing: 0;
}

.first-glance-section__copy p {
  max-width: 34rem;
  margin: clamp(0.9rem, 1.4vw, 1.2rem) 0 0;
  color: rgba(255, 255, 255, 0.88);
  font-size: clamp(1rem, 1.25vw, 1.2rem);
  font-weight: 400;
  line-height: 1.28;
}

.first-glance-section__copy h2 span {
  display: block;
  color: #03cb00;
}

/* ---- Tablet / mobile: stack the bottle over the copy ---- */
@media (max-width: 900px) {
  .first-glance-section,
  .first-glance-section--image-right {
    min-height: auto;
    flex-direction: column;
    justify-content: center;
    padding: 2.5rem 1.25rem 3.5rem;
  }

  .first-glance-section__media {
    position: relative;
    inset: auto;
    justify-content: center;
    width: 100%;
  }

  .first-glance-section--image-left .first-glance-section__media img,
  .first-glance-section--image-right .first-glance-section__media img {
    width: min(100%, 27rem);
    height: auto;
  }

  .first-glance-section__copy,
  .first-glance-section--image-left .first-glance-section__copy,
  .first-glance-section--image-right .first-glance-section__copy {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    width: 100%;
    max-width: 34rem;
    margin-top: 1.5rem;
    transform: none;
    text-align: left;
  }

  .first-glance-section__copy h2 {
    font-size: clamp(2.8rem, 12vw, 4.5rem);
  }

  .first-glance-section__copy p {
    max-width: 31rem;
  }
}
</style>
