<script setup lang="ts">
import { computed } from "vue";

type Props = {
  src: string;
  alt?: string;
  eager?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  alt: "",
  eager: false,
});

const imageSrc = computed(() => props.src);
const loadingMode = computed(() => (props.eager ? "eager" : "lazy"));
const fetchPriority = computed(() => (props.eager ? "high" : "low"));
</script>

<template>
  <span
    class="marquee-image-frame relative block overflow-hidden bg-black md:h-[17.0625rem] h-[205px] md:w-[30.375rem] w-[364px] shrink-0 rounded-[20px] md:rounded-[1.875rem] select-none pointer-events-none"
  >
    <img
      :src="imageSrc"
      :alt="alt"
      decoding="async"
      :loading="loadingMode"
      :fetchpriority="fetchPriority"
      class="absolute inset-0 h-full w-full object-cover"
      draggable="false"
    />
  </span>
</template>
