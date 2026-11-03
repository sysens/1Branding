<script setup lang="ts">
// The case study's column: each section of buildCaseSections()
// (utils/caseStudy.ts) rendered by the component of its type. A new kind of
// section is a type there and a line in SECTIONS here.
import { computed, type Component } from "vue";
import type { CaseSection } from "~/utils/caseStudy";
import CaseHero from "./CaseHero.vue";
import CasePalette from "./CasePalette.vue";
import CasePicture from "./CasePicture.vue";
import CaseText from "./CaseText.vue";

const SECTIONS: Record<CaseSection["type"], Component> = {
  hero: CaseHero,
  text: CaseText,
  picture: CasePicture,
  palette: CasePalette,
};

const props = defineProps<{ sections: CaseSection[] }>();

// The first picture is in the first screen: it loads at once.
const cover = computed(() => props.sections.find((section) => section.type === "picture")?.id);

const sectionProps = (section: CaseSection) => {
  const { type: _type, id: _id, ...rest } = section;
  return section.type === "picture" ? { ...rest, eager: section.id === cover.value } : rest;
};
</script>

<template>
  <div class="case-sections">
    <component
      :is="SECTIONS[section.type]"
      v-for="section in sections"
      :id="`case-${section.id}`"
      :key="section.id"
      v-bind="sectionProps(section)"
      :class="`case-sections__${section.type}`"
    />
  </div>
</template>

<style scoped>
/* The design's spacing at 1440px: about 55px from the heading to the text,
   80px between the other sections. */
.case-sections > * + * {
  margin-top: clamp(2.5rem, 5.5vw, 6rem);
}

.case-sections > .case-sections__hero + * {
  margin-top: clamp(1.75rem, 3.8vw, 4.5rem);
}

/* Text after text (the story, then the palette's note) stays one block. */
.case-sections > .case-sections__text + .case-sections__text {
  margin-top: clamp(1.5rem, 2.5vw, 3rem);
}
</style>
