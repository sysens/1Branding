<script setup lang="ts">
// "We bring both. Full speed. Full creative power.": the racing car on its lit
// track. The picture is still; a shader over it (blended as light) makes the
// track run: heads of light with tails behind them travel along the lanes,
// which fan out from the picture's vanishing point at the left, and the
// lanes shimmer between them. They stream back past the car, towards the
// vanishing point, which is what reads as the car driving forward (FLOW = -1
// sends them the other way).
//
// The shader lights only what is already the track's light: it reads the
// picture itself and brightens its green, bright pixels, so the tarmac, the
// tyres and the dark stay dark, and the car (an ellipse round it) is left
// alone.
//
// The wheels turn: each tyre has a green ring painted on it, and two lights
// with tails run round that ring, clockwise (the way a wheel rolls when the
// car heads right). The ring is already as green as the screen gets, so
// light alone would not show on it: between the lights the ring is dimmed,
// and a light brings it back with a white-hot head. Which pixels are a ring
// comes from a mask cut from the picture (RINGS, made by
// scripts/prepare-car-rings.mjs: the track's green lies a pixel from a ring
// in places); where a pixel is on its ring's round comes from the ring's
// ellipse (WHEELS: its centre and half-axes; the rings are seen at an angle).
//
// The canvas is laid over the picture as it is (no blend mode): the shader
// writes the light to add and, as alpha, how much of the picture to take
// away under it. The light is scaled by what the picture leaves room for
// (1 - picture), which is what "screen" blending does.
//
// The heading stands in the picture's dark sky, over the car, so the two are
// on screen together. On a short, wide window the picture is one screen tall
// at most and cropped (object-fit: cover, held 20% down); the shader is told
// the crop (uCrop), so its lights stay on the picture's lanes.
import { onBeforeUnmount, onMounted, ref } from "vue";
import OptImage from "~/components/ui/OptImage.vue";
import { optSources } from "~/utils/optImage";
import { mountShaderCanvas, type ShaderCanvas } from "~/utils/shaderCanvas";

const { t } = useI18n();

const CAR = "/one-guarantee-page/car.webp";
const RINGS = "/one-guarantee-page/masks/car-rings.png";
// Where the lanes meet, in the picture (x right, y up; just off its left edge).
const VANISH: [number, number] = [-0.06, 0.59];
const FLOW = 1;
// The picture is twice as wide as it is tall, and held 20% down when its box
// is wider than that (the same in the CSS below): the crop takes the track at
// its foot, not the sky the heading stands in.
const PICTURE_RATIO = 2;
const PICTURE_HOLD = 0.2;
// The tyres' green rings, measured on the picture (1774 x 887; x right, y up,
// as shares of its width and height): the rear wheel, the near front one, the
// far front one.
const WHEELS: Array<[number, number, number, number]> = [
  [0.2926, 0.5006, 0.0066, 0.0583],
  [0.3929, 0.4679, 0.0121, 0.0814],
  [0.6561, 0.5039, 0.0176, 0.055],
];
// Turns of the lights round a ring each second.
const WHEEL_TURNS = 0.85;
// How much of the ring's light is taken away between the lights.
const RING_DIM = 0.64;

const canvas = ref<HTMLCanvasElement | null>(null);

const FRAGMENT = `
uniform sampler2D uImage;
uniform sampler2D uRings;
uniform vec2 uVanish;
uniform float uFlow;
uniform vec2 uCrop;
uniform vec4 uWheelA;
uniform vec4 uWheelB;
uniform vec4 uWheelC;
uniform float uTurns;
uniform float uDim;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}

// The two lights with tails running round a wheel's ring (clockwise: the
// head goes towards smaller angles), about that wheel only.
float wheel(vec2 uv, vec4 ring) {
  vec2 d = (uv - ring.xy) / ring.zw;
  float turn = atan(d.y, d.x) / 6.2831853;
  float g = fract(turn * 2. + uTime * uTurns * 2.);
  return step(length(d), 1.7) * pow(1. - g, 2.2) * smoothstep(0., .05, g);
}

void main() {
  // The picture's own coordinates: the box shows uCrop.x of its height, from uCrop.y up.
  vec2 uv = gl_FragCoord.xy / uRes;
  uv.y = uCrop.y + uv.y * uCrop.x;
  vec3 img = texture2D(uImage, uv).rgb;

  // The track's light: green, or burnt white at a trail's heart.
  float green = img.g - .6 * max(img.r, img.b);
  float light = smoothstep(.06, .5, green) + .6 * smoothstep(.75, 1., min(img.r, min(img.g, img.b)));

  // The car keeps its own light.
  vec2 c = (uv - vec2(.533, .522)) / vec2(.27, .2);
  float car = smoothstep(.8, 1.2, length(c));

  // Lanes fan out from the vanishing point; log(r) keeps the lights' speed in perspective.
  vec2 v = (uv - uVanish) * vec2(2., 1.);
  float r = length(v);
  float ang = atan(v.y, v.x);
  float lane = floor(ang * 38.);
  // Each lane's lights fade out towards its sides, so neighbours never meet on a hard line.
  float across = fract(ang * 38.);
  float soft = smoothstep(0., .3, across) * smoothstep(1., .7, across);
  float h = hash(vec2(lane, 3.7));
  float h2 = hash(vec2(lane, 11.3));
  float along = log(r + .03) * 2.2;
  float speed = .5 + .45 * h;

  float g = fract(along + uFlow * uTime * speed + h2 * 7.);
  float head = uFlow > 0. ? pow(1. - g, 6.) * smoothstep(0., .06, g) : pow(g, 6.) * smoothstep(1., .94, g);
  float g2 = fract(along * 1.7 + uFlow * uTime * speed * 1.5 + h * 5.);
  float second = uFlow > 0. ? pow(1. - g2, 9.) : pow(g2, 9.);
  float shimmer = noise(vec2(ang * 80., along * 6. + uFlow * uTime * 2.4));
  float glow = (head * 1.7 + second * .6) * soft + shimmer * .3;

  // Nearer the camera (farther from the vanishing point): brighter.
  float near = smoothstep(0., .9, r);
  vec3 col = (img * 1.5 + vec3(.05, .35, .1)) * glow * light * car * (.5 + .8 * near);

  // The wheels' rings: dimmed between the lights; a light gives the ring back
  // and burns white at its head.
  float ring = smoothstep(.1, .6, texture2D(uRings, uv).r);
  float lit = wheel(uv, uWheelA) + wheel(uv, uWheelB) + wheel(uv, uWheelC);
  float dim = uDim * ring * (1. - smoothstep(0., .5, lit));
  col += vec3(.7, 1., .75) * ring * pow(lit, 2.4) * 1.5;

  // Added as "screen" would add it; alpha takes the picture away under it.
  gl_FragColor = vec4(min(col, 1.) * (1. - img), clamp(dim, 0., 1.));
}
`;

