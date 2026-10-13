<script setup lang="ts">
import { computed, useAttrs, type StyleValue } from "vue";
import { optSources } from "~/utils/optImage";

// An <img> served from the build-time AVIF/WebP copies (utils/optImage.ts):
// the browser picks the smallest copy that is sharp at the drawn size and the
// screen's pixel density (`sizes`). Until it arrives, a tiny blurred preview of
// the photo fills the box, and AVIF is shown only once complete, so a slow
// connection shows a soft preview instead of a half-drawn picture.
// All other attributes (class, alt, loading, width/height, style...) go to the
// <img>; <picture> is display: contents, so styles written for the <img> keep
// working. Sources without copies render as a plain <img>.

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  src: string;
  /** The drawn width, as for <img sizes>. */
  sizes?: string;
  /** Leave out copies wider than this. */
  maxWidth?: number;
  /** Show the blurred preview while loading. */
  preview?: boolean;
}>(), { sizes: "100vw", maxWidth: undefined, preview: true });

const attrs = useAttrs();
const sources = computed(() => optSources(props.src, { maxWidth: props.maxWidth }));
const style = computed<StyleValue>(() => {
  const lqip = props.preview ? sources.value?.lqip : undefined;
  if (!lqip) return attrs.style as StyleValue;
  return [{ background: `url(${lqip}) center / cover no-repeat` }, attrs.style as StyleValue];
});
const imgAttrs = computed(() => {
  const { style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <picture v-if="sources" class="opt-picture">
    <source type="image/avif" :srcset="sources.avif" :sizes="sizes">
    <source type="image/webp" :srcset="sources.webp" :sizes="sizes">
    <img
      v-bind="imgAttrs"
      :src="sources.fallback"
      :sizes="sizes"
      :width="imgAttrs.width ?? sources.width"
      :height="imgAttrs.height ?? sources.height"
      :style="style"
    >
  </picture>
  <img v-else v-bind="imgAttrs" :src="src" :style="attrs.style as StyleValue">
</template>
