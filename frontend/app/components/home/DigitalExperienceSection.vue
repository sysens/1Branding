<script setup lang="ts">
import { MacbookScroll } from "~/components/ui/macbook-scroll";
</script>

<template>
  <section class="digital-experience" aria-labelledby="digital-experience-title">
    <header class="digital-experience__copy">
        <h2 id="digital-experience-title" class="digital-experience__title">
          <span>We build digital</span>
          <span>experiences that</span>
          <span><strong>feel premium</strong> and</span>
          <span>work flawlessly</span>
        </h2>
        <p class="digital-experience__description">
          and turn every interaction into a stronger connection between the brand and its audience.
        </p>
    </header>
    <MacbookScroll title="" src="/home/macbook-linear.webp" :show-gradient="false" alt="Linear project management interface on a MacBook" />
  </section>
</template>

<style scoped>
.digital-experience { position: relative; isolation: isolate; overflow: clip; background: #fff; padding-top: 16rem; }
.digital-experience__copy { text-align: center; }
.digital-experience :deep(.macbook-scroll) { padding-block: 5rem 0; }
.digital-experience__title {
  max-width: 54rem;
  margin: 0 auto;
  padding-inline: 1rem;
  color: #303230;
  font-family: var(--app-font-display);
  font-size: 5rem;
  font-weight: 700;
  line-height: 1.16;
  letter-spacing: 0;
}
.digital-experience__title > span { display: block; }
.digital-experience__title strong { color: #00b534; font-weight: inherit; }
.digital-experience__description { max-width: 58rem; margin: 1.75rem auto 0; padding-inline: 1.25rem; color: #666b67; font-family: var(--app-font-sans); font-size: 1rem; font-weight: 400; line-height: 1.4; letter-spacing: 0; }
@media (min-width: 768px) and (max-width: 1023px) {
  .digital-experience { padding-top: 10rem; }
  .digital-experience__title { font-size: 4rem; }
}
@media (max-width: 767px) {
  .digital-experience { padding-top: 6rem; }
  .digital-experience__title { font-size: 2.25rem; line-height: 1.18; }
  .digital-experience__description { font-size: 0.875rem; margin-top: 1.25rem; }
}
@media (max-width: 359px) { .digital-experience__title { font-size: 2rem; } }
</style>
