<script setup lang="ts">
import CoverArt from "./CoverArt.vue";
import HeroIntro from "./HeroIntro.vue";
import SiteHeader from "./SiteHeader.vue";

// The dark first screen: header, the lit logo and the title. On larger
// screens a gradient from the left keeps the text readable over the picture.
</script>

<template>
  <div
    class="relative isolate overflow-clip rounded-t-[11px] bg-[#020a16] text-white after:absolute after:inset-0 after:-z-[1] after:bg-[linear-gradient(90deg,rgba(2,10,22,.4)_5%,transparent_58%)] max-[690px]:rounded-none max-[690px]:after:hidden"
  >
    <SiteHeader />
    <CoverArt />
    <HeroIntro />
  </div>
</template>
