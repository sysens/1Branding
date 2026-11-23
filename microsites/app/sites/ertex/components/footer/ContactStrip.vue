<script setup lang="ts">
import { CONTACT_PHONE } from "../../data/navigation";
import Wrap from "../ui/Wrap.vue";
</script>

<template>
  <Wrap
    as="section"
    aria-labelledby="contact-title"
    class="flex items-center justify-between gap-9 py-[clamp(44px,5cqi,74px)] text-ertex-navy max-[690px]:grid max-[690px]:gap-[17px]"
  >
    <h2 id="contact-title" class="text-[length:clamp(31px,3.3cqi,50px)] font-[505] leading-[1.1] tracking-[-.047em]">
      Готовы вместе с вами<br>воплотить эту идею в жизнь!
    </h2>
    <a
      class="whitespace-nowrap text-[length:clamp(21px,2.2cqi,33px)] font-[530] leading-[1.4] tracking-[-.035em] text-ertex-blue underline decoration-1 underline-offset-[.24em] hover:text-ertex-navy"
      :href="CONTACT_PHONE.href"
      :aria-label="`Позвонить в OneBranding по номеру ${CONTACT_PHONE.label}`"
    >{{ CONTACT_PHONE.label }}</a>
  </Wrap>
</template>
