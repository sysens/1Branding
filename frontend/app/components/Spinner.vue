<script setup lang="ts">
type Props = {
  src: string;
  size?: number;
};

const props = withDefaults(defineProps<Props>(), {
  size: 542,
});
</script>

<template>
  <div class="fixed inset-0 grid place-items-center h-[100dvh] z-[13123213123123123]">
    <div class="absolute inset-0 bg-black backdrop-blur-md"></div>

    <div
      class="relative"
      :style="{
        width: `min(${props.size}px, 80vw, 260px)`,
        height: `min(${props.size}px, 80vw, 260px)`,
      }"
    >
      <video
        class="h-full w-full rounded-full object-cover"
        :src="props.src"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
      ></video>
    </div>
  </div>
</template>
