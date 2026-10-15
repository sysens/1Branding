<script setup lang="ts">
import { computed } from "vue";
import type { LandingSection10Block } from "~/types/landingPayload";
import IdentityReveal from "./IdentityReveal.vue";
import BrandGallery from "./BrandGallery.vue";
import PartsAsOne from "./PartsAsOne.vue";

// The landing's "ONE" block: the identity statement, the horizontally scrolling
// project gallery headed by the CMS section10 title and description, and the
// "Every part. Working as ONE." services scene.
// (The Quaker showcase that used to follow is parked in
// components/services/QuakerShowcase.vue for the Services page.)
type SectionBlock = LandingSection10Block;

const props = withDefaults(
  defineProps<{
    section?: SectionBlock | Array<SectionBlock | null> | null;
  }>(),
  {
    section: null,
  }
);

const hasCopy = (block: SectionBlock | null | undefined): block is SectionBlock =>
  Boolean(block?.title?.trim() || block?.description?.trim());

const s10 = computed<SectionBlock | null>(() => {
  const source = props.section;
  if (Array.isArray(source)) return source.find(hasCopy) ?? null;
  return hasCopy(source) ? source : null;
});
</script>

<template>
  <section class="brand-identity-feature">
    <div class="home-contained">
      <IdentityReveal />
    </div>
    <BrandGallery :title="s10?.title" :description="s10?.description" />
    <div class="home-contained">
      <PartsAsOne />
    </div>
  </section>
</template>

<style scoped src="./InfoOnPicture.css"></style>
