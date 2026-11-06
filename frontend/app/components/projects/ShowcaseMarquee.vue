<script setup lang="ts">
import { computed } from "vue";
import { useViewportActivity } from "~/composables/useViewportActivity";

// The grid view's 3D marquee: a Vue port of Aceternity's "3D Marquee"
// (ui.aceternity.com/components/3d-marquee): columns of cards on a tilted
// plane, the even columns drifting down 100px over 10 s and the odd ones up
// over 15 s, both reversing forever, and a card lifts 10px on hover (no
// grid lines between the cards). The plane takes the design's picture
// rather than the reference's isometric tilt: a flatter angle, seen in
// perspective, with small cards close together in ten columns, the cards
// repeated so the wide, flat plane still reaches every corner. In the grid
// view it is a full-width section on the design's dark ground, its edges
// fading into it. (The landing's six-column variant on black is
// ui/ThreeDMarquee.vue.)
type MarqueeCard = { src: string; name: string };

// Ten columns: past 1920px the cards stop growing (see the style), and the
// plane's outer columns then fill the width of a wide screen.
const COLUMNS = 10;
// Cards in each column: enough for the tilted plane to reach the section's
// top and foot.
const PER_COLUMN = 10;

// The clients' cards (public/home/marquee/cards, 640x462): their logos, with
// the packaging and campaign shots spread evenly between them.
const LOGOS: readonly [string, string][] = [
  ["apexpizza", "Apex Pizza"], ["RedBull", "Red Bull"], ["dodokids", "Dodo Kids"], ["Poyqadam", "Poyqadam"],
  ["perfectCandy", "Perfect Candy"], ["grechno", "Grechno"], ["nescafe", "Nescafé"], ["brono", "Brono 360"],
  ["streetvibe", "Street Vibe Tuning"], ["Raviosta", "Raviosta"], ["burger", "202 Burger"], ["OMAF", "OMAF"],
  ["st77", "Street 77"], ["Luqmam", "Luqmam"], ["asakabank", "Asakabank"], ["GlossMaxx", "Gloss Maxx"],
  ["cybernat", "Cyber Nat"], ["artAnor", "Art-Anor"], ["barberra", "Barberra"], ["marinno", "Marinno"],
];
const SHOTS: readonly [string, string][] = [
  ["p22", "Apex Pizza"], ["p26", "Red Bull"], ["p12", "Perfect Candy"], ["p14", "Art-Anor"], ["p19", "Nescafé"],
  ["p36", "Perfect Candy"], ["p31", "Burger King"], ["p33", "202 Burger"], ["p27", "Marinno"], ["p34", "Bliss"],
];

const DEFAULT_CARDS: readonly MarqueeCard[] = (() => {
  const total = LOGOS.length + SHOTS.length;
  const cards: MarqueeCard[] = [];
  let logo = 0, shot = 0;
  for (let index = 0; index < total; index++) {
    const wantShots = Math.round(((index + 1) * SHOTS.length) / total);
    const [file, name] = shot < wantShots || logo >= LOGOS.length ? SHOTS[shot++]! : LOGOS[logo++]!;
    cards.push({ src: `/home/marquee/cards/${file}.webp`, name });
  }
  return cards;
})();

const props = withDefaults(defineProps<{ cards?: MarqueeCard[] }>(), { cards: () => [] });

const shown = computed<readonly MarqueeCard[]>(() => (props.cards.length ? props.cards : DEFAULT_CARDS));

// The cards in turn down each column, each column starting further along the
// list (repeating it), so the same card is never next to itself.
const columns = computed(() => {
  const cards = shown.value;
  const step = Math.max(1, Math.round(cards.length / COLUMNS));
  return Array.from({ length: COLUMNS }, (_, column) =>
    Array.from({ length: PER_COLUMN }, (_, row) => cards[(column * step + row) % cards.length]!));
});
const names = computed(() => [...new Set(shown.value.map((card) => card.name))].join(", "));

// CSS animations keep running off-screen; they pause while the section is far away.
const { targetRef, isActive } = useViewportActivity({ rootMargin: "300px 0px" });
</script>

<template>
  <figure ref="targetRef" class="showcase-marquee" :class="{ 'is-paused': !isActive }" :aria-label="$t('projectsPage.showcase.marquee')">
    <div class="showcase-marquee__viewport">
      <div class="showcase-marquee__stage">
        <div class="showcase-marquee__plane">
          <div
            v-for="(column, columnIndex) in columns"
            :key="columnIndex"
            class="showcase-marquee__column"
            :class="columnIndex % 2 === 0 ? 'showcase-marquee__column--down' : 'showcase-marquee__column--up'"
          >
            <div v-for="(card, cardIndex) in column" :key="`${cardIndex}-${card.src}`" class="showcase-marquee__card">
              <img
                class="showcase-marquee__image"
                :src="card.src"
                alt=""
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
    <figcaption class="sr-only">{{ names }}</figcaption>
  </figure>
