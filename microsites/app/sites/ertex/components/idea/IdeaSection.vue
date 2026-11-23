<script setup lang="ts">
import { media } from "../../media";
import MediaDialog from "../ui/MediaDialog.vue";
import SectionHeading from "../ui/SectionHeading.vue";
import Wrap from "../ui/Wrap.vue";
import SketchFigure from "./SketchFigure.vue";

const sketchOpen = ref(false);
</script>

<template>
  <Wrap
    id="idea"
    as="section"
    aria-labelledby="idea-title"
    class="grid scroll-m-3 grid-cols-[minmax(260px,.76fr)_minmax(0,1.24fr)] items-center gap-[clamp(36px,7cqi,130px)] py-[clamp(64px,7.2cqi,118px)] max-[900px]:grid-cols-[.88fr_1.12fr] max-[900px]:gap-7 max-[690px]:grid-cols-1 max-[690px]:py-[53px]"
  >
    <div>
      <SectionHeading eyebrow="Происхождение знака" title-id="idea-title">От ткани<br>к знаку</SectionHeading>
      <p class="mt-5 max-w-[455px] text-[length:clamp(18px,1.45cqi,24px)] leading-[1.43] tracking-[-.022em] text-ertex-ink max-[690px]:mt-[14px]">
        Если согнуть две ленты навстречу друг другу, их края встретятся в одной точке. Этот изгиб и стал буквой «x» в названии ERTEX.
      </p>
      <p class="mt-5 max-w-[455px] text-[16px] text-ertex-muted max-[690px]:mt-[14px]">
        На эскизе виден переход от переплетения нитей к чистому контуру. В логотипе мы сохранили точку касания и просветы между дугами. По ним знак узнаётся даже на маленькой бирке.
      </p>
    </div>

    <SketchFigure @open="sketchOpen = true" />

    <MediaDialog v-model:open="sketchOpen" title="Эскиз логотипа">
      <img
        :src="media('ERTEX-Logo-Sketch.png')"
        alt="Карандашное исследование двух тканых дуг и построение фирменной буквы x."
        class="block max-h-[67dvh] w-full bg-white object-contain"
      >
    </MediaDialog>
  </Wrap>
</template>
