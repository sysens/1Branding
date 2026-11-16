<script setup lang="ts">
// A ribbon of fine glowing wires, drifting and turning over along its length:
// our own shader, written to the look and the controls of React Bits Pro's
// "Interference Ribbons" (its source is sold, and is React; none of it is
// here). The props carry the same names and meanings, so settings tried in
// its playground can be typed in as they are.
//
// How it is drawn: the ribbon is a strip of `wires` strands seen from the
// side. Along it runs a centre line that swings (amplitude, waveLength); the
// strip turns about that line (twist, spin), so a strand at u across the
// strip lands at u*cos(turn) on screen, with a depth of u*sin(turn). Where the
// strip is edge-on all the strands land on one line and burn white; strands
// on the far side thin and dim (depth). Every pixel near the ribbon sums the
// strands' lines and haze (a loop of `wires` steps); pixels away from it
// leave early.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import OptImage from "~/components/ui/OptImage.vue";
import { mountShaderCanvas, type ShaderCanvas } from "~/utils/shaderCanvas";

const props = withDefaults(defineProps<{
  /** Two colours the strands cycle through; a deep shade of the first is added. */
  colors?: [string, string];
  /** Strands across the ribbon, 4 to 160. */
  wires?: number;
  /** Width of a strand facing the viewer, in CSS pixels. */
  lineWidth?: number;
  /** Width of the ribbon, as a fraction of the height. */
  ribbonWidth?: number;
  /** How far the ribbon swings from the centre line. */
  amplitude?: number;
  /** Length of the swings; larger is lazier. */
  waveLength?: number;
  /** Direction across the frame, in degrees. */
  angle?: number;
  /** In a wide frame, lower the angle so the ribbon still crosses from corner to corner. */
  fit?: boolean;
  /** Times the ribbon turns over along its length. */
  twist?: number;
  /** Curve of the cross-section: strands bunch and fan as it turns. */
  curl?: number;
  /** How much the far side fades and thins, 0 to 1. */
  depth?: number;
  /** Times the colours cycle across the ribbon. */
  stripes?: number;
  /** Speed of the colours drifting along the strands. */
  colorFlow?: number;
  /** Haze round the strands, 0 to 3. */
  glow?: number;
  /** Exposure. */
  intensity?: number;
  /** How fast the ribbon drifts and reshapes. */
  speed?: number;
  /** How fast the twists roll along it. */
  spin?: number;
  /** A still picture shown where WebGL is off. */
  fallback?: string;
}>(), {
  colors: () => ["#6B3CFF", "#D46BFF"],
  wires: 64,
  lineWidth: 1.6,
  ribbonWidth: 0.24,
  amplitude: 0.6,
  waveLength: 1,
  angle: 42,
  fit: false,
  twist: 1.6,
  curl: 0.25,
  depth: 0.65,
  stripes: 2.2,
  colorFlow: 0.04,
  glow: 0.45,
  intensity: 1,
  speed: 0.7,
  spin: 0.35,
  fallback: undefined,
});

const canvas = ref<HTMLCanvasElement | null>(null);
const failed = ref(false);

