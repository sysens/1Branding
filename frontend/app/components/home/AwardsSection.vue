<script setup lang="ts">
import { computed } from "vue";
import Brands from "~/components/home/Brands.vue";
import AwardsStage from "~/components/home/awards/AwardsStage.vue";
import AwardsTransition from "~/components/home/awards/AwardsTransition.vue";

const { t } = useI18n();

// `numeral` is the green "1" in front of the stage's gallery; `transition` the
// green-to-yellow glow under the stage that led into the yellow brand stories.
// The landing leaves both out, other pages can keep them.
withDefaults(defineProps<{ logos?: string[]; numeral?: boolean; transition?: boolean }>(), { logos: () => [], numeral: true, transition: true });

// The clients' white logos (public/home/partners, trimmed to their artwork and
// 98px tall: twice the strip's logo height), with the brand names that are
// their alt text and the width / height of their artwork, which Brands turns
// into a height that gives every logo about the same visual area. A page can
// pass its own list.
const PARTNERS: Record<string, [name: string, ratio: number]> = {
  "202-burger": ["202 Burger", 1.98], "anvar-usta": ["Anvar Usta", 2.602], "apex-pizza": ["Apex Pizza", 3.653],
  "art-anor": ["Art-Anor", 3.571], "asakabank": ["Asakabank", 4.102], "barberra": ["Barberra", 1.194],
  "bliss": ["Bliss", 1.061], "brono-360": ["Brono 360", 5.071], "burger-king": ["Burger King", 0.918],
  "cyber-nat": ["Cyber Nat", 2.99], "deco-360": ["Deco 360", 2.439], "dodo-kids": ["Dodo Kids", 2.408],
  "gloss-maxx": ["Gloss Maxx", 1.786], "grechno": ["Grechno", 3.592], "hayaati": ["Hayaati", 2.602],
  "lemonart": ["Lemon Art", 17.241], "luqmam": ["Luqmam", 1.653], "marinno": ["Marinno", 3.837],
  "mayda-manti": ["Mayda Manti", 2.459], "nescafe": ["Nescafé", 3.673], "nivea": ["Nivea", 1],
  "omaf": ["OMAF", 1.582], "overspray": ["Overspray", 1.714], "ozpermit": ["OzPermit", 3.092],
  "perfect-candy": ["Perfect Candy", 6.667], "poyqadam": ["Poyqadam", 3.408], "raviosta": ["Raviosta", 1.449],
  "red-bull": ["Red Bull", 2.694], "starbucks": ["Starbucks", 1.01], "street-77": ["Street 77", 3.582],
  "wok": ["WOK", 3.265],
};
const PARTNER_LOGOS = Object.keys(PARTNERS).map((name) => `/home/partners/${name}.webp`);
const PARTNER_NAMES = Object.values(PARTNERS).map(([name]) => name);
const PARTNER_RATIOS = Object.values(PARTNERS).map(([, ratio]) => ratio);

const year = computed(() => t("home.awards.year") || "2026");
const title = computed(() => t("home.awards.title") || "Awwward");
const subtitle = computed(() => t("home.awards.subtitle") || "for the brands we build across Uzbekistan");
</script>

<template>
  <section id="awards" class="awards-section" aria-labelledby="awards-title">
    <div class="awards-section__brands" role="group" :aria-label="$t('a11y.clients')">
      <Brands
        :logos="logos.length ? logos : PARTNER_LOGOS"
        :alts="logos.length ? [] : PARTNER_NAMES"
        :ratios="logos.length ? [] : PARTNER_RATIOS"
        :duration-seconds="160"
      />
    </div>
    <header class="awards-section__heading">
      <h2 id="awards-title">
        <span v-blur-reveal class="awards-section__year">{{ `${year} ` }}</span>
        <span v-blur-reveal class="awards-section__title">{{ title }}</span>
      </h2>
      <p v-blur-reveal>{{ subtitle }}</p>
    </header>
    <AwardsStage :numeral="numeral" />
    <AwardsTransition v-if="transition" />
  </section>
</template>

<style scoped>
/* flow-root: a trimmed stage pulls the section's own bottom up instead of
   collapsing its negative margin through and sliding the next section under. */
.awards-section { position: relative; z-index: 30; display: flow-root; isolation: isolate; background: #000; color: #fff; }
.awards-section__brands { display: flex; align-items: center; height: 7.5rem; overflow: clip; mask-image: linear-gradient(90deg, transparent, #000 13%, #000 87%, transparent); }
/* The base height is a ratio-3 logo's; Brands sets --logo-scale per logo. */
.awards-section__brands :deep(img) { height: calc(2.125rem * var(--logo-scale, 1)); max-width: none; filter: grayscale(1); opacity: .64; }
.awards-section__brands :deep(.spaceBetween) { min-height: 3.125rem; }
.awards-section__heading { position: relative; z-index: 2; text-align: center; padding-inline: 1.25rem; }
.awards-section__heading h2 { margin: 0; font-family: var(--app-font-display); font-weight: 700; }
/* The outline year (transparent fill: its stroke is the lettering) on the
   display-xl step, the title on display-l. */
.awards-section__year { display: block; font-size: var(--type-display-xl-size); line-height: var(--type-display-xl-lh); letter-spacing: var(--type-display-xl-ls); color: transparent; -webkit-text-stroke: 0.125rem #009c22; mask-image: linear-gradient(#000 48%, transparent 99%); }
/* The title rides up into the year's fading lower half: its caps start just
   under the year's middle. The pull is a share of the year's size, so the
   overlap holds at every step size. */
.awards-section__title { position: relative; display: block; margin-top: calc(-0.43 * var(--type-display-xl-size)); font-size: var(--type-display-l-size); line-height: var(--type-display-l-lh); letter-spacing: var(--type-display-l-ls); background: linear-gradient(115deg, #005e22 10%, #00e429 46%, #009426 86%); background-clip: text; -webkit-text-fill-color: transparent; }
.awards-section__heading p { margin: -2px 0 0; font-family: var(--app-font-display); font-size: var(--type-h4-size); font-weight: 400; line-height: var(--type-h4-lh); letter-spacing: var(--type-h4-ls); text-wrap: balance; }
@media (max-width: 599px) {
  .awards-section__brands { height: 5.625rem; }
  .awards-section__brands :deep(img) { height: calc(1.5rem * var(--logo-scale, 1)); }
  .awards-section__heading { padding-inline: 0.75rem; }
  .awards-section__year { -webkit-text-stroke-width: 1px; }
  .awards-section__heading p { max-width: 19.375rem; margin: 0.625rem auto 0; }
}
</style>
