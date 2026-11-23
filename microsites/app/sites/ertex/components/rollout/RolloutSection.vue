<script setup lang="ts">
import { ROLLOUT_STEPS } from "../../data/guides";
import SectionHeading from "../ui/SectionHeading.vue";
import Wrap from "../ui/Wrap.vue";
import RolloutStep from "./RolloutStep.vue";
</script>

<template>
  <Wrap
    id="next"
    as="section"
    aria-labelledby="next-title"
    class="grid grid-cols-[.92fr_1.08fr] gap-[10%] py-[clamp(64px,7cqi,124px)] max-[690px]:grid-cols-1 max-[690px]:gap-[27px] max-[690px]:py-[53px]"
  >
    <div>
      <SectionHeading eyebrow="Внедрение" title-id="next-title">С чего начать</SectionHeading>
      <p class="mt-6 max-w-[330px] text-ertex-muted max-[690px]:mt-[14px]">Начнём с комплекта, который можно передать покупателю на первой встрече.</p>
    </div>
    <ol class="[counter-reset:step]">
      <RolloutStep v-for="step in ROLLOUT_STEPS" :key="step.title" :title="step.title" :text="step.text" />
    </ol>
  </Wrap>
</template>
