<script setup lang="ts">
import { APPLICATION_GUIDES } from "../../data/guides";
import Disclosure from "../ui/Disclosure.vue";
</script>

<template>
  <div
    class="mt-[45px] grid grid-cols-3 items-start gap-6 border-b border-ertex-rule max-[900px]:gap-4 max-[690px]:mt-[30px] max-[690px]:block"
  >
    <Disclosure v-for="guide in APPLICATION_GUIDES" :key="guide.title" :summary="guide.title" large>
      <p>{{ guide.text }}</p>
    </Disclosure>
  </div>
</template>
