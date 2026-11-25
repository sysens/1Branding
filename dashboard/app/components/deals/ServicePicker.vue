<script setup lang="ts">
// Several services and packages at once (a popover of checkboxes).
import { Check, ChevronDown } from "@lucide/vue";

const model = defineModel<number[]>({ default: () => [] });
const { meta } = useMeta();
const list = computed(() => (meta.value?.services ?? []).filter((s) => s.isActive || model.value.includes(s.id)));
const label = computed(() => {
  const names = list.value.filter((s) => model.value.includes(s.id)).map((s) => s.name);
  return names.length ? names.join(", ") : "Не выбрано";
});
const toggle = (id: number) => {
  model.value = model.value.includes(id) ? model.value.filter((x) => x !== id) : [...model.value, id];
};
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" class="w-full justify-between font-normal">
        <span class="truncate" :class="!model.length && 'text-muted-foreground'">{{ label }}</span>
        <ChevronDown class="text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-(--reka-popover-trigger-width) p-0" align="start">
      <Command>
        <CommandInput placeholder="Найти услугу…" />
        <CommandList>
          <CommandEmpty>Ничего не найдено</CommandEmpty>
          <CommandGroup heading="Услуги">
            <CommandItem v-for="s in list.filter((x) => x.kind === 'service')" :key="s.id" :value="s.name" @select="toggle(s.id)">
              {{ s.name }}
              <Check v-if="model.includes(s.id)" class="ml-auto" />
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Пакеты">
            <CommandItem v-for="s in list.filter((x) => x.kind === 'package')" :key="s.id" :value="s.name" @select="toggle(s.id)">
              {{ s.name }}
              <span v-if="s.basePrice" class="text-muted-foreground ml-auto text-xs">{{ formatMoney(s.basePrice, s.currency) }}</span>
              <Check v-if="model.includes(s.id)" :class="!s.basePrice && 'ml-auto'" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
