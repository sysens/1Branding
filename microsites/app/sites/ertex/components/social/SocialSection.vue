<script setup lang="ts">
import FeedStage from "./FeedStage.vue";
import SocialIntro from "./SocialIntro.vue";
import StoryBoard from "./StoryBoard.vue";
</script>

<template>
  <section
    id="social"
    class="isolate scroll-mt-20 bg-[#f8f9fb] px-[clamp(20px,5.5cqi,96px)] py-[clamp(64px,8cqi,128px)] text-[#08162b] max-[390px]:px-4"
    aria-labelledby="er-social-title"
  >
    <SocialIntro />
    <FeedStage />
    <StoryBoard />
  </section>
</template>
