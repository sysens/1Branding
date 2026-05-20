<script setup lang="ts">
import { computed, ref, watch } from "vue";

type Props = {
  src: string;
  placeholderSrc: string;
  alt?: string;
  eager?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  alt: "",
  eager: false,
});

const loaded = ref(false);

const imageSrc = computed(() => props.src || props.placeholderSrc);
const placeholderSrc = computed(() => props.placeholderSrc || imageSrc.value);
const hasSeparatePlaceholder = computed(
  () => !!placeholderSrc.value && placeholderSrc.value !== imageSrc.value
);
const loadingMode = computed(() => (props.eager ? "eager" : "lazy"));
const fetchPriority = computed(() => (props.eager ? "high" : "low"));

watch(
  () => imageSrc.value,
  () => {
    loaded.value = false;
  }
);

const markLoaded = () => {
  loaded.value = true;
};
</script>

<template>
  <span
    class="marquee-image-frame relative block overflow-hidden bg-white/10 md:h-[17.0625rem] h-[205px] md:w-[30.375rem] w-[364px] shrink-0 rounded-[20px] md:rounded-[1.875rem] select-none pointer-events-none"
  >
    <img
      v-if="hasSeparatePlaceholder"
      :src="placeholderSrc"
      alt=""
      aria-hidden="true"
      decoding="async"
      loading="eager"
      class="absolute inset-0 h-full w-full scale-105 object-cover blur-xl brightness-75"
      draggable="false"
    />

    <NuxtImg
      :src="imageSrc"
      :alt="alt"
      provider="ipx"
      width="486"
      height="273"
      fit="cover"
      format="webp"
      quality="78"
      decoding="async"
      :loading="loadingMode"
      :fetchpriority="fetchPriority"
      class="absolute inset-0 h-full w-full object-cover transition-[filter,opacity,transform] duration-700 ease-in-out"
      :class="
        loaded
          ? 'opacity-100 blur-0 scale-100'
          : hasSeparatePlaceholder
            ? 'opacity-0 blur-md scale-105'
            : 'opacity-100 blur-md scale-105'
      "
      draggable="false"
      @load="markLoaded"
    />
  </span>
</template>
