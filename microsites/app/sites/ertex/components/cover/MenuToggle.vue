<script setup lang="ts">
// The round two-line button that opens the phone menu (phones only).
defineProps<{ expanded: boolean; controls: string }>();
defineEmits<{ toggle: [] }>();

const button = ref<HTMLButtonElement>();
defineExpose({ focus: () => button.value?.focus() });
</script>

<template>
  <button
    ref="button"
    type="button"
    class="hidden h-10 w-10 place-content-center gap-[5px] rounded-full border border-[#ffffff44] max-[690px]:grid"
    :aria-controls="controls"
    :aria-expanded="expanded"
    :aria-label="expanded ? 'Закрыть меню' : 'Открыть меню'"
    @click="$emit('toggle')"
  >
    <i class="block h-[1.5px] w-4 bg-white" :class="{ 'translate-y-[3.25px] rotate-45': expanded }" />
    <i class="block h-[1.5px] w-4 bg-white" :class="{ '-translate-y-[3.25px] -rotate-45': expanded }" />
  </button>
</template>
