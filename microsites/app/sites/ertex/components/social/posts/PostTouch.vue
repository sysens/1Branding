<script setup lang="ts">
import { media } from "../../../media";
import PostCard from "./PostCard.vue";
import PostFoot from "./PostFoot.vue";
import PostLabel from "./PostLabel.vue";
import PostLogo from "./PostLogo.vue";
import PostTitle from "./PostTitle.vue";
</script>

<template>
  <PostCard aria-label="Макет поста: Качество на ощупь" class="bg-[#11233b]">
    <img
      :src="media('proposal/social-weave.webp')"
      alt="Руки изучают фактуру тёмно-синей ткани в рулоне"
      loading="lazy"
      width="1122"
      height="1402"
      class="absolute inset-0 z-0 h-full w-full object-cover object-[59%_center]"
    >
    <div class="absolute inset-0 z-[1] bg-[linear-gradient(180deg,#04162f9c,transparent_47%,#04142cb3)]" aria-hidden="true" />
    <PostLogo />
    <div class="relative z-[2] mt-[15%]">
      <PostLabel class="mb-[5%]">Ближе к материалу</PostLabel>
      <PostTitle>Качество<br>на ощупь.</PostTitle>
    </div>
    <PostFoot label="Фактура вблизи" />
  </PostCard>
</template>
