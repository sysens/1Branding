<script setup lang="ts">
// The foot of a case study: the way to the services behind it and to a brief.
import { useId } from "vue";

const localePath = useLocalePath();
const titleId = useId();
</script>

<template>
  <section class="case-next" :aria-labelledby="titleId">
    <h2 :id="titleId">{{ $t("project.more") }}</h2>
    <p>
      <NuxtLink :to="localePath('/services')">{{ $t("project.services") }}</NuxtLink>
      <NuxtLink :to="`${localePath('/contact')}#contact-request`" class="ob-button">{{ $t("project.contact") }}</NuxtLink>
    </p>
  </section>
</template>

<style scoped>
.case-next {
  padding-block: clamp(5rem, 9vw, 9rem) clamp(5rem, 8vw, 8rem);
  text-align: center;
}

.case-next h2 {
  margin: 0 0 1.75rem;
  color: #111;
  font-family: var(--app-font-display);
  font-size: var(--type-h3-size);
  line-height: var(--type-h3-lh);
  letter-spacing: var(--type-h3-ls);
  font-weight: 600;
}

.case-next p {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem 1.75rem;
  align-items: center;
  margin: 0;
}

/* The text link (the call to action is the shared .ob-button). */
.case-next a:not(.ob-button) {
  color: #111;
  font-family: var(--app-font-sans);
  font-size: var(--type-body-size);
  line-height: var(--type-body-lh);
  letter-spacing: var(--type-body-ls);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
</style>
