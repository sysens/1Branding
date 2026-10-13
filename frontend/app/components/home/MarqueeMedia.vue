<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";
import { computed, ref, watch } from "vue";
import { optEntry } from "~/utils/optImage";

type Props = {
  src: string;
  alt?: string;
  eager?: boolean;
  /** Render only the frame: the image is left out of the server HTML until needed. */
  deferred?: boolean;
  priority?: "auto" | "low";
};

const props = withDefaults(defineProps<Props>(), {
  alt: "",
  eager: false,
  deferred: false,
  priority: "auto",
});

const emit = defineEmits<{ settled: [src: string] }>();
const useOriginal = ref(false);
const loadingMode = computed(() => (props.eager ? "eager" : "lazy"));
// Local sources with build-time copies (utils/optImage.ts) skip the IPX resize.
const optimized = computed(() => Boolean(optEntry(props.src)));
// The frame: 364px on phones, 30.375rem (486px, more on 1920px+ screens) above.
const SIZES = "(max-width: 767px) 364px, (min-width: 1920px) 640px, 486px";
watch(() => props.src, () => { useOriginal.value = false; });

function handleError(): void {
  if (useOriginal.value) emit("settled", props.src);
  else useOriginal.value = true;
}
</script>

<template>
  <span
    class="marquee-image-frame relative block overflow-hidden bg-black md:h-[17.0625rem] h-[205px] md:w-[30.375rem] w-[364px] shrink-0 rounded-[20px] md:rounded-[1.875rem] select-none pointer-events-none"
  >
    <OptImage
      v-if="!deferred && optimized"
      :src="src"
      :sizes="SIZES"
      width="480"
      height="270"
      :alt="alt"
      decoding="async"
      :loading="loadingMode"
      :fetchpriority="priority"
      class="absolute inset-0 h-full w-full object-cover"
      draggable="false"
      @load="emit('settled', src)"
      @error="emit('settled', src)"
    />
    <NuxtImg
      v-else-if="!deferred && !useOriginal"
      :src="src"
      width="480"
      height="270"
      sizes="240px md:288px lg:360px xl:432px"
      densities="1x 2x"
      format="webp"
      :quality="80"
      :alt="alt"
      decoding="async"
      :loading="loadingMode"
      :fetchpriority="priority"
      class="absolute inset-0 h-full w-full object-cover"
      draggable="false"
      @load="emit('settled', src)"
      @error="handleError"
    />
    <img
      v-else-if="!deferred"
      :src="src"
      width="480"
      height="270"
      :alt="alt"
      decoding="async"
      :loading="loadingMode"
      :fetchpriority="priority"
      class="absolute inset-0 h-full w-full object-cover"
      draggable="false"
      @load="emit('settled', src)"
      @error="handleError"
    >
  </span>
</template>
