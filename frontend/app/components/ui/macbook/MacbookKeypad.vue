<script setup lang="ts">
import { ChevronUp, ChevronLeft, ChevronDown, ChevronRight } from "lucide-vue-next";
import { keyboardRows } from "~/utils/macbook/keyboard";
import MacbookKeycap from "./MacbookKeycap.vue";
</script>

<template>
  <div class="macbook-keypad">
    <div v-for="(row, index) in keyboardRows" :key="index" class="macbook-key-row">
      <MacbookKeycap v-for="(key, column) in row" :key="column" :key-spec="key" />
      <div v-if="index === keyboardRows.length - 1" class="macbook-arrows">
        <MacbookKeycap :key-spec="{ label: '', icon: ChevronUp }" :height="12" />
        <div class="macbook-arrows__bottom">
          <MacbookKeycap v-for="(icon, arrow) in [ChevronLeft, ChevronDown, ChevronRight]" :key="arrow" :key-spec="{ label: '', icon }" :height="12" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.macbook-keypad { height: 100%; margin-inline: 0.25rem; padding: 0.25rem; transform: translateZ(0); border-radius: 0.375rem; background: #050505; }
.macbook-key-row { display: flex; width: 100%; flex-shrink: 0; gap: 0.125rem; margin-bottom: 0.125rem; }
.macbook-arrows { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; width: 4.9rem; height: 1.5rem; margin-top: 0.125rem; padding: 0.5px; border-radius: 0.25rem; }
.macbook-arrows__bottom { display: flex; }
</style>
