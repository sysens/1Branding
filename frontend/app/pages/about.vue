<script setup lang="ts">
import { computed } from "vue";
import OptImage from "~/components/ui/OptImage.vue";

// About OneBranding, after the design: the office, dimmed, full screen, with
// "Different minds. One shared vision." rising over its foot; the CEO, his
// name over a green rule and the way to his story; the story itself beside a
// photo of him at work, ending in "let's talk. one to one."; and the office
// in four photos. The pictures have build-time AVIF/WebP copies
// (public/about-page, scripts/optimize-images.mjs); the CEO's two are cut
// from the design until their originals are in.

const { t } = useI18n();
const localePath = useLocalePath();
const origin = useSiteOrigin();

const OFFICE = [
  { id: "reception", src: "/about-page/office-reception.webp" },
  { id: "meeting", src: "/about-page/office-meeting.webp" },
  { id: "desk", src: "/about-page/office-desk.webp" },
  { id: "lounge", src: "/about-page/office-lounge.webp" },
] as const;

const cmsSeo = await useCmsSeo("aboutPage");
const seoTitle = computed(() => cmsSeo.title.value || t("seo.about.title"));
const seoDescription = computed(() => cmsSeo.description.value || t("seo.about.description"));
usePageSeo({
  title: seoTitle,
  description: seoDescription,
  breadcrumbs: computed(() => [{ name: t("nav.about"), path: localePath("/about") }]),
  structuredData: computed(() => ({
    "@type": "AboutPage",
    name: seoTitle.value,
    description: seoDescription.value,
    isPartOf: { "@id": `${origin}/#website` },
    about: { "@id": `${origin}/#organization` },
    mainEntity: {
      "@type": "Person",
      name: t("aboutPage.ceo.name"),
      jobTitle: t("aboutPage.ceo.jobTitle"),
      image: `${origin}/about-page/ceo-portrait.webp`,
      worksFor: { "@id": `${origin}/#organization` },
    },
  })),
});
</script>

<template>
  <div class="about">
    <!-- The first screen: the office, dimmed, with the heading and the intro
         over its foot. -->
    <div class="about-top">
      <div class="about-hero" aria-hidden="true">
        <OptImage
          src="/about-page/office-lounge.webp"
          alt=""
          sizes="100vw"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
      </div>

      <header class="about-intro">
        <h1 class="about-intro__title">
          <span>{{ t("aboutPage.hero.line1") }}</span>
          {{ " " }}
          <span class="about-intro__accent">{{ t("aboutPage.hero.line2") }}</span>
        </h1>
        <p class="about-intro__text">{{ t("aboutPage.hero.intro") }}</p>
      </header>
    </div>

    <!-- The CEO. -->
    <section class="about-ceo" aria-labelledby="about-ceo-name">
      <div class="about-ceo__portrait">
        <OptImage
          src="/about-page/ceo-portrait.webp"
          :alt="t('aboutPage.ceo.portraitAlt')"
          sizes="(max-width: 767px) 80vw, 29vw"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div class="about-ceo__copy">
        <h2 id="about-ceo-name" v-rise class="about-ceo__name">{{ t("aboutPage.ceo.name") }}</h2>
        <p v-rise class="about-ceo__role">{{ t("aboutPage.ceo.role") }}</p>
        <p v-rise class="about-ceo__actions">
          <a href="#about-story" class="ob-button about-button">{{ t("aboutPage.ceo.more") }}</a>
          <span class="about-ceo__meet">{{ t("aboutPage.ceo.meet") }}</span>
        </p>
      </div>
    </section>

    <!-- His story and the way to a conversation. -->
    <section id="about-story" class="about-story" :aria-label="t('aboutPage.ceo.storyLabel')">
      <div v-rise class="about-story__photo">
        <OptImage
          src="/about-page/ceo-desk.webp"
          :alt="t('aboutPage.ceo.deskAlt')"
          sizes="(max-width: 767px) 90vw, 29vw"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div class="about-story__copy">
        <p v-rise>{{ t("aboutPage.ceo.story1") }}</p>
        <p v-rise class="about-story__questions">
          <span>{{ t("aboutPage.ceo.questions1") }}</span>
          {{ " " }}
          <span>{{ t("aboutPage.ceo.questions2") }}</span>
        </p>
        <p v-rise>{{ t("aboutPage.ceo.story2") }}</p>
        <div class="about-story__talk">
          <p v-rise class="about-story__ask">
            <span>{{ t("aboutPage.ceo.askLine1") }}</span>
            {{ " " }}
            <span>{{ t("aboutPage.ceo.askLine2") }} <span class="about-story__accent">{{ t("aboutPage.ceo.askAccent") }}</span></span>
          </p>
          <NuxtLink v-rise :to="localePath('/contact')" class="ob-button about-button">{{ t("aboutPage.ceo.contact") }}</NuxtLink>
        </div>
      </div>
    </section>

    <!-- The office. -->
    <section class="about-office" :aria-label="t('aboutPage.office.label')">
      <div v-for="photo in OFFICE" :key="photo.id" v-rise class="about-office__photo">
        <OptImage
          :src="photo.src"
          :alt="t(`aboutPage.office.${photo.id}`)"
          sizes="(max-width: 767px) 100vw, 42vw"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
