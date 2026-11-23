<script setup lang="ts">
import type { StandardTab } from "../../data/standards";
import SectionHeading from "../ui/SectionHeading.vue";
import Wrap from "../ui/Wrap.vue";
import ColorPanel from "./ColorPanel.vue";
import LogoPanel from "./LogoPanel.vue";
import MaterialPanel from "./MaterialPanel.vue";
import StandardsTabs from "./StandardsTabs.vue";
import TypePanel from "./TypePanel.vue";

const tab = ref<StandardTab>("logo");
</script>

<template>
  <section
    id="standards"
    class="scroll-m-3 bg-ertex-wash py-[clamp(64px,7.2cqi,118px)] max-[690px]:py-[53px]"
    aria-labelledby="standards-title"
  >
    <Wrap>
      <SectionHeading eyebrow="Руководство" title-id="standards-title">Стандарты стиля</SectionHeading>
      <StandardsTabs v-model="tab" />
      <LogoPanel v-show="tab === 'logo'" />
      <ColorPanel v-show="tab === 'color'" />
      <TypePanel v-show="tab === 'type'" />
      <MaterialPanel v-show="tab === 'material'" />
    </Wrap>
  </section>
</template>
