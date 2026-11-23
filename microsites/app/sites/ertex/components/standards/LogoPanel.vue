<script setup lang="ts">
import { media } from "../../media";
import Disclosure from "../ui/Disclosure.vue";
import GuideCopy from "./GuideCopy.vue";
import StandardsPanel from "./StandardsPanel.vue";

// The logo in its clear-space box, on a light or a dark background.
const dark = ref(false);
const BACKGROUNDS = [
  { dark: false, label: "Светлый" },
  { dark: true, label: "Тёмный" },
];
</script>

<template>
  <StandardsPanel
    id="logo"
    :stage-class="`flex items-center justify-center border ${dark ? 'border-ertex-navy bg-ertex-navy text-white' : 'border-[#d4dde4] bg-white'}`"
  >
    <template #stage>
      <div class="absolute right-[14px] top-[14px] z-[1] flex rounded-[25px] border border-[#c7d0db] bg-white p-[3px] max-[690px]:right-2 max-[690px]:top-2" aria-label="Фон логотипа">
        <button
          v-for="background in BACKGROUNDS"
          :key="background.label"
          type="button"
          :aria-pressed="background.dark === dark"
          class="rounded-[22px] px-[10px] py-1 text-[12px] font-[530]"
          :class="background.dark === dark ? 'bg-[#e4eaf4] text-ertex-navy' : 'text-[#425060]'"
          @click="dark = background.dark"
        >
          {{ background.label }}
        </button>
      </div>
      <div class="w-[70%] max-w-[550px] border border-dashed border-[#a5b3c4] p-[4.8%] max-[690px]:w-[74%]">
        <img
          :src="media(dark ? 'logo-dark.png' : 'logo-light.png')"
          :alt="dark ? 'Обратная версия логотипа ERTEX Group' : 'Прямая версия логотипа ertex GROUP'"
          width="500"
          height="159"
          class="h-auto w-full"
        >
      </div>
      <span class="absolute bottom-[14px] left-4 text-[12px] tracking-[.02em]" :class="dark ? 'text-[#c2d1e2]' : 'text-[#506073]'">Охранное поле · 1u</span>
    </template>

    <GuideCopy
      title="Одна композиция"
      lead="Белые «er» в синем блоке, «tex» и плашка GROUP образуют единый знак. На светлом фоне «tex» и плашка тёмно-синие. На тёмном «tex» становится белым, а плашка — кобальтовой."
    >
      <Disclosure summary="Свободное пространство" open>
        <p>Рекомендуемый модуль u равен четверти высоты синего блока «er». Оставляйте вокруг всей композиции минимум 1u до текста, шва или края носителя.</p>
      </Disclosure>
      <Disclosure summary="Размер и ограничения">
        <p>Рекомендуемый минимум по ширине — 160 px на экране и 35 мм в печати. Для вышивки начните с пробного образца шириной 50 мм. Проверяйте читаемость GROUP в натуральную величину.</p>
        <p>Используйте мастер-файл целиком. Сохраняйте пропорции, рисунок «x», расстояния и заливки. Для сложного фона предусмотрите однотонную область.</p>
      </Disclosure>
    </GuideCopy>
  </StandardsPanel>
</template>
