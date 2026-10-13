<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

// "More than 3000 clients" (after slidor.agency/agence): a 6-column table of
// client names. As on slidor, a name lights up when the pointer passes over it
// (or it is tapped) and stays lit; once every name is lit, confetti bursts over
// the table. The cells fade in as a wave when the table first comes into view.
// The green light behind it floats (each glow drifts slowly on its own loop)
// and lags the scroll a little, at its own depth, for a gentle parallax.
// NOTE: the names are the placeholder list from the design (slidor's clients)
// and must be replaced with OneBranding's own.

const CLIENTS = [
  "AccorHotels", "Acer", "Air France", "Amazon Web Services", "Amundi", "Arianespace",
  "AXA", "BearingPoint", "Biomerieux", "Bjorg", "BMW", "BNP Paribas",
  "Bolloré", "Boston Consulting Group", "Bouygues Immobilier", "Cartier", "Caudalie", "Chanel",
  "Christian Dior", "Clarins", "Club Med", "CMA CGM", "Coca-Cola", "Crédit agricole",
  "Criteo", "Danone", "Dassault", "Disney", "Dom Pérignon", "EDF",
  "Eiffage", "Faurecia", "Ferrari", "FFR", "FFT", "FIFA",
  "Fnac Darty", "France TV", "Galeries Lafayette", "Generali", "Google", "Groupe Lactalis",
  "Groupe Lagardere", "Groupe SEB", "Havas", "Heineken", "HyperloopTT", "IKEA",
  "Interparfums", "Kenzo", "Lacoste", "La Poste", "LinkedIn", "L'Occitane",
  "L'Oréal", "LVMH", "Marriott", "Michelin", "Microsoft", "Moët Hennessy",
  "Murex", "N26", "Natixis", "Nespresso", "Nestlé", "OVH",
  "Paris Saint-Germain", "Patek Philippe", "Pernod Ricard", "Publicis Groupe", "Puma", "PwC",
  "Rakuten", "RATP", "Renault", "Rolex", "Rothschild & Co", "Saint-Gobain",
  "SeLoger.com", "Sephora", "SNCF", "Sodexo", "Sopexa", "Sopra Steria",
  "Tag Heuer", "TCL", "Thalès", "The Fork", "Total Energies", "Toyota",
  "Ubisoft", "Unibail Rodamco", "Valeo", "Veepee", "Vinci", "Warner Media",
];
// Lit from the start, as in the design.
const PRELIT = ["AccorHotels", "Air France", "BMW", "Ferrari", "Google", "L'Oréal", "Nespresso", "Puma", "Sephora", "Total Energies"];
const COLUMNS = 6;
const PHONE_PREVIEW = 24;

const { t } = useI18n();

const lit = ref(new Set(PRELIT));
const flashing = ref(new Set<string>());
const shown = ref(false);
const expanded = ref(false);
const celebrated = ref(false);
const root = ref<HTMLElement | null>(null);
const section = ref<HTMLElement | null>(null);
const confetti = ref<HTMLCanvasElement | null>(null);
const live = ref(false);

const cells = computed(() => CLIENTS.map((name, index) => ({
  name,
  // The wave runs from the top-left corner.
  delay: `${(Math.floor(index / COLUMNS) * 0.03 + (index % COLUMNS) * 0.05).toFixed(2)}s`,
})));

function light(name: string) {
  if (lit.value.has(name)) return;
  lit.value = new Set(lit.value).add(name);
  flashing.value = new Set(flashing.value).add(name);
  window.setTimeout(() => {
    const next = new Set(flashing.value);
    next.delete(name);
    flashing.value = next;
  }, 600);
  if (lit.value.size === CLIENTS.length && !celebrated.value) {
    celebrated.value = true;
    burst();
  }
}

const onPointerEnter = (event: PointerEvent, name: string) => {
  if (event.pointerType === "mouse") light(name);
};

