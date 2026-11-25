<script setup lang="ts" generic="T extends { id?: number | null; name: string; isActive?: boolean }">
// A list of named rows to rename, reorder, add and remove; each row can
// carry extra fields through the "extra" slot.
import { ArrowDown, ArrowUp, Plus, Trash2 } from "@lucide/vue";

const props = defineProps<{ newItem: () => T; canRemove?: (item: T) => boolean; addLabel?: string }>();
const items = defineModel<T[]>({ required: true });
defineSlots<{ extra?: (props: { item: T; index: number }) => unknown }>();

const move = (index: number, by: number) => {
  const list = [...items.value];
  const [item] = list.splice(index, 1);
  list.splice(index + by, 0, item!);
  items.value = list;
};
const remove = (index: number) => {
  items.value = items.value.filter((_, i) => i !== index);
};
</script>

<template>
  <div class="grid gap-2">
    <div v-for="(item, index) in items" :key="item.id ?? `new-${index}`" class="flex flex-wrap items-center gap-2 rounded-lg border p-2">
      <div class="flex flex-col">
        <Button type="button" variant="ghost" size="icon-xs" :disabled="index === 0" aria-label="Выше" @click="move(index, -1)"><ArrowUp /></Button>
        <Button type="button" variant="ghost" size="icon-xs" :disabled="index === items.length - 1" aria-label="Ниже" @click="move(index, 1)"><ArrowDown /></Button>
      </div>
      <Input v-model="item.name" class="min-w-40 flex-1" required />
      <slot name="extra" :item="item" :index="index" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Удалить"
        :disabled="props.canRemove ? !props.canRemove(item) : false"
        @click="remove(index)"
      >
        <Trash2 />
      </Button>
    </div>
    <Button type="button" variant="outline" size="sm" class="justify-self-start" @click="items = [...items, props.newItem()]"><Plus />{{ addLabel ?? "Добавить" }}</Button>
  </div>
</template>