const FRAGMENT = `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uWires;
uniform float uLine;
uniform float uWidth;
uniform float uAmp;
uniform float uWave;
uniform float uAngle;
uniform float uFit;
uniform float uTwist;
uniform float uCurl;
uniform float uDepth;
uniform float uStripes;
uniform float uFlow;
uniform float uGlow;
uniform float uGain;
uniform float uSpeed;
uniform float uSpin;

const float PI = 3.14159265;

void main() {
  // Centred, in frame heights.
  vec2 q = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  float span = uRes.x / uRes.y;
  // A wide frame: no steeper than corner to corner.
  float angle = mix(uAngle, min(uAngle, atan(.74, span)), uFit);
  float ca = cos(angle);
  float sa = sin(angle);
  float s = q.x * ca + q.y * sa;
  float d = q.y * ca - q.x * sa;
  float t = uTime * uSpeed;

  // The centre line and its slope (distances are taken square to the line).
  float k = 2. * PI / max(uWave, .05);
  float a = uAmp * .42;
  float c = a * (sin(s * k + t * .31) + .32 * sin(s * k * 2.3 - t * .23 + 1.7)) / 1.32;
  float slope = a * k * (cos(s * k + t * .31) + .32 * 2.3 * cos(s * k * 2.3 - t * .23 + 1.7)) / 1.32;
  float square = inversesqrt(1. + slope * slope);

  float semi = uWidth * .5;
  float x = (d - c) * square;
  // uLine is in buffer pixels; everything here is in frame heights.
  float lw = max(uLine, .35) / uRes.y;
  float reach = semi * (1. + abs(uCurl)) + .05 + .12 * uGlow;
  if (abs(x) > reach) {
    gl_FragColor = vec4(0.);
    return;
  }

  // The turn of the strip here.
  float turn = PI * uTwist * (s / max(span, 1.)) + uTime * uSpin + .35 * sin(s * 1.7 - t * .5);
  float ct = cos(turn);
  float st = sin(turn);

  vec3 deep = uColorA * .3;
  vec3 sum = vec3(0.);
  float piled = 0.;
  for (int i = 0; i < 160; i++) {
    if (float(i) >= uWires) break;
    float n = float(i);
    float u = (n + .5) / uWires * 2. - 1.;
    float bow = uCurl * (1. - u * u);
    // Each strand drifts a little on its own: the play between neighbours.
    float own = .06 * semi * sin(s * 3.1 + n * 2.399 + t * .8);
    float off = semi * (u * ct - bow * st) + own;
    float z = u * st + bow * ct;
    float far = smoothstep(.15, -.85, z) * uDepth;
    float wide = lw * (1. - .55 * far);
    float dist = abs(x - off);
    float line = exp(-(dist * dist) / (wide * wide));
    float haze = exp(-dist / (lw * 9. + .012)) * uGlow * .055;
    float bright = 1. - .8 * far;
    float stripe = fract(uStripes * (u * .5 + .5) + uFlow * uTime * 6. + s * .12);
    float m = .5 - .5 * cos(stripe * 2. * PI);
    vec3 tint = m < .5 ? mix(deep, uColorA, m * 2.) : mix(uColorA, uColorB, m * 2. - 1.);
    sum += tint * (line + haze) * bright;
    piled += line * bright;
  }

  // It thins out towards the frame's ends.
  float ends = smoothstep(span * .62, span * .3, abs(s));
  vec3 col = sum * uGain * (.55 + .45 * ends);
  // Strands piled on one line burn towards white.
  col += vec3(.8, 1., .86) * max(0., piled - 1.1) * .22 * uGain;
  col = 1. - exp(-col * 1.35);
  gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0., 1.));
}
`;

const rgb = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  const number = Number.parseInt(full, 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255].map((channel) => channel / 255) as [number, number, number];
};

const colorA = computed(() => rgb(props.colors[0]));
const colorB = computed(() => rgb(props.colors[1]));

let shader: ShaderCanvas | null = null;
let dpr = 1;

onMounted(() => {
  const element = canvas.value;
  if (!element) return;
  // Phones shade fewer pixels: the strands are sub-pixel fine either way.
  const maxDpr = matchMedia("(max-width: 767px)").matches ? 1.25 : 1.5;
  dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  shader = mountShaderCanvas(element, {
    fragment: FRAGMENT,
    maxDpr,
    still: matchMedia("(prefers-reduced-motion: reduce)").matches,
    stillTime: 3,
    uniforms: () => ({
      uColorA: colorA.value,
      uColorB: colorB.value,
      uWires: Math.min(160, Math.max(4, Math.round(props.wires))),
      uLine: props.lineWidth * dpr,
      uWidth: props.ribbonWidth,
      uAmp: props.amplitude,
      uWave: props.waveLength,
      uAngle: (props.angle * Math.PI) / 180,
      uFit: props.fit ? 1 : 0,
      uTwist: props.twist,
      uCurl: props.curl,
      uDepth: props.depth,
      uStripes: props.stripes,
      uFlow: props.colorFlow,
      uGlow: props.glow,
      uGain: props.intensity,
      uSpeed: props.speed,
      uSpin: props.spin,
    }),
  });
  failed.value = !shader;
});

onBeforeUnmount(() => {
  shader?.destroy();
  shader = null;
});
</script>

<template>
  <div class="ribbons" aria-hidden="true">
    <canvas ref="canvas" class="ribbons__canvas" />
    <OptImage v-if="failed && fallback" class="ribbons__still" :src="fallback" alt="" sizes="100vw" loading="lazy" decoding="async" :preview="false" />
  </div>
</template>

<style scoped>
.ribbons {
  position: relative;
  min-height: 15rem;
  pointer-events: none;
}

.ribbons__canvas,
.ribbons__still {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.ribbons__still {
  object-fit: cover;
}
</style>