let shader: ShaderCanvas | null = null;

onMounted(() => {
  const element = canvas.value;
  // With reduced motion the picture stays as it is.
  if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const texture = optSources(CAR, { fallbackWidth: 960 })?.fallback ?? CAR;
  shader = mountShaderCanvas(element, {
    fragment: FRAGMENT,
    maxDpr: 1.5,
    textures: { uImage: texture, uRings: RINGS },
    uniforms: () => {
      // A box wider than the picture shows only part of its height.
      const shown = Math.min(1, PICTURE_RATIO / (element.clientWidth / Math.max(1, element.clientHeight)));
      return {
        uVanish: VANISH,
        uFlow: FLOW,
        uCrop: [shown, (1 - PICTURE_HOLD) * (1 - shown)],
        uWheelA: WHEELS[0]!,
        uWheelB: WHEELS[1]!,
        uWheelC: WHEELS[2]!,
        uTurns: WHEEL_TURNS,
        uDim: RING_DIM,
      };
    },
  });
});

onBeforeUnmount(() => {
  shader?.destroy();
  shader = null;
});
</script>

<template>
  <section class="og-speed">
    <div class="og-speed__frame">
      <div class="og-speed__copy">
        <h2 v-blur-reveal class="og-speed__title type-display-s">{{ t("oneGuarantee.speed.title") }}</h2>
        <p v-rise class="og-speed__sub type-h3 ob-green">{{ t("oneGuarantee.speed.sub") }}</p>
      </div>

      <div class="og-speed__picture">
        <OptImage :src="CAR" :alt="t('oneGuarantee.speed.alt')" sizes="(max-width: 767px) 170vw, 100vw" loading="lazy" decoding="async" :preview="false" />
        <canvas ref="canvas" class="og-speed__lights" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>

<style scoped>
/* The design at 1440px: the picture (2:1) as wide as the screen, with the
   heading in its dark sky, over the car. Type is the site's scale: "We bring
   both." display-s, the line under it h3. */
.og-speed {
  position: relative;
  padding-top: clamp(2.5rem, 4 * var(--fvw), 5rem);
  background: #000;
  overflow: hidden;
}

/* The content frame, as on the landing: as wide as the screen up to 1920px,
   centred on wider ones (--frame-max). A band of black over the picture
   (--band) gives the heading room above the car; the heading starts under
   where the site header lies when the section fills the screen (--copy-top),
   so the header never covers it while the car is in view. */
.og-speed__frame {
  --band: calc(4 * var(--fvw));
  --copy-top: clamp(5rem, 7.2 * var(--fvw), 6.5rem);
  position: relative;
  max-width: var(--frame-max);
  margin-inline: auto;
  padding-top: var(--band);
}

.og-speed__copy {
  position: absolute;
  inset: var(--copy-top) 0 auto;
  z-index: 1;
  padding-inline: 1.25rem;
  text-align: center;
}

.og-speed__title {
  margin: 0;
  text-wrap: balance;
}

.og-speed__sub {
  margin: 0.25em 0 0;
  color: #17d53a;
  text-wrap: balance;
}

/* The picture and the lights over it share one box, so they stay registered.
   One screen tall at most (less the band over it): a short, wide window crops
   it instead of pushing the car below the fold. */
.og-speed__picture {
  position: relative;
  /* Stated, so that the height limit shortens the box instead of narrowing it
     (with an automatic width the limit is carried over through the ratio). */
  width: 100%;
  aspect-ratio: 2 / 1;
  max-height: calc(100svh - var(--band));
}

.og-speed__picture :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 20%;
}

.og-speed__lights {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* The track sinks into the black below. */
.og-speed__picture::after {
  position: absolute;
  inset: auto 0 0;
  height: 22%;
  background: linear-gradient(to bottom, transparent, #000);
  content: "";
  pointer-events: none;
}

/* Wider than the frame: the picture's sides fade into the black page. */
@media (min-width: 1921px) {
  .og-speed__picture {
    -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
    mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
  }
}

/* Phones: the heading over the picture, which is wider than the screen with
   the car in the middle. */
@media (max-width: 767px) {
  .og-speed {
    padding-top: 3.5rem;
  }

  .og-speed__frame {
    padding-top: 0;
  }

  .og-speed__copy {
    position: relative;
    inset: auto;
  }

  .og-speed__picture {
    width: 170vw;
    max-height: none;
    margin: 0.5rem 0 0 -40.6vw;
  }
}
</style>
