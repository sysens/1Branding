<script setup lang="ts">
import { computed } from "vue";
import { useViewportActivity } from "~/composables/useViewportActivity";

// Vue port of the Aceternity "3D Marquee": columns of cards on a plane tilted
// with rotateX(55deg) rotateZ(-45deg); even columns drift down 100px over 10s,
// odd columns up 100px over 15s, both reversing forever. Six columns instead of
// the reference's four: the two extra ones sit left of the original plane (they
// land in the lower-left corner on screen, which was left empty).
type MarqueeCard = { src: string; title: string };

const COLUMNS = 6;

const LOGO_CARDS: readonly [string, string][] = [
  ["apexpizza", "Apex Pizza"], ["RedBull", "Red Bull"], ["dodokids", "Dodo Kids"], ["Poyqadam", "Poyqadam"],
  ["perfectCandy", "Perfect Candy"], ["Korean", "Korean Kimpab"], ["grechno", "Grechno"], ["luxion", "Luxion"],
  ["daniel", "Daniel Hill Hotel"], ["nescafe", "Nescafe Dolce Gusto"], ["brono", "Brono 360"], ["Makva", "Makva"],
  ["streetvibe", "Street Vibe Tuning"], ["merhaba", "Merhaba"], ["Raviosta", "Raviosta"], ["kebabHouse", "Kebab House"],
  ["burger", "202 Burger"], ["OMAF", "OMAF"], ["milka", "Milka"], ["st77", "ST77"], ["GreenGo", "GreenGo"],
  ["Luqmam", "Luqman"], ["gorilla", "Gorilla Energy Drink"], ["asakabank", "Asakabank"], ["chizzago", "Chizzago"],
  ["delicco", "Delicco"], ["GlossMaxx", "Gloss Maxx"], ["cambridge", "Cambridge Ice Cream"], ["cybernat", "Cybernat"],
  ["yana", "Yana"], ["artAnor", "Art-Anor"], ["barberra", "Barberra"], ["marinno", "Marinno"], ["purple", "Purple Edition"],
];

// Product visuals (packaging / campaign shots), as in the design's marquee.
const PRODUCT_CARDS: readonly [string, string][] = [
  ["p22", "Apex Pizza campaign"], ["p26", "Red Bull rebranding"], ["p16", "Makva pasta packaging"],
  ["p23", "Gorilla energy drink"], ["p25", "Kebab House campaign"], ["p27", "Marinno shashlik market"],
  ["p199", "Yana brunch oats packaging"], ["p21", "Roshen candy concept"], ["p17", "Dark Milk chocolate packaging"],
  ["p12", "Perfect Candy campaign"], ["p14", "Art-Anor jewellery campaign"], ["p19", "Nescafe Cosmic concept"],
  ["p36", "Perfect Candy cupcakes"], ["p35", "Frappuccino concept"], ["p31", "Burger King concept"],
  ["p33", "202 Burger campaign"], ["p11", "Lafarella desserts"], ["p34", "Bliss juice packaging"],
  ["p29", "Old Gold chocolate packaging"], ["p24", "Vita fruit bars packaging"],
];

// Spread the product shots evenly between the logo cards.
const DEFAULT_CARDS: readonly MarqueeCard[] = (() => {
  const total = LOGO_CARDS.length + PRODUCT_CARDS.length;
  const cards: MarqueeCard[] = [];
  let logo = 0, product = 0;
  for (let i = 0; i < total; i++) {
    const wantProducts = Math.round(((i + 1) * PRODUCT_CARDS.length) / total);
    const [file, title] = product < wantProducts || logo >= LOGO_CARDS.length
      ? PRODUCT_CARDS[product++]!
      : LOGO_CARDS[logo++]!;
    cards.push({ src: `/home/marquee/cards/${file}.webp`, title: `${title} — OneBranding` });
  }
  return cards;
})();

const props = withDefaults(defineProps<{ images?: string[] }>(), { images: () => [] });

const cards = computed<readonly MarqueeCard[]>(() =>
  props.images.length
    ? props.images.map((src, index) => ({ src, title: `OneBranding project ${index + 1}` }))
    : DEFAULT_CARDS
);

// Split the cards into equal columns, as in the React reference.
const columns = computed(() => {
  const size = Math.ceil(cards.value.length / COLUMNS);
  return Array.from({ length: COLUMNS }, (_, index) => cards.value.slice(index * size, index * size + size));
});

// CSS animations keep running off-screen; pause them while the section is far away.
const { targetRef, isActive } = useViewportActivity({ rootMargin: "300px 0px" });
</script>

