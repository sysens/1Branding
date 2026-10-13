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

<style scoped src="./ClientsGrid.css"></style>
