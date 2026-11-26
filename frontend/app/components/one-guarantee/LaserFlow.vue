<script setup lang="ts">
// React Bits' "Laser Flow" (reactbits.dev/animations/laser-flow), ported from
// its React component to Vue: the shader and the numbers are its own, the
// React hooks became onMounted / watch. A beam comes down onto the top edge
// of a surface (any element, given as `surface`), runs out along the edge,
// pours over its corners, and lights fog, dust and streaks on the way. The
// props carry the names and meanings of the original, so settings tried in
// its playground can be typed in as they are.
//
// Four things are this site's. The intro waits while the page loader is up
// (html.ob-loading, PageLoader.vue), so the beam comes down in view and not
// behind it. `unsupported` is emitted where WebGL 2 is missing, so the page
// can show a still stand-in.
//
// `oneHeight` makes the beam the brand's "1", set upright and drawn tall:
// the mark's head (its flag and the notch under it) at that scale, `oneLift`
// over the surface, and its stem carried straight on down to the surface,
// where its light leaves it at the stem's two sides and runs out as the
// beam's does. One white stroke with the beam's green about it; no beam over
// it (0, the default: the plain beam from the top of the frame).
//
// `flow`: the original's beam comes down once and then stands still in its
// fog. With flow the light keeps running down beside it, as in the film on
// huly.io that the effect is modelled on: fine dust carried down, each
// column at its own speed, quick close to the beam's body and slower further
// out; and the halo swelling and thinning a little in waves that travel down
// it. No lines: the halo stays as smooth as huly's (upright hairlines and
// bands beside the body were tried, and read as stripes). On the surface the
// light drifts outwards (0, the default: as the original).
//
// `edge`: how thick the light lies on the surface, as a share of the
// original's (1, the default). The original's is a deep white band; huly's
// is a thin lit line with its haze over it.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(defineProps<{
  /** The element the beam lands on; without one it lands on a line at surfaceLevel. */
  surface?: HTMLElement | null;
  /** Where the beam comes down, 0 to 1 across the frame. */
  beamPosition?: number;
  surfaceLevel?: number;
  color?: string;
  intensity?: number;
  beamWidth?: number;
  flare?: number;
  spread?: number;
  spill?: number;
  fog?: number;
  dust?: number;
  streaks?: number;
  dots?: number;
  pulse?: number;
  speed?: number;
  seed?: number;
  mouseInteraction?: boolean;
  revealImage?: string;
  revealRadius?: number;
  revealOpacity?: number;
  intro?: boolean;
  theme?: "dark" | "light";
  paused?: boolean;
  dpr?: number;
  /** The scale of the brand's "1" the beam is drawn as: the mark's own height, in px; 0 for a plain beam. */
  oneHeight?: number;
  /** How far over the surface the mark's foot is, in px: the length its stem is carried on by. */
  oneLift?: number;
  /** How strongly the light keeps running down beside the beam (dust, the halo's waves) and out along the surface; 0 for the still beam. */
  flow?: number;
  /** How thick the light lies on the surface, as a share of the original's. */
  edge?: number;
}>(), {
  surface: null,
  beamPosition: 0.6,
  surfaceLevel: 1,
  color: "#3847ff",
  intensity: 1.8,
  beamWidth: 1.5,
  flare: 1.5,
  spread: 1.5,
  spill: 1,
  fog: 0.2,
  dust: 1.6,
  streaks: 1.5,
  dots: 1,
  pulse: 1.5,
  speed: 1.5,
  seed: 3,
  mouseInteraction: true,
  revealImage: undefined,
  revealRadius: 220,
  revealOpacity: 0.6,
  intro: true,
  theme: "dark",
  paused: false,
  dpr: undefined,
  oneHeight: 0,
  oneLift: 0,
  flow: 0,
  edge: 1,
});

const emit = defineEmits<{ unsupported: [] }>();

type Surface = { left: number; top: number; right: number; bottom: number; radius: number; real: boolean };
type Rgb = [number, number, number];

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uResolution;
uniform float uDpr;
uniform float uScale;
uniform float uTime;
uniform float uBeamX;
uniform vec4 uSurface;
uniform float uRadius;
uniform vec3 uIntro;
uniform vec4 uPour;
uniform vec2 uRun;
uniform vec4 uLens;
uniform sampler2D uReveal;
uniform vec4 uRevealMap;
uniform vec2 uRevealInfo;
uniform float uAtmosphere;
uniform vec4 uAmount;
uniform vec4 uShape;
uniform vec4 uExtra;
uniform float uTheme;
uniform vec2 uOne;
uniform float uFlow;
uniform float uEdge;
uniform vec3 uTint[16];

#define BEAM uTint[0]
#define LEFT uTint[1]
#define RIGHT uTint[2]
#define CYAN uTint[3]
#define PINK uTint[4]
#define LILAC uTint[5]
#define SKY uTint[6]
#define PURPLE uTint[7]
#define DEEP uTint[8]
#define MIST uTint[9]
#define NAVY uTint[10]
#define WARM uTint[11]
#define EMBER uTint[12]
#define WHITE uTint[13]
#define HAZE uTint[14]
#define LAVENDER uTint[15]

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

float sq(float x) {
  return x * x;
}

float roundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// The brand's "1", one unit tall and set upright (the mark leans to the
// right; here its lean is taken out, so its stem stands where a beam does):
// x from the middle of its stem, y up from its foot. The flag at the upper
// left, the notch under it. The stem's two edges are carried on far below
// the foot (they draw apart a little on the way: the stem stands a little
// wider below), so the figure is the mark with a long stem, cut by the
// surface it stands on.
const vec2 ONE[7] = vec2[7](
  vec2(-0.1484, 1.0), vec2(0.1548, 1.0), vec2(0.2077, -6.0), vec2(-0.2076, -6.0),
  vec2(-0.1577, 0.6054), vec2(0.1112, 0.6878), vec2(-0.4256, 0.6878)
);
// Half the stem's width where the light leaves it for the surface (a little inside its edges).
#define ONE_SIDE 0.17

