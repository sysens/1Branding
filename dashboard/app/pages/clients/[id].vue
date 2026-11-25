<script setup lang="ts">
// A client: contacts, notes, all deals; merging a duplicate into it.
import { ArrowLeft } from "@lucide/vue";
import { toast } from "vue-sonner";

definePageMeta({ title: "Клиент" });

type Client = { id: number; name: string; contactName: string | null; phone: string | null; telegram: string | null; whatsapp: string | null; instagram: string | null; email: string | null; industryId: number | null; firstChannelId: number | null; notes: string | null; createdAt: string };
type Data = { client: Client; deals: Array<{ id: number; title: string | null; amount: number | null; currency: string; stage: string; stageKind: string; createdAt: string; isRepeat: boolean }> };

const route = useRoute();
const id = Number(route.params.id);
const { meta, channelName, canEdit } = useMeta();
const { data, refresh } = await useAsyncData(`client-${id}`, () => api<Data>(`/api/clients/${id}`), { server: false, lazy: true });
useHead({ title: computed(() => `${data.value?.client.name ?? "Клиент"} · OneBranding`) });

const form = reactive({ name: "", contactName: "", phone: "", telegram: "", whatsapp: "", instagram: "", email: "", industryId: "", notes: "" });
watch(data, (value) => {
  if (!value) return;
  const c = value.client;
  Object.assign(form, { name: c.name, contactName: c.contactName ?? "", phone: c.phone ?? "", telegram: c.telegram ?? "", whatsapp: c.whatsapp ?? "", instagram: c.instagram ?? "", email: c.email ?? "", industryId: c.industryId ? String(c.industryId) : "", notes: c.notes ?? "" });
}, { immediate: true });

async function save() {
  await attempt(() => api(`/api/clients/${id}`, {
    method: "PATCH",
    body: { ...form, contactName: form.contactName || null, phone: form.phone || null, telegram: form.telegram || null, whatsapp: form.whatsapp || null, instagram: form.instagram || null, email: form.email || null, industryId: form.industryId ? Number(form.industryId) : null, notes: form.notes || null },
  }), "Сохранено");
  await refresh();
}

const duplicates = ref<Array<{ id: number; name: string; phone: string | null; telegram: string | null }>>([]);
const duplicateQuery = ref("");
async function findDuplicates() {
  if (duplicateQuery.value.trim().length < 2) return;
  duplicates.value = (await api<Array<{ id: number; name: string; phone: string | null; telegram: string | null }>>("/api/clients", { query: { q: duplicateQuery.value } })).filter((c) => c.id !== id).slice(0, 8);
}
async function merge(duplicateId: number) {
  if (!confirm("Перенести сделки дубля в этого клиента и удалить дубль?")) return;
  const ok = await attempt(() => api(`/api/clients/${id}/merge`, { method: "POST", body: { duplicateId } }));
  if (ok) {
    toast.success("Клиенты объединены");
    duplicates.value = [];
    await refresh();
  }
}
</script>

<template>
  <div v-if="!data" class="grid gap-4"><Skeleton class="h-20 w-full" /><Skeleton class="h-80 w-full" /></div>
  <div v-else class="flex flex-col gap-4 md:gap-6">
    <div class="flex items-center gap-3">
      <Button variant="ghost" size="icon-sm" as-child><NuxtLink to="/clients" aria-label="К клиентам"><ArrowLeft /></NuxtLink></Button>
      <div>
        <h2 class="text-xl font-semibold">{{ data.client.name }}</h2>
        <p class="text-muted-foreground text-sm">Первое обращение: {{ channelName(data.client.firstChannelId) }} · с {{ formatDay(data.client.createdAt.slice(0, 10)) }}</p>
      </div>
    </div>
    <div class="grid gap-4 @5xl/main:grid-cols-3">
      <Card class="@5xl/main:col-span-2">
        <CardHeader><CardTitle>Сделки</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            :rows="data.deals"
            :row-key="(r) => r.id"
            :columns="[
              { key: 'id', label: '#', format: (r) => `#${r.id}` },
              { key: 'stage', label: 'Этап' },
              { key: 'amount', label: 'Сумма', align: 'right', format: (r) => (r.amount !== null ? formatMoney(r.amount, r.currency) : '—') },
              { key: 'isRepeat', label: 'Повторная', format: (r) => (r.isRepeat ? 'Да' : '') },
              { key: 'createdAt', label: 'Создана', format: (r) => formatDateTime(r.createdAt) },
            ]"
            @row-click="(r) => navigateTo(`/deals/${r.id}`)"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Данные клиента</CardTitle></CardHeader>
        <CardContent>
          <form class="grid gap-3" @submit.prevent="save">
            <Field><FieldLabel>Компания</FieldLabel><Input v-model="form.name" :disabled="!canEdit" /></Field>
            <Field><FieldLabel>Контактное лицо</FieldLabel><Input v-model="form.contactName" :disabled="!canEdit" /></Field>
            <div class="grid grid-cols-2 gap-2">
              <Field><FieldLabel>Телефон</FieldLabel><Input v-model="form.phone" :disabled="!canEdit" /></Field>
              <Field><FieldLabel>Telegram</FieldLabel><Input v-model="form.telegram" :disabled="!canEdit" /></Field>
              <Field><FieldLabel>WhatsApp</FieldLabel><Input v-model="form.whatsapp" :disabled="!canEdit" /></Field>
              <Field><FieldLabel>Instagram</FieldLabel><Input v-model="form.instagram" :disabled="!canEdit" /></Field>
            </div>
            <Field><FieldLabel>E-mail</FieldLabel><Input v-model="form.email" :disabled="!canEdit" /></Field>
            <Field>
              <FieldLabel>Отрасль</FieldLabel>
              <NativeSelect v-model="form.industryId" :disabled="!canEdit"><option value="">—</option><option v-for="i in meta?.industries ?? []" :key="i.id" :value="String(i.id)">{{ i.name }}</option></NativeSelect>
            </Field>
            <Field><FieldLabel>Заметки</FieldLabel><Textarea v-model="form.notes" rows="3" :disabled="!canEdit" /></Field>
            <Button v-if="canEdit" type="submit">Сохранить</Button>
          </form>
        </CardContent>
      </Card>
    </div>
    <Card v-if="canEdit">
      <CardHeader>
        <CardTitle>Объединить дубль</CardTitle>
        <CardDescription>Найдите дубль этого клиента: его сделки перейдут сюда, пустые контакты заполнятся, дубль удалится.</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-3">
        <form class="flex gap-2" @submit.prevent="findDuplicates">
          <Input v-model="duplicateQuery" placeholder="Название, телефон или Telegram дубля" class="max-w-sm" />
          <Button type="submit" variant="outline">Найти</Button>
        </form>
        <div v-for="c in duplicates" :key="c.id" class="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
          <span>{{ c.name }} <span class="text-muted-foreground">{{ c.phone ?? (c.telegram ? `@${c.telegram}` : "") }}</span></span>
          <Button size="sm" variant="outline" @click="merge(c.id)">Объединить</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
