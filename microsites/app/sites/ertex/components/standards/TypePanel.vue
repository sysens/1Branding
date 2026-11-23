<script setup lang="ts">
import Disclosure from "../ui/Disclosure.vue";
import GuideCopy from "./GuideCopy.vue";
import StandardsPanel from "./StandardsPanel.vue";
</script>

<template>
  <StandardsPanel id="type" stage-class="flex flex-col justify-between bg-ertex-navy p-[27px] text-white">
    <template #stage>
      <span>Inter</span>
      <p class="text-[length:clamp(38px,5.8cqi,95px)] font-[480] tracking-[-.065em]">Аа Бб Вв</p>
      <div class="text-[14px] text-[#d6e6ff]">Латиница · Кириллица · 0123456789</div>
    </template>

    <GuideCopy
      title="Шрифт интерфейса"
      lead="Для каталога, сайта и CRM выбран Inter. Прямое начертание хорошо передаёт артикулы, названия тканей и размеры на русском и латинице."
    >
      <Disclosure summary="Иерархия" open>
        <p>Заголовки — Inter Medium, веса 500. Для основного текста используйте Regular, 400, размер от 16 px и межстрочный интервал около 150%. Подписи к образцам набирайте от 14 px.</p>
      </Disclosure>
      <Disclosure summary="Набор названий">
        <p>В тексте пишите ERTEX Group. Графическое начертание на логотипе берите из файла. Для длинных описаний используйте обычный регистр и выравнивание по левому краю.</p>
      </Disclosure>
    </GuideCopy>
  </StandardsPanel>
</template>