// Confetti: a one-off canvas burst in the brand's greens and white.
let confettiFrame = 0;
function burst() {
  const canvas = confetti.value;
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(box.width * ratio);
  canvas.height = Math.round(box.height * ratio);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.scale(ratio, ratio);
  const colors = ["#00f562", "#3ee66f", "#b6ff3b", "#ffffff", "#1fae55", "#8dffb6"];
  // Pieces and throw grow with the table, so the burst reads on large screens.
  const scale = Math.max(1, box.width / 1100);
  const pieces = Array.from({ length: 260 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.25;
    const speed = 7 + Math.random() * 11;
    return {
      x: box.width / 2 + (Math.random() - 0.5) * box.width * 0.2,
      y: box.height * 0.6,
      vx: Math.cos(angle) * speed * (box.width / 1200),
      vy: Math.sin(angle) * speed * scale,
      w: (6 + Math.random() * 10) * scale,
      h: (3 + Math.random() * 5) * scale,
      spin: (Math.random() - 0.5) * 0.35,
      turn: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      ribbon: Math.random() < 0.12,
    };
  });
  const start = performance.now();
  const step = (now: number) => {
    const age = (now - start) / 1000;
    context.clearRect(0, 0, box.width, box.height);
    for (const piece of pieces) {
      piece.vy += 0.32 * scale;
      piece.vx *= 0.99;
      piece.vy *= 0.99;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.turn += piece.spin;
      context.save();
      context.globalAlpha = Math.max(0, 1 - Math.max(0, age - 1.8) / 0.9);
      context.translate(piece.x, piece.y);
      context.rotate(piece.turn);
      context.fillStyle = piece.color;
      context.strokeStyle = piece.color;
      if (piece.ribbon) {
        context.lineWidth = 3 * scale;
        context.scale(scale, scale);
        context.beginPath();
        context.moveTo(-14, 0);
        context.bezierCurveTo(-7, -9, 0, 9, 7, 0);
        context.bezierCurveTo(10, -4, 13, -4, 16, 0);
        context.stroke();
      } else {
        context.scale(1, Math.cos(piece.turn * 2));
        context.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      }
      context.restore();
    }
    if (age < 2.8) confettiFrame = requestAnimationFrame(step);
    else context.clearRect(0, 0, box.width, box.height);
  };
  confettiFrame = requestAnimationFrame(step);
}

// Parallax: --parallax is how far (px) the section's middle is above the
// screen's; each backdrop layer moves by its own fraction of it, so the light
// drifts slower than the table. Only while the section is on screen.
let parallaxFrame = 0;
const paintParallax = () => {
  parallaxFrame = 0;
  const element = section.value;
  if (!element) return;
  const box = element.getBoundingClientRect();
  const offset = window.innerHeight / 2 - (box.top + box.height / 2);
  element.style.setProperty("--parallax", `${offset.toFixed(1)}px`);
};
const scheduleParallax = () => {
  if (!parallaxFrame) parallaxFrame = requestAnimationFrame(paintParallax);
};

let observer: IntersectionObserver | undefined;
let liveObserver: IntersectionObserver | undefined;
onMounted(() => {
  if (!root.value) return;
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      shown.value = true;
      observer?.disconnect();
    }
  }, { rootMargin: "0px 0px -15% 0px" });
  observer.observe(root.value);

  if (!section.value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  liveObserver = new IntersectionObserver((entries) => {
    const visible = entries.some((entry) => entry.isIntersecting);
    if (visible === live.value) return;
    live.value = visible;
    if (visible) {
      window.addEventListener("scroll", scheduleParallax, { passive: true });
      window.addEventListener("resize", scheduleParallax, { passive: true });
      paintParallax();
    } else {
      window.removeEventListener("scroll", scheduleParallax);
      window.removeEventListener("resize", scheduleParallax);
    }
  });
  liveObserver.observe(section.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  liveObserver?.disconnect();
  window.removeEventListener("scroll", scheduleParallax);
  window.removeEventListener("resize", scheduleParallax);
  if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
  if (confettiFrame) cancelAnimationFrame(confettiFrame);
});
</script>