</template>

<style scoped>
/* The reference's block (h-[600px] overflow-hidden, max-sm:h-100) as a
   full-width section, taller as in the design, on its dark ground
   (#26212d, also the colour between the cards). */
.showcase-marquee {
  --ground: 38 33 45;
  position: relative;
  /* Everything inside is in em: the design's 1440px proportions, growing
     with the screen up to 1920px, then holding (on a 5K ultrawide the cards
     were 1200px wide and the section 2400px tall). */
  font-size: clamp(1rem, 100vw / 90, 1.3333rem);
  display: block;
  width: 100%;
  height: 40em;
  margin: 0;
  overflow: hidden;
  background: rgb(var(--ground));
  isolation: isolate;
}

/* The design's vignette: the sides, the top corners and the foot sink into
   the ground; the top's middle meets the white page above. */
.showcase-marquee::after {
  position: absolute;
  inset: 0;
  z-index: 40;
  background:
    linear-gradient(to right, rgb(var(--ground)) 0%, rgb(var(--ground) / 0.55) 6%, rgb(var(--ground) / 0) 18%, rgb(var(--ground) / 0) 82%, rgb(var(--ground) / 0.55) 94%, rgb(var(--ground)) 100%),
    linear-gradient(to bottom, rgb(var(--ground) / 0) 62%, rgb(var(--ground) / 0.6) 88%, rgb(var(--ground)) 100%),
    radial-gradient(ellipse 70% 85% at 50% 35%, transparent 55%, rgb(var(--ground) / 0.85) 100%);
  content: "";
  pointer-events: none;
}

/* flex size-full items-center justify-center */
.showcase-marquee__viewport {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

/* size-[1720px] shrink-0 scale-50 sm:scale-75 lg:scale-100; the design's
   picture is seen in perspective, so the plane's near (lower) cards are
   larger than the far ones. */
.showcase-marquee__stage {
  position: relative;
  flex-shrink: 0;
  width: 107.5em;
  height: 107.5em;
  transform: scale(0.5);
  perspective: 150em;
}

@media (min-width: 640px) {
  .showcase-marquee__stage {
    transform: scale(0.75);
  }
}

@media (min-width: 1024px) {
  .showcase-marquee__stage {
    transform: none;
  }
}

/* A transform-3d plane at the design's angle: its rows rise about 19deg to
   the right and its columns fall about 55deg (the reference's rotateX(55deg)
   rotateZ(-45deg) gives 30deg both ways), with cards 304px wide at 1440px
   (about five to a row) and 0.75em apart; ten columns keep the corners
   covered, also on a wide screen. It is centred on the stage and turns about its own centre. */
.showcase-marquee__plane {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  width: calc(10 * 19em + 9 * 0.75em);
  grid-template-columns: repeat(10, minmax(0, 1fr));
  align-items: start;
  gap: 0.75em;
  transform: translate(-50%, -50%) rotateX(48deg) rotateZ(-27deg);
  transform-style: preserve-3d;
}

.showcase-marquee__column {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75em;
}

@media (prefers-reduced-motion: no-preference) {
  .showcase-marquee__column {
    will-change: transform;
  }

  .showcase-marquee__column--down {
    animation: showcase-marquee-down 10s ease-in-out infinite alternate;
  }

  .showcase-marquee__column--up {
    animation: showcase-marquee-up 15s ease-in-out infinite alternate;
  }
}

.is-paused .showcase-marquee__column {
  animation-play-state: paused;
}

@keyframes showcase-marquee-down {
  from { transform: translateY(0); }
  to { transform: translateY(6.25em); }
}

@keyframes showcase-marquee-up {
  from { transform: translateY(0); }
  to { transform: translateY(-6.25em); }
}

.showcase-marquee__card {
  position: relative;
  width: 100%;
}

/* aspect-[970/700] rounded-lg object-cover ring ring-gray-950/5, lifting
   10px (0.3 s, ease-in-out) with shadow-2xl on hover. */
.showcase-marquee__image {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 970 / 700;
  border-radius: 0.5em;
  object-fit: cover;
  box-shadow: 0 0 0 1px rgb(3 7 18 / 0.05);
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  user-select: none;
}

.showcase-marquee__image:hover {
  box-shadow: 0 0 0 1px rgb(3 7 18 / 0.05), 0 1.5625em 3.125em -0.75em rgb(0 0 0 / 0.25);
  transform: translateY(-0.625em);
}

@media (max-width: 1023px) {
  .showcase-marquee {
    height: 34em;
  }
}

@media (max-width: 639px) {
  .showcase-marquee {
    height: 25em;
  }
}
</style>
