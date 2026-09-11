<script setup lang="ts">
import type { MacbookKey } from "~/utils/macbook/keyboard";

withDefaults(defineProps<{ keySpec: MacbookKey; height?: number; backlit?: boolean }>(), {
  height: 24,
  backlit: true,
});
</script>

<template>
  <div class="macbook-keycap" :class="{ 'macbook-keycap--backlit': backlit }">
    <div
      class="macbook-keycap__face"
      :class="[keySpec.align && `macbook-keycap__face--${keySpec.align}`]"
      :style="{ width: `${keySpec.width ?? 24}px`, height: `${height}px` }"
    >
      <div class="macbook-keycap__content" :class="{ 'macbook-keycap__content--modifier': keySpec.modifier }">
        <div v-if="keySpec.touchId" class="macbook-keycap__touch-id"><div /></div>
        <component :is="keySpec.icon" v-else-if="keySpec.icon" :stroke-width="1.5" />
        <span v-if="keySpec.secondary">{{ keySpec.secondary }}</span>
        <span v-if="keySpec.label">{{ keySpec.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.macbook-keycap { flex-shrink: 0; transform: translateZ(0); border-radius: 4px; padding: 0.5px; }
.macbook-keycap--backlit { background: #ffffff33; box-shadow: 0 20px 25px -5px #fff, 0 8px 10px -6px #fff; }
.macbook-keycap__face {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3.5px;
  background: #0a090d;
  box-shadow: 0 -0.5px 2px 0 #0d0d0f inset, -0.5px 0 2px 0 #0d0d0f inset;
}
.macbook-keycap__content { display: flex; width: 100%; flex-direction: column; align-items: center; justify-content: center; color: white; font-size: 5px; line-height: 1.5; letter-spacing: 0; }
.macbook-keycap__content svg { width: 6px; height: 6px; flex-shrink: 0; }
.macbook-keycap__content svg + span { margin-top: 4px; }
.macbook-keycap__face--left { align-items: flex-end; justify-content: flex-start; padding: 0 0 2px 4px; }
.macbook-keycap__face--right { align-items: flex-end; justify-content: flex-end; padding: 0 4px 2px 0; }
.macbook-keycap__face--left .macbook-keycap__content { align-items: flex-start; }
.macbook-keycap__face--right .macbook-keycap__content { align-items: flex-end; }
.macbook-keycap__content--modifier { height: 100%; align-items: flex-start; justify-content: space-between; padding: 4px; }
.macbook-keycap__content--modifier svg { align-self: flex-end; }
.macbook-keycap__content--modifier svg + span { margin-top: 0; }
.macbook-keycap__touch-id { width: 16px; height: 16px; padding: 1px; border-radius: 50%; background: linear-gradient(#171717 20%, #000 50%, #171717 95%); }
.macbook-keycap__touch-id > div { width: 100%; height: 100%; border-radius: 50%; background: black; }
</style>
