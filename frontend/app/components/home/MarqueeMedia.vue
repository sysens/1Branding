<script setup lang="ts">
import { computed, ref, watch } from "vue";

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
    <NuxtImg
      v-if="!deferred && !useOriginal"
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
    />
  </span>
</template>
