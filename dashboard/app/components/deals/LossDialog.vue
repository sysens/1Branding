<script setup lang="ts">
// Moving a deal to "Lost" asks why (spec 6.2: the reason is required).
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ confirm: [reasonId: number, comment: string]; cancel: [] }>();
const { meta } = useMeta();
const reasonId = ref<string>("");
const comment = ref("");
const reasons = computed(() => (meta.value?.lossReasons ?? []).filter((r) => r.isActive));

watch(open, (value) => {
  if (value) {
    reasonId.value = "";
    comment.value = "";
  }
});

function cancel() {
  open.value = false;
  emit("cancel");
}
function confirm() {
  if (!reasonId.value) return;
  open.value = false;
  emit("confirm", Number(reasonId.value), comment.value);
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => !v && cancel()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Причина отказа</DialogTitle>
        <DialogDescription>Без причины сделку нельзя перевести в «Отказ».</DialogDescription>
      </DialogHeader>
      <RadioGroup v-model="reasonId" class="grid gap-2">
        <Label v-for="reason in reasons" :key="reason.id" :for="`reason-${reason.id}`" class="hover:bg-muted/50 has-data-[state=checked]:border-primary flex items-center gap-3 rounded-md border px-3 py-2.5 font-normal">
          <RadioGroupItem :id="`reason-${reason.id}`" :value="String(reason.id)" />
          {{ reason.name }}
        </Label>
      </RadioGroup>
      <Textarea v-model="comment" placeholder="Комментарий (необязательно)" rows="2" />
      <DialogFooter>
        <Button variant="outline" @click="cancel">Отмена</Button>
        <Button variant="destructive" :disabled="!reasonId" @click="confirm">Перевести в отказ</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
