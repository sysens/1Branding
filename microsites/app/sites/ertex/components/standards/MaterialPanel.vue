<script setup lang="ts">
import { media } from "../../media";
import Disclosure from "../ui/Disclosure.vue";
import GuideCopy from "./GuideCopy.vue";
import StandardsPanel from "./StandardsPanel.vue";
</script>

<template>
  <StandardsPanel id="material" stage-class="overflow-hidden">
    <template #stage>
      <img
        :src="media('gallery/09.webp')"
        loading="lazy"
        alt="Тканая бирка ERTEX Group крупным планом"
        class="absolute h-full w-full object-cover"
      >
    </template>

    <GuideCopy
      title="Фактура вблизи"
      lead="Работайте с матовой бумагой, тканой лентой, вышивкой и окрашенным металлом. На рельефных поверхностях крупный «x» можно передать переплетением, тиснением или тоном самого материала."
    >
      <Disclosure summary="Съёмка и цвет" open>
        <p>Боковой свет подчёркивает переплетение нитей и мягкость сгиба. Для каталога сверяйте оттенок с реальным образцом при нейтральном освещении.</p>
      </Disclosure>
      <Disclosure summary="Производственная проба">
        <p>Проверьте, сохраняются ли просветы между буквами. Сделайте отдельную пробу для тканой этикетки, вышивки и печати. Заранее согласуйте основу, шаг стежка и цвет нити.</p>
      </Disclosure>
    </GuideCopy>
  </StandardsPanel>
</template>