<template>
  <figure ref="targetRef" class="three-d-marquee" :class="{ 'is-paused': !isActive }" aria-label="OneBranding project gallery">
    <div class="three-d-marquee__viewport">
      <div class="three-d-marquee__stage">
        <div class="three-d-marquee__plane">
          <div
            v-for="(column, columnIndex) in columns"
            :key="columnIndex"
            class="three-d-marquee__column"
            :class="columnIndex % 2 === 0 ? 'three-d-marquee__column--down' : 'three-d-marquee__column--up'"
          >
            <span class="three-d-marquee__line three-d-marquee__line--vertical" aria-hidden="true" />
            <div v-for="card in column" :key="card.src" class="three-d-marquee__card">
              <span class="three-d-marquee__line three-d-marquee__line--horizontal" aria-hidden="true" />
              <img
                class="three-d-marquee__image"
                :src="card.src"
                :alt="card.title"
                width="970"
                height="700"
                loading="lazy"
                decoding="async"
                draggable="false"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    <figcaption class="sr-only">{{ cards.map((card) => card.title).join(", ") }}</figcaption>
  </figure>
</template>

<style scoped>
/* Taller than the reference's 600px so, as in the design, several rows show
   below the light before fading into the black. */
.three-d-marquee {
  position: relative;
  width: 100%;
  height: 50rem;
  margin: 0;
  overflow: hidden;
  background: #000;
}

/* Blend the tilted plane into the green light above and the black section below. */
.three-d-marquee::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  /* The light's veil dims the cards under it; this only fades the band out at the bottom. */
  background: linear-gradient(to bottom, rgb(0 0 0 / 0.25) 0%, transparent 20%, transparent 62%, #000 100%);
}

.three-d-marquee__viewport {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

/* size-[1720px] shrink-0 scale-50 sm:scale-75 lg:scale-100 */
.three-d-marquee__stage {
  flex-shrink: 0;
  width: 1720px;
  height: 1720px;
  transform: scale(0.5);
}

/* relative top-96 right-[50%] grid origin-top-left gap-8 transform-3d, with two
   extra 406px columns (+2 gaps = 876px): the plane grows by 876px and is moved
   back 876px along its own X axis, so the original four columns keep their
   place and the new ones fill the lower-left of the band. */
.three-d-marquee__plane {
  position: relative;
  top: 384px;
  right: 50%;
  display: grid;
  width: calc(100% + 876px);
  height: 100%;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 32px;
  transform: rotateX(55deg) rotateY(0deg) rotateZ(-45deg) translateX(-876px);
  transform-origin: top left;
  transform-style: preserve-3d;
}

.three-d-marquee__column {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 32px;
  will-change: transform;
}

.three-d-marquee__column--down {
  animation: three-d-marquee-down 10s ease-in-out infinite alternate;
}

.three-d-marquee__column--up {
  animation: three-d-marquee-up 15s ease-in-out infinite alternate;
}

.is-paused .three-d-marquee__column {
  animation-play-state: paused;
}

@keyframes three-d-marquee-down {
  from { transform: translateY(0); }
  to { transform: translateY(100px); }
}

@keyframes three-d-marquee-up {
  from { transform: translateY(0); }
  to { transform: translateY(-100px); }
}

.three-d-marquee__card {
  position: relative;
  width: 100%;
}

.three-d-marquee__image {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 970 / 700;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 0 0 1px rgb(3 7 18 / 0.05);
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.three-d-marquee__image:hover {
  transform: translateY(-10px);
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(3 7 18 / 0.05);
}

/* Dashed guide lines (GridLineVertical / GridLineHorizontal, dark variant),
   fading out at both ends. */
.three-d-marquee__line {
  position: absolute;
  z-index: 30;
  pointer-events: none;
}

.three-d-marquee__line--vertical {
  top: -40px;
  left: -16px;
  width: 1px;
  height: calc(100% + 80px);
  background: linear-gradient(to bottom, rgb(255 255 255 / 0.2), rgb(255 255 255 / 0.2) 50%, transparent 0, transparent);
  background-size: 1px 5px;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent);
}

.three-d-marquee__line--horizontal {
  top: -16px;
  left: -10px;
  width: calc(100% + 20px);
  height: 1px;
  background: linear-gradient(to right, rgb(255 255 255 / 0.2), rgb(255 255 255 / 0.2) 50%, transparent 0, transparent);
  background-size: 5px 1px;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
}

@media (min-width: 640px) {
  .three-d-marquee__stage { transform: scale(0.75); }
}

@media (min-width: 1024px) {
  .three-d-marquee__stage { transform: scale(1); }
}

/* Wide monitors: keep the tilted plane filling the full-bleed band. */
@media (min-width: 1920px) {
  .three-d-marquee__stage { transform: scale(1.2); }
}

@media (min-width: 2400px) {
  .three-d-marquee__stage { transform: scale(1.45); }
}

/* Ultra-wide (21:9 and 32:9) monitors: the plane is tilted, so it needs to grow
   further to reach the right edge of the band. */
@media (min-width: 3200px) {
  .three-d-marquee__stage { transform: scale(1.75); }
}

@media (min-width: 4200px) {
  .three-d-marquee__stage { transform: scale(2.1); }
}

@media (max-width: 639px) {
  .three-d-marquee { height: 28rem; }
}

@media (prefers-reduced-motion: reduce) {
  .three-d-marquee__column { animation: none; }
  .three-d-marquee__image { transition: none; }
}
</style>
