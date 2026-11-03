<script setup lang="ts">
// Running text across the column: grey, with its key phrase in dark bold
// ("We create brands with a distinct identity. …").
import type { CaseTextPart } from "~/utils/caseStudy";

defineProps<{ paragraphs: CaseTextPart[][] }>();
</script>

<template>
  <div class="case-text">
    <p v-for="(parts, index) in paragraphs" :key="index">
      <template v-for="(part, at) in parts" :key="at">
        <strong v-if="part.strong">{{ part.text }}</strong>
        <template v-else>{{ part.text }}</template>
      </template>
    </p>
  </div>
</template>

<style scoped>
/* The intro step (SF Pro Display 22-34 on screens, the lead step on phones),
   the column's full width as in the design: about 90 characters a line. */
.case-text p {
  margin: 0;
  color: #626262;
  font-family: var(--type-intro-family);
  font-size: var(--type-intro-size);
  font-weight: 400;
  line-height: var(--type-intro-lh);
  letter-spacing: var(--type-intro-ls);
  text-wrap: pretty;
}

.case-text p + p {
  margin-top: 1em;
}

.case-text strong {
  color: #000;
  font-weight: 600;
}
</style>
