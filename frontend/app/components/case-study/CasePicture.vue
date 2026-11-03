<script setup lang="ts">
// A picture the full width of the column in a card with 24px corners, with
// the small "Onebranding" mark at its top right. The mark is dark ink, as on
// the design's light photographs; once the picture has loaded, a dark corner
// under it turns it white. A picture that carries the mark itself (ownMark)
// gets none.
import { onMounted, ref } from "vue";

const props = defineProps<{ src: string; alt: string; width?: number; height?: number; eager?: boolean; ownMark?: boolean }>();

const root = ref<HTMLElement | null>(null);
const tone = ref<"dark" | "light">("dark");

// The mean luminance of the corner the mark sits on, read from a tiny copy
// of the picture (served from this site by /_ipx, so the canvas may read it).
const readCorner = () => {
  const image = root.value?.querySelector("img");
  if (!image?.complete || !image.naturalWidth) return;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 4;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const { naturalWidth: w, naturalHeight: h } = image;
    context.drawImage(image, w * 0.7, 0, w * 0.3, h * 0.16, 0, 0, 8, 4);
    const pixels = context.getImageData(0, 0, 8, 4).data;
    let sum = 0;
    for (let at = 0; at < pixels.length; at += 4) {
      sum += 0.2126 * pixels[at]! + 0.7152 * pixels[at + 1]! + 0.0722 * pixels[at + 2]!;
    }
    tone.value = sum / (pixels.length / 4) < 150 ? "light" : "dark";
  } catch {
    // A picture from another origin cannot be read: the mark stays dark.
  }
};

// The server-rendered picture may have loaded before the page hydrated;
// otherwise it is read once it has (on the <img> itself: NuxtImg does not
// pass its load event on).
onMounted(() => {
  if (props.ownMark) return;
  const image = root.value?.querySelector("img");
  if (image?.complete) readCorner();
  else image?.addEventListener("load", readCorner, { once: true });
});

const ratio = props.width && props.height ? `${props.width} / ${props.height}` : "16 / 9";
</script>

<template>
  <figure ref="root" class="case-picture" :class="`case-picture--${tone}`" :style="{ aspectRatio: ratio }">
    <!-- 80% of the screen on tablets and up, the screen less its margins on
         phones; every screen size is named (a bare 100vw lists 1px copies). -->
    <NuxtImg
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      sizes="xs:100vw sm:100vw md:80vw lg:80vw xl:80vw xxl:80vw"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
    />
    <span v-if="!ownMark" class="case-picture__mark" aria-hidden="true"><span>One</span>branding</span>
  </figure>
</template>

<style scoped>
.case-picture {
  position: relative;
  container-type: inline-size;
  overflow: hidden;
  width: 100%;
  /* The space above is CaseSections' to set. */
  margin-inline: 0;
  margin-bottom: 0;
  border-radius: clamp(1rem, 1.7vw, 1.5rem);
  background: #eeeceb;
}

.case-picture img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Where the design has it: 4% of the card's width down, 5.4% in from the
   right, about 7% of the card wide. */
.case-picture__mark {
  position: absolute;
  top: 4cqi;
  right: 5.4cqi;
  color: #111;
  font-family: var(--app-font-sans);
  font-size: max(0.6875rem, 1.16cqi);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.01em;
  pointer-events: none;
  user-select: none;
  transition: color 0.3s;
}

.case-picture__mark > span {
  color: #00962e;
  transition: color 0.3s;
}

.case-picture--light .case-picture__mark {
  color: #fff;
}

.case-picture--light .case-picture__mark > span {
  color: #03cb00;
}
</style>
