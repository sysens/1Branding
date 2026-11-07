<script setup lang="ts">
import { computed } from "vue";
import CaseSections from "~/components/case-study/CaseSections.vue";
import ApproachArc from "~/components/projects/ApproachArc.vue";
import BrandbookIndex from "~/components/projects/BrandbookIndex.vue";
import IdentityCompare from "~/components/projects/IdentityCompare.vue";
import ShowcaseGallery from "~/components/projects/ShowcaseGallery.vue";
import ShowcaseMarquee from "~/components/projects/ShowcaseMarquee.vue";
import { buildCaseSections, type CaseStudyEntry } from "~/utils/caseStudy";
import type { ServicePageCopy } from "~/utils/serviceCopy";
import type { ServicePage } from "~/utils/servicePages";

// The template of every service page (/services/<slug>), in the look of the
// site's showcase: a white column made of the case-study sections (the
// service's name as the two-line heading, its own words and picture, how the
// work goes and what it includes), then, on black, the clients' work on the 3D
// marquee, the blocks that fit this service (ServicePage.showcase), and the
// page's own remaining sections (prices, our work, questions, related
// services, the call to action: the slot), with the site footer at the end.
// Everything that differs between services (the picture, the words, the extra
// blocks) comes in as props; the layout is the same.
const props = defineProps<{
  service: ServicePage;
  copy: ServicePageCopy;
  /** The service's name ("Branding & rebranding"). */
  name: string;
  /** A picture of another of our projects, for the statement block. */
  illustration: string;
}>();

const caseCopy = useCaseCopy();

// The name as the heading's two lines: "Branding & rebranding" -> "Branding" in
// grey and "& rebranding" in green; "Logo design" -> "Logo" / "& design".
const headingParts = computed(() => {
  const byAmpersand = props.name.split(/\s*&\s*/).map((part) => part.trim()).filter(Boolean);
  if (byAmpersand.length > 1) return [byAmpersand[0]!, byAmpersand.slice(1).join(" & ")];
  const words = props.name.split(/\s+/).filter(Boolean);
  return words.length > 1 ? [words.slice(0, -1).join(" "), words[words.length - 1]!] : [props.name];
});

const sections = computed(() => {
  const { copy, service } = props;
  const steps = copy.process.steps;
  const entry: CaseStudyEntry = {
    tags: headingParts.value.map((label) => ({ label })),
    section1: {
      projectTitle: copy.h1,
      // The answer first, then the longer words.
      text: [copy.lead, ...copy.intro].join("\n\n"),
      images: [{ url: service.image, width: 1200, height: 900, alternativeText: copy.h1 }],
    },
    // How the work goes: the first steps as the statement's lines, the steps
    // as its paragraphs.
    brandSystem: {
      statement: steps.slice(0, 3).map((step) => step.name).join("\n"),
      title: copy.process.title,
      text: steps.map((step) => `**${step.name}.** ${step.text}`).join("\n\n"),
      image: { url: props.illustration, alternativeText: props.name },
    },
    // What it includes.
    section2: { title: copy.includes.title, text: copy.includes.items.join("\n\n") },
  };
  return buildCaseSections(entry, (url) => url || "", caseCopy.value);
});

const has = (block: NonNullable<ServicePage["showcase"]>[number]) => props.service.showcase?.includes(block) ?? false;

const FOOTER_HYDRATION = { rootMargin: "600px 0px" };
</script>

<template>
  <div class="service-template">
    <CaseSections class="service-template__column" :sections="sections" />
    <ShowcaseMarquee class="service-template__marquee" />
    <div class="service-template__dark">
      <ShowcaseGallery v-if="has('gallery')" />
      <ApproachArc v-if="has('approach')" />
      <IdentityCompare v-if="has('identity')" />
      <BrandbookIndex v-if="has('brandbook')" />
      <slot />
    </div>
    <LazyFooter :hydrate-on-visible="FOOTER_HYDRATION" />
  </div>
</template>

<style scoped>
/* Below the site's floating header, as a case study; the column is theirs
   (80% of the screen, the screen less 20px margins on phones). */
.service-template {
  min-height: 100vh;
  padding-top: clamp(8.5rem, 9vw, 9.5rem);
  background: #fff;
  color: #111;
}

.service-template__column {
  width: min(100% - 2.5rem, 80 * var(--fvw));
  margin-inline: auto;
}

/* A full-width section, the case sections' step below the statement. */
.service-template__marquee {
  margin-top: clamp(2.5rem, 5.5vw, 6rem);
}

/* The black run from the marquee to the footer, as the landing's. */
.service-template__dark {
  position: relative;
  background: #000;
  color: #fff;
}

@media (max-width: 767px) {
  .service-template__column {
    width: calc(100% - 2.5rem);
  }
}
</style>
