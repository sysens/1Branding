<script setup lang="ts">
// A 4:5 feed post. Text inside is sized in cqw, so a post scales as a picture
// would. Its background and text colour come from the caller's class.
</script>

<template>
  <article
    class="relative isolate aspect-[4/5] overflow-hidden p-[8%] shadow-[0_20px_35px_#0003] [container-type:inline-size] motion-safe:transition-[transform,box-shadow] motion-safe:duration-500 motion-safe:ease-[ease] motion-safe:group-hover/piece:-translate-y-[5px] motion-safe:group-hover/piece:shadow-[0_25px_40px_#0005]"
  >
    <slot />
  </article>
</template>
