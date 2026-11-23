<script setup lang="ts">
import { media } from "../../../media";
import PostCard from "./PostCard.vue";
import PostFoot from "./PostFoot.vue";
import PostLabel from "./PostLabel.vue";
import PostLogo from "./PostLogo.vue";
import PostTitle from "./PostTitle.vue";
</script>

<template>
  <PostCard
    aria-label="Макет поста: Материал для новых идей"
    class="bg-[linear-gradient(142deg,#082966_0%,#004bcf_54%,#0043c1_100%)]"
  >
    <PostLogo />
    <PostLabel class="mt-[13%]">Коллекция тканей</PostLabel>
    <PostTitle class="mt-[4%]">Материал<br>для новых<br><em class="not-italic text-[#a7c6ff]">идей.</em></PostTitle>
    <img
      :src="media('gallery/13.webp')"
      alt="Рулоны светлой и голубой ткани ERTEX Group"
      loading="lazy"
      width="1440"
      height="1019"
      class="absolute bottom-[13%] left-0 z-[1] h-[36%] w-full object-cover object-[center_59%] [clip-path:polygon(0_8%,100%_0,100%_100%,0_100%)]"
    >
    <PostFoot label="Посмотреть коллекцию" />
    <img
      :src="media('x.png')"
      alt=""
      aria-hidden="true"
      loading="lazy"
      class="absolute -right-[30%] top-[7%] z-0 w-[64%] rotate-[4deg] opacity-10 brightness-0 invert"
    >
  </PostCard>
</template>
