<script setup lang="ts">
// OneGuarantee, after the design (oneguarantee.pdf): the wordmark under a beam
// of light and the page's claim; "500+ Designers" on white, under a horizon
// that bows as it is scrolled; the clients' reviews in two rows running
// against each other; "With 2500+" over a ribbon of light; the Brand of the
// Year award; the racing car on its running track; the offer in a neon box;
// the six commitments under the shield; and the way to the contact page.
// Each is a component of its own (components/one-guarantee); the page's copy
// is in i18n (oneGuarantee.*), the reviews come from the CMS.
import { computed } from "vue";
import GuaranteeAward from "~/components/one-guarantee/GuaranteeAward.vue";
import GuaranteeCta from "~/components/one-guarantee/GuaranteeCta.vue";
import GuaranteeDeadline from "~/components/one-guarantee/GuaranteeDeadline.vue";
import GuaranteeDesigners from "~/components/one-guarantee/GuaranteeDesigners.vue";
import GuaranteeHero from "~/components/one-guarantee/GuaranteeHero.vue";
import GuaranteeProjects from "~/components/one-guarantee/GuaranteeProjects.vue";
import GuaranteePromise from "~/components/one-guarantee/GuaranteePromise.vue";
import GuaranteeReviews from "~/components/one-guarantee/GuaranteeReviews.vue";
import GuaranteeSpeed from "~/components/one-guarantee/GuaranteeSpeed.vue";

const { t } = useI18n();

const cmsSeo = await useCmsSeo("oneGuaranteePage");
const localePath = useLocalePath();
usePageSeo({
  title: computed(() => cmsSeo.title.value || t("seo.oneGuarantee.title")),
  description: computed(() => cmsSeo.description.value || t("seo.oneGuarantee.description")),
  breadcrumbs: computed(() => [{ name: "OneGuarantee", path: localePath("/one-guarantee") }]),
});
</script>

<template>
  <div class="og-page">
    <GuaranteeHero />
    <GuaranteeDesigners />
    <GuaranteeReviews />
    <GuaranteeProjects />
    <GuaranteeAward />
    <GuaranteeSpeed />
    <GuaranteeDeadline />
    <GuaranteePromise />
    <GuaranteeCta />
  </div>
</template>

<!-- Not scoped: the sections share the green text and the button. -->
<style>
/* overflow-x: clip, not hidden (hidden would make this the sections' scroller). */
.og-page {
  position: relative;
  overflow-x: clip;
  background: #000;
  color: #fff;
}

/* The design's green type: bright at its upper left, deeper to the lower right. */
.og-page .og-grad {
  background: linear-gradient(112deg, #00ff0a 0%, #10d638 52%, #17a54a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

/* The design's buttons: bright green, dark type (as on /about). Only the
   colours are the page's: the size, the face and the weight are the site
   button's own (.ob-button: the lead step at 600). */
.og-page .og-button {
  background: linear-gradient(100deg, #0fd33a 0%, #19e046 50%, #0ea83a 100%);
  color: #04200b;
  text-shadow: none;
}

/* The shared button's drifting dark light would sit under the dark type. */
.og-page .og-button::before {
  display: none;
}

.og-page .og-button--caps {
  letter-spacing: var(--type-caps-ls);
  text-transform: uppercase;
}
</style>
