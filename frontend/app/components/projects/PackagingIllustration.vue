<script setup lang="ts">
import { computed, useId } from "vue";

// The "Logo / Brand identity" packaging, drawn after the design: a cup with
// its straw, a paper bag with a torn top, a meal box with arched handles and
// a box of fries. "logo": the pieces in greys with the name printed on them;
// "identity": the same pieces in the brand's red, white and yellow, its
// arches and smile carrying the recognition. One geometry (558 x 448, the
// design's units), two sets of colours and marks.
const props = defineProps<{ variant: "logo" | "identity"; label: string }>();

const id = useId();
const identity = computed(() => props.variant === "identity");

const C = computed(() => identity.value
  ? { bag: "#ffffff", band: "#ec1c24", box: "#ec2027", handle: "#ffbc0d", cup: "#ffffff", straw: "#e3242b", fries: "#fdb827", carton: "#e7212a" }
  : { bag: "#4b4b4c", band: "#6f6f6f", box: "#808080", handle: "#bdbdbd", cup: "#ffffff", straw: "#a3a3a3", fries: "#f8bb14", carton: "#4b4b4c" });

// The bag's torn top: ten teeth across its width.
const teeth = Array.from({ length: 10 }, (_, index) => `L${109 + index * 24 + 12} 8 L${109 + (index + 1) * 24} 20`).join(" ");
const BAG = `M109 20 ${teeth} L349 272 L109 272 Z`;
const CUP = "M14 162 L126 162 L131 176 L112 398 Q70 412 28 398 L8 176 Z";
const BOX = "M356 92 L537 92 L551 152 L538 298 L350 298 L350 115 Z";
const CARTON = "M300 300 L455 300 L432 432 Q378 420 325 432 Z";
// The fries standing out of the carton, spread along its rim as in the
// design: [x at the tip, y at the tip, x at the foot], each a chunky stick
// (17 wide at the foot, 19 at its square tip) leaning out more towards the
// edges, its foot hidden in the carton.
const STICKS: [number, number, number][] = [
  [284, 278, 307], [309, 254, 320], [330, 262, 334], [349, 240, 351], [368, 249, 366],
  [386, 258, 381], [404, 246, 396], [423, 259, 411], [446, 270, 427], [468, 264, 443],
];
const stick = ([x0, y0, x1]: [number, number, number]) => {
  const y1 = 310;
  const angle = Math.atan2(x0 - x1, y1 - y0);
  const nx = Math.cos(angle);
  const ny = Math.sin(angle);
  const point = (x: number, y: number, across: number) => `${(x + nx * across).toFixed(1)} ${(y + ny * across).toFixed(1)}`;
  return `M${point(x1, y1, -8.5)} L${point(x0, y0, -9.5)} L${point(x0, y0, 9.5)} L${point(x1, y1, 8.5)} Z`;
};
</script>

<template>
  <svg class="packaging-illustration" viewBox="0 0 558 448" role="img" :aria-label="label">
    <defs>
      <clipPath :id="`${id}-bag`"><path :d="BAG" /></clipPath>
      <clipPath :id="`${id}-cup`"><path :d="CUP" /></clipPath>
    </defs>

    <!-- The paper bag and the band across its foot. -->
    <path :d="BAG" :fill="C.bag" />
    <rect x="109" y="272" width="200" height="58" :fill="C.band" />
    <!-- identity: one tall arch over the bag, its left leg down the band. -->
    <path
      v-if="identity"
      d="M210 332 C213 150 242 66 280 66 C318 66 340 150 352 262"
      fill="none"
      :stroke="C.handle"
      stroke-width="38"
      :clip-path="`url(#${id}-bag)`"
    />
    <path v-if="identity" d="M191 272 L229 272 L229 332 L191 332 Z" :fill="C.handle" />
    <text
      v-if="!identity"
      x="228"
      y="70"
      text-anchor="middle"
      class="packaging-illustration__name"
      font-size="31"
      fill="#ffffff"
    >McDonald’s</text>

    <!-- The meal box, its arched handles, and in identity its smile. -->
    <path
      d="M372 94 C378 54 388 42 403 42 C420 42 432 58 442 90 M450 90 C458 58 470 42 488 42 C505 42 516 56 526 94"
      fill="none"
      :stroke="C.handle"
      stroke-width="13"
    />
    <path :d="BOX" :fill="C.box" />
    <g v-if="identity" fill="none" :stroke="C.handle" stroke-width="10" stroke-linecap="butt">
      <path d="M386 186 Q445 262 504 186" />
      <path d="M377 180 L394 190 M513 180 L496 190" />
    </g>

    <!-- The cup, its straw, and in identity its lid and the arch round it. -->
    <path d="M72 148 L88 104" fill="none" :stroke="C.straw" stroke-width="7" stroke-linecap="round" />
    <path v-if="identity" d="M72 148 L88 104" fill="none" stroke="#ffbc0d" stroke-width="2.4" stroke-linecap="round" />
    <path :d="CUP" :fill="C.cup" />
    <path v-if="identity" d="M11 159 L127 159 L131 170 L9 170 Z" fill="#ec1c24" />
    <path
      v-if="identity"
      d="M52 412 C54 300 76 206 106 206 C120 206 126 218 128 232"
      fill="none"
      :stroke="C.handle"
      stroke-width="30"
      :clip-path="`url(#${id}-cup)`"
    />
    <text
      v-if="!identity"
      x="70"
      y="193"
      text-anchor="middle"
      class="packaging-illustration__name"
      font-size="14.5"
      fill="#111111"
    >McDonald’s</text>

    <!-- The fries: the sticks over the rim, the carton, the rounded bunch on it. -->
    <g :fill="C.fries">
      <path v-for="(entry, index) in STICKS" :key="index" :d="stick(entry)" />
    </g>
    <path :d="CARTON" :fill="C.carton" />
    <path d="M300 300 L456 300 A78 46 0 0 1 300 300 Z" :fill="C.fries" />
    <path
      v-if="identity"
      d="M356 408 C356 384 360 369 366 369 C372 369 376 382 376 402 M376 402 C376 382 380 369 386 369 C392 369 396 384 396 408"
      fill="none"
      :stroke="C.handle"
      stroke-width="7"
    />
    <text
      v-else
      x="378"
      y="387"
      text-anchor="middle"
      class="packaging-illustration__name"
      font-size="14.5"
      fill="#ffffff"
    >McDonald’s</text>
  </svg>
</template>

<style scoped>
.packaging-illustration {
  display: block;
  width: 100%;
  height: auto;
}

.packaging-illustration__name {
  font-family: var(--app-font-display);
  font-weight: 700;
  letter-spacing: -0.01em;
}
</style>