<template>
  <!-- The copy is English in both locales. -->
  <section ref="section" class="clients" :class="{ 'is-live': live }" lang="en" aria-labelledby="clients-title">
    <!-- The floating light: three soft glows and the diagonal sweep, each on
         its own drift loop and parallax depth (--depth). -->
    <div class="clients__backdrop" aria-hidden="true">
      <span class="clients__layer" style="--depth: 0.16"><span class="clients__blob clients__blob--top" /></span>
      <span class="clients__layer" style="--depth: 0.1"><span class="clients__blob clients__blob--left" /></span>
      <span class="clients__layer" style="--depth: 0.22"><span class="clients__blob clients__blob--bottom" /></span>
      <span class="clients__layer" style="--depth: 0.08">
        <svg class="clients__glow" viewBox="0 0 2000 1100" preserveAspectRatio="none" focusable="false">
          <defs>
            <linearGradient id="clients-arc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#7dffb0" stop-opacity="0.55" />
              <stop offset="1" stop-color="#00c853" stop-opacity="0.1" />
            </linearGradient>
            <!-- The sweep runs on under the table and fades out there, so no
                 edge shows while it drifts against the table. -->
            <linearGradient id="clients-sweep" x1="0" y1="-120" x2="0" y2="560" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="rgb(0 120 55)" stop-opacity="0.16" />
              <stop offset="0.6" stop-color="rgb(0 120 55)" stop-opacity="0.16" />
              <stop offset="1" stop-color="rgb(0 120 55)" stop-opacity="0" />
            </linearGradient>
            <filter id="clients-blur"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>
          <path d="M688 -120 L 700 30 C 790 110, 870 190, 940 292 C 975 345, 1000 430, 1010 560 L 2200 560 L 2200 -120 Z" fill="url(#clients-sweep)" />
          <path d="M700 30 C 790 110, 870 190, 940 292" fill="none" stroke="url(#clients-arc)" stroke-width="3" filter="url(#clients-blur)" />
          <path d="M0 540 C 40 580, 70 640, 90 700" fill="none" stroke="url(#clients-arc)" stroke-width="2" filter="url(#clients-blur)" opacity="0.6" />
        </svg>
      </span>
    </div>

    <div class="clients__head">
      <h2 id="clients-title" class="clients__title">
        <span>{{ t("home.clients.titleFirst") }}</span>
        <span><span class="clients__green">{{ t("home.clients.count") }}</span> {{ t("home.clients.titleRest") }}</span>
      </h2>
      <div class="clients__intro">
        <p>{{ t("home.clients.text") }}</p>
        <p class="clients__trust"><strong>{{ t("home.clients.trustStrong") }}</strong> {{ t("home.clients.trustRest") }}</p>
      </div>
    </div>

    <div ref="root" class="clients__table" :class="{ 'is-shown': shown, 'is-expanded': expanded }">
      <ul class="clients__grid">
        <li
          v-for="(cell, index) in cells"
          :key="cell.name"
          class="clients__cell"
          :class="{ 'is-lit': lit.has(cell.name), 'is-flash': flashing.has(cell.name), 'is-extra': index >= PHONE_PREVIEW }"
          :style="{ '--delay': cell.delay }"
          @pointerenter="onPointerEnter($event, cell.name)"
          @click="light(cell.name)"
        >
          <span class="clients__name">{{ cell.name }}</span>
        </li>
      </ul>
      <canvas ref="confetti" class="clients__confetti" aria-hidden="true" />
    </div>
    <button v-if="!expanded" type="button" class="clients__more" @click="expanded = true">{{ t("home.clients.showAll", { count: CLIENTS.length }) }}</button>
  </section>
</template>

