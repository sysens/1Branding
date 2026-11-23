<script setup lang="ts">
import { useModal } from "../../composables/useModal";

// A modal for a picture: title bar with a close button, the picture (slot)
// and optional controls under it. Its content is only rendered while open,
// so large originals load when they are asked for.
defineProps<{ title: string }>();
const open = defineModel<boolean>("open", { default: false });

const { dialog, onClose, onClick, close } = useModal(open, { lockScroll: true });
const titleId = useId();
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="max-h-[92dvh] w-[min(1020px,94vw)] overflow-auto border-0 bg-[#071628] p-0 text-white shadow-[0_20px_100px_#0007] backdrop:bg-[#030a14d9]"
    @close="onClose"
    @click="onClick"
  >
    <div class="flex items-center justify-between gap-[15px] px-[17px] py-[10px] text-[16px]">
      <span :id="titleId">{{ title }}</span>
      <button type="button" class="h-9 w-9 text-[28px] leading-none" aria-label="Закрыть" @click="close">×</button>
    </div>
    <template v-if="open">
      <slot />
      <slot name="controls" />
    </template>
  </dialog>
</template>