// The distance to the "1"'s outline, negative inside it.
float sdOne(vec2 q) {
  float d = dot(q - ONE[0], q - ONE[0]);
  float s = 1.0;
  for (int i = 0, j = 6; i < 7; j = i, i++) {
    vec2 e = ONE[j] - ONE[i];
    vec2 w = q - ONE[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(q.y >= ONE[i].y, q.y < ONE[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s = -s;
  }
  return s * sqrt(d);
}

vec3 spill(float e, float fall, float strength, float front, float t, out vec3 glow) {
  glow = vec3(0.0);
  if (strength < 0.0005) return vec3(0.0);
  float f = max(fall, 0.0);
  float d = max(e, 0.0);
  float u = d / (6.0 + 0.28 * f);
  float start = smoothstep(-6.0, 12.0, fall);
  float fade = exp(-sq(max(f - 125.0, 0.0) / 40.0));
  float streak = 0.88 + 0.24 * noise(vec2(u * 6.0, f / 22.0 - t * 1.7));
  float bright = pow(strength, 1.5);
  float soft = sqrt(strength);
  float warmth = smoothstep(90.0, 130.0, f);
  vec3 coreK = mix(WHITE, WARM, warmth * exp(-d / 9.0));
  float core = mix(9.0, 2.6, warmth) * exp(-sq(d / (3.5 + 0.04 * f))) * exp(-sq(max(f - 130.0, 0.0) / 38.0));
  float wall = 24.0 * exp(-sq(d / 1.1)) * exp(-sq(max(f - 100.0, 0.0) / 30.0));
  float bandCenter = 0.7 - 0.3 * smoothstep(30.0, 110.0, f);
  float offset = u - bandCenter;
  float decay = (1.05 - bandCenter) / 1.31;
  float profile = offset < 0.0 ? exp(-sq(offset / 0.3)) : exp(-offset / decay);
  profile *= 1.0 - smoothstep(1.0, 1.4, u);
  vec3 bandA = mix(CYAN, PINK, smoothstep(50.0, 75.0, f));
  bandA = mix(bandA, LILAC, smoothstep(100.0, 125.0, f));
  vec3 bandB = mix(SKY, PURPLE, smoothstep(50.0, 75.0, f));
  vec3 fanK = mix(bandA, bandB, smoothstep(0.06, 0.18, offset));
  fanK = mix(fanK, DEEP, smoothstep(0.22, 0.42, offset));
  vec3 thread = WHITE * wall * bright + coreK * core * streak * bright;
  glow += fanK * 4.5 * profile * fade * streak * bright;
  glow += MIST * 0.7 * exp(-max(u - 1.0, 0.0) / 0.9) * smoothstep(0.7, 1.2, u) * fade * soft;
  glow += EMBER * 0.35 * exp(-sq((f - 165.0) / 22.0)) * exp(-d / 25.0) * bright;
  float lag = u * (6.0 + 0.28 * f) * 0.35;
  float reveal = 1.0 - smoothstep(front - 70.0, front + 8.0, f + lag);
  glow *= start * reveal;
  return thread * start * reveal;
}

vec3 easeLight(vec3 light, float amount) {
  return -log(max(1.0 - amount * (1.0 - exp(-light)), vec3(0.0001)));
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uResolution.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 p = frag / uScale;
  float t = uTime;
  float bx = uBeamX / uScale;
  float sl = uSurface.x / uScale;
  float sy = uSurface.y / uScale;
  float sr = uSurface.z / uScale;
  float sb = uSurface.w / uScale;
  float radius = uRadius / uScale;
  float dx = p.x - bx;
  float adx = abs(dx);
  float h = sy - p.y;
  float hp = max(h, 0.0);
  float above = smoothstep(-0.5, 0.5, h);
  // The light's body, and dm, the distance to it from outside: the beam's
  // line, or the "1", whose stem stands on that line; q is the point in the
  // mark's own units (its foot lift over the surface).
  float one = uOne.x / uScale;
  float lift = uOne.y / uScale;
  bool isOne = one > 0.5;
  vec2 q = vec2(dx, h - lift) / max(one, 1.0);
  float d1 = isOne ? sdOne(q) * one : adx;
  float dm = max(d1, 0.0);
  float side = smoothstep(-24.0, 24.0, dx);
  vec3 sideK = mix(mix(LAVENDER, LEFT, smoothstep(40.0, 140.0, adx)), RIGHT, side);
  // About the "1" the beam's light is held closer than about its own line:
  // the figure's edge is to stay clear.
  float beamWidth = isOne ? 0.7 * uShape.x : uShape.x;
  float flare = uShape.y;
  float spread = 250.0 * uShape.z;
  float reachL = max(bx - sl, 1.0);
  float reachR = max(sr - bx, 1.0);
  float reach = dx < 0.0 ? reachL : reachR;
  float layerLen = clamp(0.29 * reach, 20.0, 100.0) * sqrt(uShape.z);
  float run = uRun.x;
  float runMask = 1.0 - smoothstep(run - 34.0, run + 6.0, adx);
  float bead = exp(-sq((adx - run + 16.0) / (18.0 + 0.04 * run))) * uRun.y;
  float flowMask = (1.0 - smoothstep(0.75 * spread, 1.1 * spread, adx)) * runMask;
  float edgeMask = (1.0 - smoothstep(0.8 * spread, 1.25 * spread, adx)) * runMask;
  float bloom = uIntro.y;
  vec2 center = vec2((sl + sr) * 0.5, (sy + sb) * 0.5);
  vec2 halfSize = vec2((sr - sl) * 0.5, (sb - sy) * 0.5);
  float sd = roundBox(p - center, halfSize, radius);
  float outline = max(sd, 0.0);
  float below = max(p.y - sy - radius, 0.0);
  float hug = smoothstep(-0.5, 0.5, sd) * exp(-sq(below / 14.0));
  float hugWide = smoothstep(-0.5, 0.5, sd) * exp(-sq(below / 40.0));

  vec3 col = vec3(0.0);

  float breathe = 1.0 + uExtra.x * (0.12 * sin(t * 1.5708) + 0.08 * (noise(vec2(t * 0.5, 3.0)) - 0.5));

  float front = uIntro.x / uScale;
  float drop = smoothstep(front + 10.0, front - 110.0, p.y);
  float falling = 1.0 - smoothstep(sy - 24.0, sy, front);

  // The constant flow, beside the body (not in it, and not over its head).
  // The dust is drawn in screen pixels, so its points stay fine at any size
  // of the frame; fall is how far its quick layer has run down. All of it
  // waits for the intro: nothing runs down a beam that has not come down yet.
  float flow = uFlow * drop * min(bloom, 1.0);
  float motes = 0.0;
  float wave = 0.0;
  float drift = 1.0;
  if (flow > 0.001) {
    float bodyTop = isOne ? lift + one : sy;
    float beside = (isOne ? smoothstep(bodyTop + 2.0, bodyTop - 20.0, h) : 1.0) * smoothstep(0.4, 2.5, dm);
    vec2 fp = vec2(dx, p.y) * uScale;
    // (How far out it reaches goes with the frame: closer in on a phone's small figure.)
    float near = dm * uScale / clamp(uScale / 1.9, 0.55, 1.2);
    float fall = 47.0 * uScale * t;

    // Dust: a point of light to a cell (not every cell), drawn out a little
    // along its way down, twinkling. A quick layer close to the body ...
    float ci = floor(fp.x / 5.0);
    float cy = fp.y - fall * mix(0.75, 1.25, hash(vec2(ci, 3.3)));
    vec2 id = vec2(ci, floor(cy / 22.0));
    vec2 off = vec2(fp.x, cy) - (id + 0.2 + 0.6 * vec2(hash(id + 4.4), hash(id + 2.9))) * vec2(5.0, 22.0);
    float mote = exp(-(off.x * off.x + 0.22 * off.y * off.y) / 0.38) * step(0.64, hash(id + 6.6)) * (0.55 + 0.45 * sin(t * 6.0 + hash(id + 1.1) * 6.283));
    motes = mote * exp(-near / 20.0);
    // ... and a slower, wider one.
    ci = floor(fp.x / 9.0);
    cy = fp.y - 0.5 * fall * mix(0.75, 1.25, hash(vec2(ci, 7.7)));
    id = vec2(ci, floor(cy / 30.0));
    off = vec2(fp.x, cy) - (id + 0.2 + 0.6 * vec2(hash(id + 8.4), hash(id + 5.9))) * vec2(9.0, 30.0);
    mote = exp(-(off.x * off.x + 0.35 * off.y * off.y) / 0.32) * step(0.8, hash(id + 3.6)) * (0.55 + 0.45 * sin(t * 5.0 + hash(id + 9.1) * 6.283));
    motes = (motes + 0.5 * mote * exp(-near / 46.0)) * beside;

    // The halo's waves: the same across the body's width (so no stripes
    // stand beside it), long and soft, travelling down. And the surface's
    // light drifting outwards.
    wave = (0.6 * (noise(vec2(3.7, (fp.y - 0.9 * fall) / 85.0)) - 0.5) + 0.4 * (noise(vec2(9.1, (fp.y - 1.3 * fall) / 38.0)) - 0.5)) * exp(-near / 55.0) * beside;
    drift = 0.82 + 0.36 * noise(vec2(adx / 26.0 - t * 1.6, 5.3));
  }
  float top = isOne ? 1.0 : mix(0.3, 1.0, smoothstep(0.0, 0.3 * sy, p.y));
  vec3 haloK = mix(BEAM, sideK, exp(-hp / 80.0));
  if (isOne) {
    // The figure burns white all through, to a clean edge (smoothed over
    // about a pixel of the drawing buffer); about it a close rim of the
    // beam's green, then the beam's halo.
    float soft = 0.75 / uDpr;
    float inside = 1.0 - smoothstep(-soft, soft, d1 * uScale);
    // The notch between the flag and the stem stays dark, as in the mark
    // (the light of its two edges would fill it); to the left, past the
    // stem's edge, it opens into the light under the flag.
    float notch = min(0.6878 - q.y, (q.y - 0.6054) - 0.3064 * (q.x + 0.1577)) * one * uScale;
    float open = smoothstep(-0.07, 0.02, q.x + 0.1577);
    float lit = 1.0 - 0.94 * smoothstep(-soft, soft, notch) * open;
    float rim = 1.6 * exp(-dm / (1.5 * beamWidth)) + 1.3 * exp(-dm / (6.0 * beamWidth)) + 0.3 * exp(-dm / (22.0 * beamWidth));
    rim *= 1.0 + 0.5 * flow * wave;
    col += (BEAM * 24.0 * inside + haloK * rim * (1.0 - inside) * lit) * above * drop;
  } else {
    float beamCore = 24.0 * exp(-adx / (2.0 * beamWidth));
    float beamHalo = 1.3 * exp(-adx / (6.0 * beamWidth)) + 0.3 * exp(-adx / (22.0 * beamWidth));
    beamHalo *= 1.0 + 0.5 * flow * wave;
    col += (BEAM * beamCore + haloK * beamHalo) * top * above * drop;
  }
  float head = exp(-sq((p.y - front) / 24.0)) * falling;
  col += mix(WHITE, BEAM, 0.35) * head * (7.0 * exp(-dm / (2.6 * beamWidth)) + 1.0 * exp(-dm / (14.0 * beamWidth)));
  col += WHITE * 2.6 * motes * flow * above;

  // The light leaves the body for the surface at the beam's line, or at the
  // two sides of the "1"'s stem: adxb is the distance across from there.
  float adxb = isOne ? max(adx - ONE_SIDE * one, 0.0) : adx;
  float psi = adxb * (outline + 1.0);
  float rise = max(hp - 17.9 * flare, 0.0);
  float skirtAmp = 16.6 * (exp(-sq(rise / (11.8 * flare))) + 0.3 * exp(-rise / (60.0 * flare)));
  // (Its long tail runs up the beam's line: with the "1", no further than the figure.)
  if (isOne) skirtAmp *= 1.0 - smoothstep(0.6 * (lift + one), lift + one, hp);
  float skirtSpread = mix(134.0, 155.0, side) * breathe * flare * flare * mix(0.35, 1.0, min(bloom, 1.0)) * max(bloom, 1.0);
  float skirt = skirtAmp * exp(-psi / skirtSpread) * exp(-sq(adx / (max(layerLen, 60.0 * sqrt(uShape.z)) * 1.48))) * hug;
  col += sideK * skirt * flowMask * min(bloom, 1.0);

  float surfaceFlow = mix(1.0, drift, flow);
  float layer = 12.0 * exp(-adx / layerLen) * exp(-outline / (0.19 * layerLen * uEdge)) * (1.0 + 0.4 * bead) * surfaceFlow;
  col += sideK * layer * hug * flowMask * min(bloom, 1.0);
  float washMask = smoothstep(sl - 60.0, sl + 6.0, p.x) * (1.0 - smoothstep(sr - 6.0, sr + 45.0, p.x));
  float wash = 1.4 * exp(-adx / 100.0) * exp(-outline / (30.0 * uEdge));
  col += mix(BEAM, sideK, 0.25) * wash * hugWide * washMask * flowMask * min(bloom, 1.0);
  float highWash = 0.7 * exp(-adx / 140.0) * exp(-outline / (60.0 * uEdge));
  col += mix(BEAM, NAVY, 0.5) * highWash * hugWide * washMask * runMask * min(bloom, 1.0);

  float sideSign = dx < 0.0 ? 0.0 : 1.0;
  float along = 0.5 * log((hp + 1.0) / (adxb + 1.0));
  float lineScale = 6.0;
  float lp = log(max(psi, 1.0) / (120.0 * flare * flare)) * lineScale;
  float lineIndex = floor(lp) + sideSign * 97.0;
  float wobble = 0.22 * (noise(vec2(lineIndex * 3.7, t * 0.4 + along)) - 0.5);
  float lf = fract(lp + wobble) - 0.5;
  float gradient = lineScale * length(vec2(hp + 1.0, adxb)) / max(psi, 1.0) / uScale;
  float halfWidth = max(0.35 * gradient, 0.0001);
  float drawWidth = max(halfWidth, 0.6 * gradient);
  float lineShape = exp(-lf * lf / (drawWidth * drawWidth)) * (halfWidth / drawWidth);
  float lineOn = step(0.3, hash(vec2(lineIndex, 1.3)));
  float lineFlow = smoothstep(0.25, 0.85, noise(vec2(lineIndex * 5.3 + 2.0, along * 3.0 + t * (1.1 + 0.9 * uFlow))));
  float flareArea = 120.0 * flare * flare;
  float lineEnvelope = smoothstep(0.85 * flareArea, 1.4 * flareArea, psi) * (1.0 - smoothstep(3.2 * flareArea, 7.5 * flareArea, psi));
  lineEnvelope *= exp(-adx / (layerLen * 1.5)) * hug * flowMask * (1.0 - smoothstep(35.0 * flare, 80.0 * flare, hp));
  float lineBright = mix(0.35, 1.0, hash(vec2(lineIndex, 4.0)));
  col += mix(sideK, WHITE, 0.6) * lineShape * lineOn * lineFlow * lineEnvelope * lineBright * 2.6 * uAmount.w * min(bloom, 1.0);

  float edgeGlow = 22.8 * exp(-sq(adx / (150.0 * uShape.z))) * edgeMask * (1.0 + 0.9 * bead);
  float onTop = 1.0 - smoothstep(sy + radius, sy + radius + 10.0, p.y);
  float edgeLine = (exp(-sq(max(sd, 0.0) / 0.9)) + 0.12 * exp(-max(sd, 0.0) / 3.0)) * edgeGlow * onTop * surfaceFlow;
  col += mix(sideK, WHITE, 0.6) * edgeLine * min(bloom, 1.0);

  float pour = uShape.w;
  float baseline = exp(-sq(130.0 / 150.0));
  float strengthR = exp(-sq(reachR / (150.0 * uShape.z))) * (1.0 - smoothstep(0.8 * spread, 1.25 * spread, reachR)) / baseline * pour;
  float strengthL = exp(-sq(reachL / (150.0 * uShape.z))) * (1.0 - smoothstep(0.8 * spread, 1.25 * spread, reachL)) / baseline * pour;
  float fallY = p.y - sy - 0.3 * radius;
  float rightHalf = smoothstep(center.x - 4.0, center.x + 4.0, p.x);
  float haloR = exp(-length(p - vec2(sr - 0.3 * radius, sy + 0.3 * radius)) / 40.0) * sqrt(strengthR);
  float haloL = exp(-length(p - vec2(sl + 0.3 * radius, sy + 0.3 * radius)) / 40.0) * sqrt(strengthL);
  vec3 glowR;
  vec3 glowL;
  col += spill(sd, fallY, strengthR, uPour.y, t, glowR) * rightHalf;
  col += spill(sd, fallY, strengthL, uPour.x, t, glowL) * (1.0 - rightHalf);
  col += easeLight(glowR * rightHalf + NAVY * 0.9 * haloR, uPour.w);
  col += easeLight(glowL * (1.0 - rightHalf) + NAVY * 0.9 * haloL, uPour.z);

  vec2 toLens = frag - uLens.xy;
  float lens = exp(-dot(toLens, toLens) / sq(uLens.z)) * uLens.w;
  col *= 1.0 + 0.35 * lens * hug;
  float fogAmount = uAmount.y * uAtmosphere;
  float near = exp(-adx / 150.0);
  float envelope = near * (0.3 + 0.4 * exp(-hp / 50.0) + 1.2 * exp(-p.y / 120.0));
  if (fogAmount > 0.001 && h > -2.0 && envelope * max(0.25, 6.0 * exp(-adx / 50.0)) > 0.002) {
    vec2 fq = vec2(dx / 1.7, h) / 85.0 + vec2(t * 0.012, -t * 0.03) + uExtra.zw;
    vec2 fw = vec2(fbm(fq * 1.3 + vec2(1.7, 9.2) + t * 0.03), fbm(fq * 1.3 + vec2(8.3, 2.8) - t * 0.025));
    float cloud = fbm(fq + 1.4 * fw);
    float density = smoothstep(0.5, 0.78, cloud);
    float lit = exp(-dm / 50.0);
    float fogMask = smoothstep(-2.0, 20.0, h);
    float reached = smoothstep(front + 80.0, front - 40.0, p.y);
    vec3 fog = (HAZE * 0.45 + BEAM * 6.0 * lit * reached) * density * envelope * fogMask;
    float surfaceLit = exp(-adx / (layerLen * 1.3)) * exp(-outline / 28.0) * hugWide * flowMask * washMask * min(bloom, 1.0);
    fog += sideK * 2.2 * surfaceLit * (smoothstep(0.38, 0.72, cloud) - 0.35) * fogMask;
    float smoke = smoothstep(0.3, 0.75, cloud);
    fog += BEAM * 0.35 * exp(-dm / (22.0 * beamWidth)) * (0.35 + 0.9 * smoke) * fogMask * top * drop;
    col += fog * fogAmount * (1.0 + 1.2 * lens) * mix(1.0, 0.45, uTheme);
  }

  if (uRevealInfo.y > 0.001 && uLens.w > 0.002) {
    vec2 toReveal = frag - uLens.xy;
    float reveal = exp(-dot(toReveal, toReveal) / sq(uRevealInfo.x)) * uLens.w;
    vec2 uv = frag * uRevealMap.xy + uRevealMap.zw;
    float onImage = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    vec4 ui = texture(uReveal, uv);
    float ink = max(ui.r, max(ui.g, ui.b)) * onImage;
    float lit = clamp(col.b * 0.9, 0.0, 1.0) * (1.0 - smoothstep(0.9, 2.2, col.b));
    float clearance = smoothstep(60.0 * sqrt(beamWidth), 150.0 * sqrt(beamWidth), adx);
    col += mix(BEAM, WHITE, 0.4) * ink * reveal * lit * clearance * uRevealInfo.y * 2.2;
  }

  float haze = col.b;
  float dotGrid = 1.0 - smoothstep(0.16, 0.32, length(fract(frag / 3.0) - 0.5));
  col += BEAM * dotGrid * clamp(haze, 0.0, 1.5) * (1.0 - smoothstep(1.5, 4.0, haze)) * (0.18 + 0.3 * lens) * uExtra.y;
  if (lens > 0.002) {
    vec2 drift = frag - vec2(0.0, t * 14.0);
    vec2 sparkCell = floor(drift / 7.0);
    vec2 sparkPos = (sparkCell + 0.2 + 0.6 * vec2(hash(sparkCell + 5.1), hash(sparkCell + 2.3))) * 7.0;
    float sparkDist = length(drift - sparkPos);
    float sparkOn = step(0.8, hash(sparkCell + 8.8));
    float sparkTwinkle = 0.5 + 0.5 * sin(t * 5.0 + hash(sparkCell + 3.7) * 6.283);
    col += WHITE * exp(-sparkDist * sparkDist / 0.35) * sparkOn * sparkTwinkle * lens * clamp(haze * 1.5, 0.0, 1.0) * 1.6 * uAmount.z;
  }

  float dustAmount = uAmount.z;
  if (dustAmount > 0.001) {
    float dustLp = log(max(psi, 1.0) / (120.0 * flare * flare)) * 2.2;
    vec2 flowCell = vec2(dustLp / 1.1, (along + t * 0.22) / 0.06);
    vec2 cellId = floor(flowCell) + vec2(sideSign * 131.0, 0.0);
    vec2 cellJitter = vec2(hash(cellId + 1.7), hash(cellId + 8.3));
    vec2 particleFlow = (floor(flowCell) + 0.1 + cellJitter * 0.8) * vec2(1.1, 0.06);
    float particlePsi = 120.0 * flare * flare * exp(particleFlow.x / 2.2);
    float particleAlong = particleFlow.y - t * 0.22;
    float particleX = sqrt(particlePsi * exp(-2.0 * particleAlong)) - 1.0;
    float particleH = sqrt(particlePsi * exp(2.0 * particleAlong)) - 1.0;
    float particleDist = length(vec2(adxb - particleX, hp - particleH)) * uScale;
    float particleOn = step(0.62, hash(cellId + 3.1));
    float particleTwinkle = 0.5 + 0.5 * sin(t * 5.0 + hash(cellId + 9.2) * 6.283);
    float dustZone = exp(-sq(log(max(psi, 1.0) / (200.0 * flare * flare)) / 0.55)) * hug * flowMask * smoothstep(0.0, 6.0, outline);
    col += WHITE * exp(-particleDist * particleDist / 0.3) * particleOn * particleTwinkle * dustZone * 3.0 * dustAmount * min(bloom, 1.0);

    vec2 glitterCell = vec2(dx / 3.0, (p.y - t * 26.0) / 9.0);
    vec2 glitterId = floor(glitterCell);
    vec2 glitterJitter = vec2(hash(glitterId + 4.4), hash(glitterId + 2.9));
    vec2 glitterPos = (glitterId + 0.15 + glitterJitter * 0.7) * vec2(3.0, 9.0);
    float glitterDist = length(vec2(dx, p.y - t * 26.0) - glitterPos) * uScale;
    float glitterOn = step(0.7, hash(glitterId + 6.6));
    float glitterTwinkle = 0.5 + 0.5 * sin(t * 6.0 + hash(glitterId + 1.1) * 6.283);
    float glitterZone = exp(-dm / (5.0 * beamWidth)) * smoothstep(1.5, 4.0, dm / beamWidth) * above * smoothstep(25.0, 70.0, hp) * top * drop;
    col += WHITE * exp(-glitterDist * glitterDist / 0.25) * glitterOn * glitterTwinkle * glitterZone * 2.2 * dustAmount * uAtmosphere;
  }

  col *= uAmount.x * (1.0 + uIntro.z * 0.9 * exp(-length(vec2(dx, h * 1.6)) / 70.0));
  col *= smoothstep(-0.75, 0.25, sd * uScale);

  vec3 emit = 1.0 - exp(-col * mix(1.0, 0.6, uTheme));
  float peak = max(emit.r, max(emit.g, emit.b));
  if (uTheme > 0.5) {
    float low = min(emit.r, min(emit.g, emit.b));
    float chroma = peak - low;
    vec3 hue = (emit - low) / max(chroma, 0.0001);
    float alpha = clamp(pow(chroma, 1.35) * 1.3, 0.0, 1.0) * 0.9;
    outColor = vec4((hue * 0.82 + 0.06) * alpha, alpha);
  } else {
    outColor = vec4(emit, peak);
  }
}`;

// Each of the shader's sixteen tints, as a hue shift from the chosen colour and a saturation scale.
const TINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [-11.5, 0.77],
  [9.5, 0.95],
  [-53.5, 0.79],
  [39.5, 0.77],
  [16, 0.81],
  [-16.3, 0.92],
  [13.3, 0.96],
  [3, 1.01],
  [1, 0.68],
  [1, 1.15],
  [142.5, 0.51],
  [113.6, 0.28],
  [-7.5, 0.13],
  [-2.7, 0.32],
  [7.5, 0.81],
];

const UNIFORMS = [
  "uResolution", "uDpr", "uScale", "uTime", "uBeamX", "uSurface", "uRadius", "uIntro", "uPour", "uRun", "uLens",
  "uReveal", "uRevealMap", "uRevealInfo", "uAtmosphere", "uAmount", "uShape", "uExtra", "uTheme", "uOne", "uFlow", "uEdge", "uTint",
] as const;
type UniformName = (typeof UNIFORMS)[number];

const BASE_SATURATION = 0.78;
const MAX_RENDER_DIM = 2048;
const INTRO_DROP = 1.25;
const INTRO_END = 5;
const FALLBACK_RGB: Rgb = [0.22, 0.28, 1];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
const spring = (time: number) => {
  const omega = 8;
  const zeta = 0.62;
  const damped = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * time) * (Math.cos(damped * time) + ((zeta * omega) / damped) * Math.sin(damped * time));
};

const toHsv = ([r, g, b]: Rgb): [number, number] => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return [(hue * 60 + 360) % 360, max > 0 ? delta / max : 0];
};

const fromHsv = (hue: number, saturation: number): Rgb => {
  const h = (((hue % 360) + 360) % 360) / 60;
  const c = saturation;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = 1 - c;
  const [r, g, b]: Rgb = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m];
};

const buildTints = (rgb: Rgb) => {
  const [hue, saturation] = toHsv(rgb);
  const strength = saturation / BASE_SATURATION;
  const data = new Float32Array(TINTS.length * 3);
  TINTS.forEach(([shift, scale], index) => {
    data.set(fromHsv(hue + shift, clamp(BASE_SATURATION * scale * strength, 0, 1)), index * 3);
  });
  return data;
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const link = (gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return program;
};

// The props, held to the ranges the shader is written for. Read every frame.
const settings = () => ({
  surface: props.surface,
  beamPosition: clamp(props.beamPosition, 0, 1),
  surfaceLevel: clamp(props.surfaceLevel, 0, 1),
  color: String(props.color),
  intensity: Math.max(0, props.intensity),
  beamWidth: clamp(props.beamWidth, 0.2, 5),
  flare: clamp(props.flare, 0.2, 4),
  spread: clamp(props.spread, 0.1, 4),
  spill: Math.max(0, props.spill),
  fog: Math.max(0, props.fog),
  dust: Math.max(0, props.dust),
  streaks: Math.max(0, props.streaks),
  dots: Math.max(0, props.dots),
  pulse: Math.max(0, props.pulse),
  speed: props.speed,
  seed: props.seed,
  mouseInteraction: props.mouseInteraction,
  revealImage: props.revealImage,
  revealRadius: Math.max(1, props.revealRadius),
  revealOpacity: clamp(props.revealOpacity, 0, 1),
  intro: props.intro,
  theme: props.theme,
  paused: props.paused,
  dpr: props.dpr,
  oneHeight: Math.max(0, props.oneHeight),
  oneLift: Math.max(0, props.oneLift),
  flow: Math.max(0, props.flow),
  edge: clamp(props.edge, 0.05, 2),
});
type Settings = ReturnType<typeof settings>;

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let dispose: (() => void) | null = null;
let wakeUp: (() => void) | null = null;

onMounted(() => {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  const gl = canvas?.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }) ?? null;
  if (!container || !canvas || !gl) {
    emit("unsupported");
    return;
  }

  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  const program = link(gl, VERTEX, FRAGMENT);
  if (!program) {
    emit("unsupported");
    return;
  }

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  const uniforms = {} as Record<UniformName, WebGLUniformLocation | null>;
  let ready = false;

  const linked = () => !parallel || Boolean(gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR));

  const resolveProgram = () => {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (import.meta.dev) console.warn("[LaserFlow]", gl.getProgramInfoLog(program));
      return false;
    }
    for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    ready = true;
    return true;
  };

  const revealTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, revealTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // A 1px canvas reads any CSS colour as RGB.
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const probeContext = probe.getContext("2d", { willReadFrequently: true });
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const state = {
    time: 0,
    introTime: settings().intro && !reduce ? 0 : INTRO_END,
    width: 1,
    height: 1,
    ratio: 1,
    colorKey: "",
    tints: buildTints(FALLBACK_RGB),
    observed: null as HTMLElement | null,
    pointer: { x: 0, y: 0, inside: false },
    lens: { x: 0, y: 0, vx: 0, vy: 0, strength: 0, placed: false },
    reveal: { src: "", ready: false, width: 1, height: 1, image: null as HTMLImageElement | null },
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = true;

  const toRgb = (value: string): Rgb => {
    if (!probeContext) return FALLBACK_RGB;
    probeContext.clearRect(0, 0, 1, 1);
    probeContext.fillStyle = "#3847ff";
    probeContext.fillStyle = value;
    probeContext.fillRect(0, 0, 1, 1);
    const data = probeContext.getImageData(0, 0, 1, 1).data;
    return [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255];
  };

  const resolveColor = (s: Settings) => {
    if (s.color === state.colorKey) return;
    state.colorKey = s.color;
    state.tints = buildTints(toRgb(s.color));
  };

  const resolveReveal = (s: Settings) => {
    const src = s.revealImage ? String(s.revealImage) : "";
    const reveal = state.reveal;
    if (src === reveal.src) return;
    reveal.src = src;
    reveal.ready = false;
    if (reveal.image) reveal.image.onload = null;
    if (!src) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      if (!alive || reveal.src !== src) return;
      const width = image.naturalWidth || image.width || 1;
      const height = image.naturalHeight || image.height || 1;
      const scale = Math.min(1, 2048 / Math.max(width, height));
      const sheet = document.createElement("canvas");
      sheet.width = Math.max(1, Math.round(width * scale));
      sheet.height = Math.max(1, Math.round(height * scale));
      sheet.getContext("2d")?.drawImage(image, 0, 0, sheet.width, sheet.height);
      gl.bindTexture(gl.TEXTURE_2D, revealTexture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sheet);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      reveal.width = sheet.width;
      reveal.height = sheet.height;
      reveal.ready = true;
      wakeUp?.();
    };
    image.src = src;
    reveal.image = image;
  };

  const render = () => {
    if (!ready) return;
    const s = settings();
    resolveColor(s);
    const { width, height } = state;
    const scale = Math.max(0.2, Math.min(width / 585, height / 507));
    let surface = measure(s, width, height);
    let beamX = s.beamPosition * width;
    if (surface.real) {
      const margin = surface.radius + 6;
      if (beamX >= surface.left && beamX <= surface.right) {
        beamX = clamp(beamX, surface.left + margin, surface.right - margin);
      } else {
        surface = { left: -width * 2, top: height, right: width * 3, bottom: height * 3, radius: 0, real: false };
      }
    }
    // The "1" and its place, held to the room over the surface.
    const room = Math.max(0, surface.top);
    const oneHeight = Math.min(s.oneHeight, room);
    const oneLift = oneHeight > 0 ? Math.min(s.oneLift, room - oneHeight) : 0;
    // The light starts from over the frame, or from just over the "1".
    const startY = oneHeight > 0 ? surface.top - oneLift - oneHeight - 0.08 * height : -0.15 * height;
    const span = surface.top - startY + 0.3 * height;
    const it = state.introTime;
    const settled = it >= INTRO_END;
    const front = settled ? surface.top + 0.3 * height : startY + span * Math.pow(clamp(it / INTRO_DROP, 0, 1), 1.3);
    const impact = INTRO_DROP * Math.pow(Math.max(0, surface.top - startY) / span, 1 / 1.3);
    const tau = it - impact;
    const bloom = settled ? 1 : tau <= 0 ? 0 : spring(tau);
    const flash = settled || tau <= 0 ? 0 : Math.exp(-tau / 0.35) * (1 - Math.exp(-tau / 0.05));
    const runRange = s.spread * 250 * 1.3 + 80;
    const runFront = settled ? 100000 : tau <= 0 ? -40 : runRange * (1 - Math.exp(-1.15 * tau));
    const beadStrength = settled || tau <= 0 ? 0 : Math.exp(-1.15 * tau) * (1 - Math.exp(-tau / 0.08));
    const pour = (reach: number): [number, number] => {
      if (settled) return [1000, 1];
      if (tau <= 0) return [-reach, 0];
      const target = Math.min(reach, runRange * 0.97);
      const arrival = -Math.log(1 - target / runRange) / 1.15;
      const elapsed = tau - arrival;
      const ease = clamp((elapsed + 0.15) / 0.8, 0, 1);
      const fill = ease * ease * ease * (ease * (ease * 6 - 15) + 10);
      if (elapsed <= 0) return [runFront - target, fill];
      const speed = 1.15 * (runRange - target);
      return [speed * elapsed + 260 * elapsed * elapsed, fill];
    };
    const [frontL, fillL] = pour((beamX - surface.left) / scale);
    const [frontR, fillR] = pour((surface.right - beamX) / scale);
    const atmosphere = settled ? 1 : tau <= 0 ? 0.3 * easeOut(it / INTRO_DROP) : 0.3 + 0.7 * (1 - Math.exp(-1.3 * tau));
    const seedValue = Number(s.seed) || 0;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform2f(uniforms.uResolution, width, height);
    gl.uniform1f(uniforms.uDpr, state.ratio);
    gl.uniform1f(uniforms.uScale, scale);
    gl.uniform1f(uniforms.uTime, state.time);
    gl.uniform1f(uniforms.uBeamX, beamX);
    gl.uniform4f(uniforms.uSurface, surface.left, surface.top, surface.right, surface.bottom);
    gl.uniform1f(uniforms.uRadius, surface.radius);
    gl.uniform3f(uniforms.uIntro, front, bloom, flash);
    gl.uniform4f(uniforms.uPour, frontL, frontR, fillL, fillR);
    gl.uniform2f(uniforms.uRun, runFront, beadStrength);
    gl.uniform4f(uniforms.uLens, state.lens.x, state.lens.y, 95 * scale, state.lens.strength);
    resolveReveal(s);
    const { reveal } = state;
    const cover = Math.max(width / reveal.width, height / reveal.height);
    const coverWidth = reveal.width * cover;
    const coverHeight = reveal.height * cover;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, revealTexture);
    gl.uniform1i(uniforms.uReveal, 0);
    gl.uniform4f(uniforms.uRevealMap, 1 / coverWidth, 1 / coverHeight, (coverWidth - width) / 2 / coverWidth, (coverHeight - height) / 2 / coverHeight);
    gl.uniform2f(uniforms.uRevealInfo, s.revealRadius, reveal.ready ? s.revealOpacity : 0);
    gl.uniform1f(uniforms.uAtmosphere, atmosphere);
    gl.uniform4f(uniforms.uAmount, s.intensity, s.fog, s.dust, s.streaks);
    gl.uniform4f(uniforms.uShape, s.beamWidth, s.flare, s.spread, s.spill);
    gl.uniform4f(uniforms.uExtra, s.pulse, s.dots, 34.34 + seedValue * 7.31, 11.58 + seedValue * 3.17);
    gl.uniform1f(uniforms.uTheme, s.theme === "light" ? 1 : 0);
    gl.uniform2f(uniforms.uOne, oneHeight, oneLift);
    gl.uniform1f(uniforms.uFlow, s.flow);
    gl.uniform1f(uniforms.uEdge, s.edge);
    gl.uniform3fv(uniforms.uTint, state.tints);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const baseDpr = Math.min(settings().dpr || window.devicePixelRatio || 1, 2);
    const longest = Math.max(width, height) * baseDpr;
    const ratio = longest > MAX_RENDER_DIM ? (baseDpr * MAX_RENDER_DIM) / longest : baseDpr;
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    state.width = width;
    state.height = height;
    state.ratio = canvas.width / width;
    render();
  };

  const resizeObserver = new ResizeObserver(resize);

  // The surface's box in the frame's own pixels, with the radius of its top corners.
  const measure = (s: Settings, width: number, height: number): Surface => {
    const element = s.surface ?? null;
    if (element !== state.observed) {
      if (state.observed) resizeObserver.unobserve(state.observed);
      if (element) resizeObserver.observe(element);
      state.observed = element;
    }
    if (element) {
      const box = container.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      if (rect.width > 0) {
        const computed = getComputedStyle(element);
        const radius = Math.max(parseFloat(computed.borderTopLeftRadius) || 0, parseFloat(computed.borderTopRightRadius) || 0);
        return {
          left: rect.left - box.left,
          top: rect.top - box.top,
          right: rect.right - box.left,
          bottom: rect.bottom - box.top,
          radius: Math.min(radius, rect.width / 2, rect.height / 2),
          real: true,
        };
      }
    }
    return { left: -width * 2, top: s.surfaceLevel * height, right: width * 3, bottom: height * 3, radius: 0, real: false };
  };

  const stop = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    wakeUp = null;
    resizeObserver.disconnect();
    intersection.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    gl.deleteTexture(revealTexture);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
    if (!gl.isContextLost()) gl.deleteProgram(program);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive || !visible || document.hidden) return;
    if (!ready) {
      if (!gl.isContextLost() && !linked()) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (!resolveProgram()) {
        stop();
        emit("unsupported");
        return;
      }
    }
    const s = settings();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const moving = !s.paused && !reduce;
    if (moving) state.time += dt * s.speed;
    const introducing = state.introTime < INTRO_END;
    // The beam comes down once the page loader has left.
    const waiting = document.documentElement.classList.contains("ob-loading");
    if (introducing && !waiting) state.introTime = Math.min(INTRO_END, state.introTime + dt);

    const { pointer, lens } = state;
    const active = s.mouseInteraction && pointer.inside && !reduce;
    if (active && !lens.placed) {
      lens.x = pointer.x;
      lens.y = pointer.y;
      lens.vx = 0;
      lens.vy = 0;
      lens.placed = true;
    }
    const ax = 120 * (pointer.x - lens.x) - 19 * lens.vx;
    const ay = 120 * (pointer.y - lens.y) - 19 * lens.vy;
    lens.vx += ax * dt;
    lens.vy += ay * dt;
    lens.x += lens.vx * dt;
    lens.y += lens.vy * dt;
    const goal = active ? 1 : 0;
    lens.strength += (goal - lens.strength) * (1 - Math.exp(-dt / (goal > lens.strength ? 0.3 : 0.55)));
    if (lens.strength < 0.001 && !active) lens.placed = false;

    render();
    const settling =
      Math.abs(state.lens.strength - (s.mouseInteraction && state.pointer.inside ? 1 : 0)) > 0.002 ||
      Math.hypot(state.lens.vx, state.lens.vy) > 0.5;
    if (moving || introducing || settling) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  const wake = () => {
    if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const onPointerMove = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    state.pointer.x = x;
    state.pointer.y = y;
    state.pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    wake();
  };

  const onPointerLeave = () => {
    state.pointer.inside = false;
    wake();
  };

  const onVisibility = () => {
    last = 0;
    wake();
  };

  resizeObserver.observe(container);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      last = 0;
      wake();
    }
  });
  intersection.observe(container);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("visibilitychange", onVisibility);

  wakeUp = () => {
    if (!raf) render();
    wake();
  };
  dispose = () => {
    stop();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };

  if (parallel || resolveProgram()) {
    resize();
    wake();
  } else {
    stop();
    emit("unsupported");
  }
});

// A changed prop is drawn at once, also while the animation is at rest.
watch(props, () => wakeUp?.());

onBeforeUnmount(() => {
  dispose?.();
  dispose = null;
});
</script>

<template>
  <div ref="containerRef" class="laser-flow">
    <canvas ref="canvasRef" class="laser-flow__canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
.laser-flow {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.laser-flow__canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
</style>