/* The design at 1440px: the heading in 86px type, the intro 21.6px; the CEO's
   name 58px over his role (29px) and a 3px green rule; the story's text
   19px beside a 409px photo; the office photos 3:2, 14px apart, in 84% of
   the screen. */
.about {
  --green: #20e848;
  position: relative;
  overflow-x: clip;
  padding-bottom: clamp(5rem, 10vw, 9rem);
  background: #000;
  color: #fff;
}

/* The first screen: the photo fills it and the heading block sits at its
   foot, all of it in view. (The block rose only 4.5-7rem over the foot of a
   full-screen photo before, so the second line and the intro started below
   the fold on every screen.) Taller than the screen only when the block
   needs it; the top padding then clears the fixed header. */
.about-top {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 32rem;
  min-height: max(32rem, 100vh);
  min-height: max(32rem, 100svh);
  padding-top: 7rem;
  padding-bottom: clamp(2.5rem, 7svh, 5.5rem);
}

.about-hero {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* :deep: the <img> sits inside OptImage, past this page's scope. */
.about-hero :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.42) saturate(0.85);
}

/* The edges and the foot sink into the black, as in the design. */
.about-hero::after {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, rgb(0 0 0 / 0.35) 0%, transparent 22%, transparent 55%, #000 100%),
    radial-gradient(ellipse 75% 85% at 50% 45%, transparent 55%, rgb(0 0 0 / 0.75) 100%);
  content: "";
}

.about-intro {
  position: relative;
  z-index: 1;
  padding-inline: 1.25rem;
  text-align: center;
}

