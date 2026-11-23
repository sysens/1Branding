<script setup lang="ts">
import { media } from "../../media";
import Wrap from "../ui/Wrap.vue";
import MenuToggle from "./MenuToggle.vue";
import SectionLinks from "./SectionLinks.vue";

const menuOpen = ref(false);
const toggle = ref<InstanceType<typeof MenuToggle>>();

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape" || !menuOpen.value) return;
  menuOpen.value = false;
  toggle.value?.focus();
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Wrap
    as="header"
    class="relative z-[5] flex h-[85px] items-center gap-[clamp(22px,4cqi,72px)] after:absolute after:bottom-0 after:left-[--gap] after:right-[--gap] after:h-px after:bg-[rgba(220,229,240,.22)] max-[690px]:h-[66px] max-[690px]:gap-3"
  >
    <a class="mr-auto" href="#top" aria-label="ERTEX Group, к началу">
      <img :src="media('logo-dark.png')" width="1503" height="476" alt="ERTEX Group" class="h-auto w-[121px] max-[690px]:w-[102px]">
    </a>

    <nav class="flex items-center gap-[30px] max-[900px]:gap-[18px] max-[690px]:hidden" aria-label="Разделы предложения">
      <SectionLinks link-class="text-[14px] font-[530] text-[#e5ecf7] hover:underline hover:underline-offset-[5px]" />
    </nav>

    <MenuToggle ref="toggle" controls="mobile-menu" :expanded="menuOpen" @toggle="menuOpen = !menuOpen" />

    <nav
      v-show="menuOpen"
      id="mobile-menu"
      class="absolute inset-x-0 top-[66px] hidden bg-[#07182c] px-[--gap] pb-[18px] pt-[10px] shadow-[0_18px_22px_#0004] max-[690px]:grid"
      aria-label="Мобильная навигация"
      @click="menuOpen = false"
    >
      <SectionLinks link-class="border-b border-[#65768b55] py-[10px]" />
    </nav>
  </Wrap>
</template>
