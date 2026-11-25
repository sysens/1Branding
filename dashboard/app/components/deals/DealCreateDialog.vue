<script setup lang="ts">
// A deal typed in by hand (Fiverr, a call, a recommendation, Direct). With
// a contact code (OB-xxxx) the source and visits come from the site.
import { CURRENCIES, DEAL_ORIGIN_LABELS, type DealOrigin } from "#shared/utils/constants";

const open = defineModel<boolean>("open", { default: false });
const emit = defineEmits<{ created: [id: number] }>();
const { meta } = useMeta();
const me = useMe();

const blank = () => ({
  name: "", company: "", phone: "", telegram: "", whatsapp: "", instagram: "",
  industryKey: "", serviceIds: [] as number[], amount: "" as string | number, currency: "USD",
  channelId: "", contactCode: "", origin: "manual" as DealOrigin, ownerId: String(me.value?.id ?? ""),
});
const form = reactive(blank());
const busy = ref(false);
watch(open, (value) => value && Object.assign(form, blank()));

const channels = computed(() => (meta.value?.channels ?? []).filter((c) => c.isActive && !["direct", "other"].includes(c.key)));

async function save() {
  busy.value = true;
  const deal = await attempt(() => api<{ id: number }>("/api/deals", {
    method: "POST",
    body: {
      ...form,
      amount: form.amount === "" ? null : Number(form.amount),
      channelId: form.channelId ? Number(form.channelId) : null,
      ownerId: form.ownerId ? Number(form.ownerId) : null,
      industryKey: form.industryKey || null,
      contactCode: form.contactCode.trim() || null,
    },
  }), "Сделка создана");
  busy.value = false;
  if (deal) {
    open.value = false;
    emit("created", deal.id);
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent class="w-full overflow-y-auto sm:max-w-lg">
      <SheetHeader>
        <SheetTitle>Новая сделка</SheetTitle>
        <SheetDescription>Для заказов с Fiverr, звонков, рекомендаций и Direct.</SheetDescription>
      </SheetHeader>
      <form class="grid gap-4 px-4 pb-4" @submit.prevent="save">
        <div class="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel for="d-name">Имя</FieldLabel>
            <Input id="d-name" v-model="form.name" />
          </Field>
          <Field>
            <FieldLabel for="d-company">Компания</FieldLabel>
            <Input id="d-company" v-model="form.company" />
          </Field>
          <Field>
            <FieldLabel for="d-phone">Телефон</FieldLabel>
            <Input id="d-phone" v-model="form.phone" type="tel" placeholder="+998 …" />
          </Field>
          <Field>
            <FieldLabel for="d-tg">Telegram</FieldLabel>
            <Input id="d-tg" v-model="form.telegram" placeholder="@username" />
          </Field>
          <Field>
            <FieldLabel for="d-wa">WhatsApp</FieldLabel>
            <Input id="d-wa" v-model="form.whatsapp" type="tel" />
          </Field>
          <Field>
            <FieldLabel for="d-ig">Instagram</FieldLabel>
            <Input id="d-ig" v-model="form.instagram" placeholder="@username" />
          </Field>
        </div>
        <Field>
          <FieldLabel>Отрасль</FieldLabel>
          <NativeSelect v-model="form.industryKey">
            <option value="">—</option>
            <option v-for="i in (meta?.industries ?? []).filter((x) => x.isActive)" :key="i.id" :value="i.key">{{ i.name }}</option>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel>Услуги / пакет</FieldLabel>
          <ServicePicker v-model="form.serviceIds" />
        </Field>
        <div class="grid grid-cols-[1fr_7rem] gap-2">
          <Field>
            <FieldLabel for="d-amount">Сумма сделки</FieldLabel>
            <Input id="d-amount" v-model="form.amount" type="number" min="0" step="0.01" inputmode="decimal" />
          </Field>
          <Field>
            <FieldLabel>Валюта</FieldLabel>
            <NativeSelect v-model="form.currency">
              <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
            </NativeSelect>
          </Field>
        </div>
        <FieldSeparator>Источник</FieldSeparator>
        <Field>
          <FieldLabel for="d-code">Код обращения</FieldLabel>
          <Input id="d-code" v-model="form.contactCode" placeholder="OB-1042" />
          <FieldDescription>Код из первого сообщения клиента: источник, UTM и визиты подтянутся сами.</FieldDescription>
        </Field>
        <div class="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Канал</FieldLabel>
            <NativeSelect v-model="form.channelId" :disabled="!!form.contactCode.trim()">
              <option value="">Источник неизвестен</option>
              <option v-for="c in channels" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel>Как пришёл</FieldLabel>
            <NativeSelect v-model="form.origin">
              <option v-for="(label, key) in DEAL_ORIGIN_LABELS" :key="key" :value="key">{{ label }}</option>
            </NativeSelect>
          </Field>
        </div>
        <Field>
          <FieldLabel>Ответственный</FieldLabel>
          <NativeSelect v-model="form.ownerId">
            <option v-for="u in meta?.users ?? []" :key="u.id" :value="String(u.id)">{{ u.name }}</option>
          </NativeSelect>
        </Field>
        <SheetFooter class="px-0">
          <Button type="submit" :disabled="busy"><Spinner v-if="busy" />Создать сделку</Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>