<style scoped>
/* --u is one pixel of the 2000px design frame. */
.clients {
  --u: 0.05vw;
  --green: #22e352;
  position: relative;
  /* Same layer as the dark sections' black edge fades but later in the page:
     the table runs edge to edge, as in the design. */
  z-index: 30;
  overflow: clip;
  padding: calc(120 * var(--u)) calc(62 * var(--u)) calc(60 * var(--u));
  background: #000;
  color: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

/* The backdrop and its layers fill the section; a layer is shifted by its
   share of --parallax (the `translate` property, so it adds to the drift
   animations' `transform`). */
.clients__backdrop,
.clients__layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.clients__layer {
  translate: 0 calc(var(--parallax, 0px) * var(--depth, 0));
  will-change: translate;
}

/* The glows: each blob is the box of a radial gradient (radii = half its
   size), centred where the light sits in the design. */
.clients__blob {
  position: absolute;
  border-radius: 50%;
  animation: 18s ease-in-out infinite alternate paused;
  will-change: transform, opacity;
}

.clients__blob--top {
  left: 62%;
  top: -38%;
  width: 68%;
  height: 84%;
  background: radial-gradient(closest-side, rgb(0 170 80 / 0.42), rgb(0 0 0 / 0) 72%);
  animation-name: clients-drift-top;
}

.clients__blob--left {
  left: -13%;
  top: 24%;
  width: 26%;
  height: 64%;
  background: radial-gradient(closest-side, rgb(0 130 60 / 0.32), rgb(0 0 0 / 0) 72%);
  animation-name: clients-drift-left;
  animation-duration: 14s;
}

.clients__blob--bottom {
  left: 20%;
  top: 70%;
  width: 100%;
  height: 60%;
  background: radial-gradient(closest-side, rgb(0 90 40 / 0.3), rgb(0 0 0 / 0) 72%);
  animation-name: clients-drift-bottom;
  animation-duration: 21s;
}

/* The sweep reaches past the section's top and right edge, so it can sway
   without showing an end. */
.clients__glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(1100 * var(--u));
  overflow: visible;
  transform-origin: 100% 0;
  animation: clients-sway 16s ease-in-out infinite alternate paused;
  will-change: transform;
}

.clients.is-live .clients__blob,
.clients.is-live .clients__glow {
  animation-play-state: running;
}

@keyframes clients-drift-top {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  50% { transform: translate(-5%, 6%) scale(1.08); opacity: 0.82; }
  100% { transform: translate(3%, -2%) scale(0.95); opacity: 1; }
}

@keyframes clients-drift-left {
  0% { transform: translate(0, 0) scale(1); opacity: 0.9; }
  50% { transform: translate(18%, -8%) scale(1.15); opacity: 1; }
  100% { transform: translate(6%, 10%) scale(1.04); opacity: 0.75; }
}

@keyframes clients-drift-bottom {
  0% { transform: translate(0, 0) scale(1); opacity: 0.85; }
  50% { transform: translate(-12%, -6%) scale(1.06); opacity: 1; }
  100% { transform: translate(-4%, 4%) scale(0.98); opacity: 0.8; }
}

@keyframes clients-sway {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-1.5%, 2%) rotate(-0.8deg); }
  100% { transform: translate(1%, -1%) rotate(0.5deg); }
}

.clients p,
.clients h2 {
  margin: 0;
}

.clients__head {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
}

.clients__title {
  display: flex;
  flex-direction: column;
  font-size: var(--section-title-size);
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.035em;
}

.clients__green {
  color: var(--green);
}

.clients__intro {
  width: calc(600 * var(--u));
  margin-top: calc(14 * var(--u));
  color: #a7acaa;
  font-size: calc(19.5 * var(--u));
  line-height: 1.36;
}

.clients__trust {
  margin-top: calc(18 * var(--u)) !important;
  color: var(--green);
}

.clients__trust strong {
  font-weight: 600;
}

.clients__table {
  position: relative;
  margin-top: calc(52 * var(--u));
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: calc(14 * var(--u));
  background: rgb(6 14 9 / 0.72);
  backdrop-filter: blur(6px);
}

