<script setup lang="ts">
import { SWATCHES } from "../../data/standards";
import { copyText } from "../../utils/clipboard";
import Disclosure from "../ui/Disclosure.vue";
import GuideCopy from "./GuideCopy.vue";
import StandardsPanel from "./StandardsPanel.vue";

// Brand colours; a click on a HEX code copies it.
const feedback = ref("");

async function copy(hex: string) {
  const copied = await copyText(hex);
  feedback.value = copied ? `Скопировано: ${hex}` : `Код для копирования: ${hex}`;
}
</script>

<template>
  <StandardsPanel id="color" stage-class="grid grid-cols-[1.12fr_1fr_.9fr] border border-ertex-rule">
    <template #stage>
      <div
        v-for="swatch in SWATCHES"
        :key="swatch.hex"
        class="flex flex-col items-start justify-between p-5 max-[900px]:p-3"
        :class="swatch.class"
      >
        <span class="text-[15px] font-[590] max-[690px]:text-[14px]">{{ swatch.name }}</span>
        <button type="button" title="Скопировать HEX" class="py-[5px] text-[13px] underline underline-offset-4" @click="copy(swatch.hex)">{{ swatch.hex }}</button>
      </div>
    </template>

    <GuideCopy
      title="Цвет и контраст"
      lead="Кобальт выделяет блок «er» и основные действия в интерфейсе. Тёмно-синий даёт крупным поверхностям глубину. Мягкий белый служит светлой заливкой знака."
    >
      <Disclosure summary="Экран и печать" open>
        <p>HEX-коды взяты из мастер-файлов в RGB. Фон светлой версии — белый #FFFFFF. Для печати, окраски металла и подбора нитей сравните физическую пробу с согласованным образцом.</p>
      </Disclosure>
      <Disclosure summary="Градиент">
        <p>На больших фонах допустим плавный переход от тёмно-синего к кобальту. Внутри букв и плашек используйте сплошные фирменные заливки.</p>
      </Disclosure>
      <p class="mb-5 mt-1 text-[14px] text-ertex-blue" aria-live="polite">{{ feedback }}</p>
    </GuideCopy>
  </StandardsPanel>
</template>