.about-intro__title {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(2.75rem, 6vw, 5.4rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.about-intro__title > span {
  display: block;
}

.about-intro__accent {
  color: var(--green);
}

.about-intro__text {
  max-width: 42em;
  margin: clamp(1rem, 1.8vw, 1.5rem) auto 0;
  color: rgb(255 255 255 / 0.82);
  font-family: var(--app-font-sans);
  font-size: clamp(1rem, 1.5vw, 1.375rem);
  line-height: 1.32;
  text-wrap: balance;
}

/* The design's buttons: bright green, black type. */
.about-button {
  --button-h: clamp(2.75rem, 3.2vw, 2.9rem);
  --button-pad: clamp(1.4rem, 2.2vw, 2rem);
  --button-font: clamp(1.0625rem, 1.6vw, 1.45rem);
  background: linear-gradient(100deg, #11b237 0%, #1fd544 55%, var(--green) 100%);
  color: #000;
  font-weight: 700;
  text-shadow: none;
}

/* The shared button's drifting dark light would sit under the black type. */
.about-button::before {
  display: none;
}

/* The CEO: his cut-out portrait on the left, the copy at its foot. */
.about-ceo {
  display: grid;
  grid-template-columns: minmax(0, 28.3fr) minmax(0, 37.2fr);
  gap: clamp(1.25rem, 2vw, 2rem);
  align-items: end;
  width: min(100% - 2.5rem, 66 * var(--fvw));
  margin: clamp(4rem, 9vw, 8rem) auto 0;
}

/* The cut-out fades out at its foot instead of ending on a straight line. */
.about-ceo__portrait :deep(img) {
  display: block;
  width: 100%;
  height: auto;
  -webkit-mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);
}

.about-ceo__copy {
  padding-bottom: clamp(1rem, 3vw, 3rem);
}

.about-ceo__name {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(2.25rem, 4vw, 3.6rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

/* The role, with the green rule under it. */
.about-ceo__role {
  position: relative;
  width: fit-content;
  margin: 0.2em 0 0;
  padding-bottom: 0.45em;
  color: rgb(255 255 255 / 0.7);
  font-family: var(--app-font-display);
  font-size: clamp(1.25rem, 2vw, 1.8rem);
  font-weight: 400;
  line-height: 1.2;
}

.about-ceo__role::after {
  position: absolute;
  bottom: 0;
  left: 0.05em;
  width: 88%;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #14c93f, var(--green));
  content: "";
}

.about-ceo__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.5rem;
  margin: clamp(1.25rem, 2.2vw, 2rem) 0 0;
}

.about-ceo__meet {
  color: rgb(255 255 255 / 0.42);
  font-family: var(--app-font-display);
  font-size: clamp(1.0625rem, 1.6vw, 1.45rem);
  font-weight: 600;
}

/* The story: the photo, then the copy and the call to talk. */
.about-story {
  display: grid;
  grid-template-columns: minmax(0, 36fr) minmax(0, 59.6fr);
  gap: clamp(1.5rem, 4.4vw, 4rem);
  align-items: start;
  width: min(100% - 2.5rem, 79 * var(--fvw));
  margin: clamp(5rem, 12vw, 11rem) auto 0;
  scroll-margin-top: 7rem;
}

.about-story__photo :deep(img) {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  object-fit: cover;
}

.about-story__copy {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 1.6vw, 1.4rem);
  padding-top: clamp(0rem, 1.4vw, 1.25rem);
}

.about-story__copy > p {
  margin: 0;
  color: rgb(255 255 255 / 0.86);
  font-family: var(--app-font-sans);
  font-size: clamp(1rem, 1.32vw, 1.2rem);
  line-height: 1.22;
}

.about-story__questions {
  color: var(--green) !important;
}

.about-story__questions > span {
  display: block;
}

.about-story__talk {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem 2rem;
  margin-top: clamp(0.75rem, 2vw, 1.75rem);
}

.about-story__ask {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(1.6rem, 2.7vw, 2.45rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.015em;
}

.about-story__ask > span {
  display: block;
}

.about-story__accent {
  color: var(--green);
}

/* The office: four photos, two by two. */
.about-office {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(0.5rem, 1vw, 0.875rem);
  width: min(100% - 2.5rem, 84 * var(--fvw));
  margin: clamp(5rem, 12vw, 11rem) auto 0;
}

.about-office__photo :deep(img) {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 2;
  object-fit: cover;
}

/* Phones: everything in one column. */
@media (max-width: 767px) {
  .about-ceo,
  .about-story {
    grid-template-columns: 1fr;
  }

  .about-ceo__portrait {
    width: min(100%, 22rem);
    margin-inline: auto;
  }

  .about-ceo__copy {
    padding-bottom: 0;
    text-align: center;
  }

  .about-ceo__role {
    margin-inline: auto;
  }

  .about-ceo__actions {
    justify-content: center;
  }

  .about-office {
    grid-template-columns: 1fr;
  }
}
</style>