.clients__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.clients__cell {
  position: relative;
  display: flex;
  align-items: center;
  height: calc(46.6 * var(--u));
  padding-left: calc(27 * var(--u));
  border-bottom: 1px solid rgb(255 255 255 / 0.07);
  border-left: 1px solid rgb(255 255 255 / 0.06);
  cursor: default;
  opacity: 0;
  transform: translateY(calc(8 * var(--u)));
  transition: opacity 0.6s ease var(--delay), transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) var(--delay);
}

.clients__cell:nth-child(6n + 1) {
  border-left: 0;
}

.clients__cell:nth-last-child(-n + 6) {
  border-bottom: 0;
}

.clients__table.is-shown .clients__cell {
  opacity: 1;
  transform: none;
}

/* Lit: a green bar on the left and a green wash fading to the right. */
.clients__cell::before,
.clients__cell::after {
  position: absolute;
  content: "";
  pointer-events: none;
}

.clients__cell::before {
  top: 0;
  bottom: 0;
  left: 0;
  width: calc(4 * var(--u));
  background: #3ee66f;
  box-shadow: 0 0 calc(12 * var(--u)) rgb(62 230 111 / 0.6);
  transform: scaleY(0);
  transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.clients__cell::after {
  inset: 0;
  background: linear-gradient(90deg, rgb(0 220 90 / 0.3), rgb(0 220 90 / 0.08) 45%, rgb(0 220 90 / 0) 85%);
  opacity: 0;
  transition: opacity 0.45s ease;
}

.clients__cell.is-lit::before {
  transform: scaleY(1);
}

.clients__cell.is-lit::after {
  opacity: 1;
}

.clients__name {
  position: relative;
  z-index: 1;
  color: #b0bbb5;
  font-size: calc(18.5 * var(--u));
  line-height: 1;
  white-space: nowrap;
  transition: color 0.45s ease;
}

.clients__cell.is-lit .clients__name {
  color: #fff;
}

/* When a name lights up it slides in a little, as on slidor. */
.clients__cell.is-flash .clients__name {
  animation: clients-nudge 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}

@keyframes clients-nudge {
  40% { transform: translateX(calc(14 * var(--u))); }
}

.clients__confetti {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Positioned, like the head and the table, so it paints above the backdrop. */
.clients__more {
  position: relative;
  display: none;
}

/* Phones: two columns, the first 24 names with a button for the rest. */
@media (max-width: 767px) {
  .clients {
    padding: 4.5rem 1.25rem 3.5rem;
  }

  .clients__head {
    flex-direction: column;
    gap: 1.25rem;
  }

  .clients__title {
    font-size: var(--section-title-size);
  }

  .clients__intro {
    width: auto;
    margin-top: 0;
    font-size: 0.95rem;
  }

  .clients__trust {
    margin-top: 0.75rem !important;
  }

  .clients__table {
    margin-top: 2rem;
    border-radius: 0.75rem;
  }

  .clients__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .clients__cell {
    height: 2.7rem;
    padding-left: 0.9rem;
    border-left: 1px solid rgb(255 255 255 / 0.06) !important;
    border-bottom: 1px solid rgb(255 255 255 / 0.07) !important;
    transition-delay: 0s;
  }

  .clients__cell:nth-child(2n + 1) {
    border-left: 0 !important;
  }

  .clients__cell::before {
    width: 3px;
  }

  .clients__name {
    overflow: hidden;
    font-size: 0.85rem;
    text-overflow: ellipsis;
  }

  .clients__table:not(.is-expanded) .clients__cell.is-extra {
    display: none;
  }

  .clients__more {
    display: block;
    margin: 1.25rem auto 0;
    padding: 0.75rem 1.4rem;
    border: 1px solid rgb(34 227 82 / 0.5);
    border-radius: 999px;
    background: rgb(34 227 82 / 0.08);
    color: var(--green);
    font: inherit;
    font-size: 0.95rem;
    font-weight: 600;
  }
}

@media (prefers-reduced-motion: reduce) {
  .clients__blob,
  .clients__glow {
    animation: none;
  }

  .clients__cell {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .clients__cell.is-flash .clients__name {
    animation: none;
  }
}
</style>
