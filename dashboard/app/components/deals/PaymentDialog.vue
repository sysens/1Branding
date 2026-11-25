<script setup lang="ts">
// Adds a payment to a deal: kind, amount and currency, date, method.
import { PAYMENT_KIND_LABELS, PAYMENT_METHOD_LABELS, CURRENCIES, type PaymentKind } from "#shared/utils/constants";
import { tashkentDay } from "#shared/utils/time";

const props = defineProps<{ dealId: number | null; currency?: string; kind?: PaymentKind; remaining?: number | null }>();
const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ saved: [] }>();

const form = reactive({ kind: "prepayment" as PaymentKind, amount: "" as string | number, currency: "USD", paidOn: tashkentDay(), method: "transfer", note: "" });
const busy = ref(false);

watch(open, (value) => {
  if (!value) return;
  Object.assign(form, {
    kind: props.kind ?? "prepayment",
    amount: props.remaining && props.kind === "balance" ? props.remaining : "",
    currency: props.currency ?? "USD",
    paidOn: tashkentDay(),
    method: "transfer",
    note: "",
  });
});

async function save() {
  if (!props.dealId) return;
  busy.value = true;
  const ok = await attempt(() => api(`/api/deals/${props.dealId}/payments`, {
    method: "POST",
    body: { ...form, amount: Number(form.amount), note: form.note || null },
  }), "Платёж внесён");
  busy.value = false;
  if (ok) {
    open.value = false;
    emit("saved");
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Внести платёж</DialogTitle>
        <DialogDescription>Курс ЦБ на дату платежа сохранится вместе с ним.</DialogDescription>
      </DialogHeader>
      <form class="grid gap-4" @submit.prevent="save">
        <Field>
          <FieldLabel>Тип</FieldLabel>
          <ToggleGroup v-model="form.kind" type="single" variant="outline" class="w-full">
            <ToggleGroupItem v-for="(label, key) in PAYMENT_KIND_LABELS" :key="key" :value="key" class="flex-1">{{ label }}</ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <div class="grid grid-cols-[1fr_7rem] gap-2">
          <Field>
            <FieldLabel for="pay-amount">Сумма</FieldLabel>
            <Input id="pay-amount" v-model="form.amount" type="number" min="0.01" step="0.01" inputmode="decimal" required />
          </Field>
          <Field>
            <FieldLabel>Валюта</FieldLabel>
            <NativeSelect v-model="form.currency">
              <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
            </NativeSelect>
          </Field>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <Field>
            <FieldLabel for="pay-date">Дата</FieldLabel>
            <Input id="pay-date" v-model="form.paidOn" type="date" :max="tashkentDay()" required />
          </Field>
          <Field>
            <FieldLabel>Способ</FieldLabel>
            <NativeSelect v-model="form.method">
              <option v-for="(label, key) in PAYMENT_METHOD_LABELS" :key="key" :value="key">{{ label }}</option>
            </NativeSelect>
          </Field>
        </div>
        <Field>
          <FieldLabel for="pay-note">Комментарий</FieldLabel>
          <Input id="pay-note" v-model="form.note" />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Отмена</Button>
          <Button type="submit" :disabled="busy || !form.amount"><Spinner v-if="busy" />Внести</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
