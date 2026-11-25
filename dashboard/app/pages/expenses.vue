<script setup lang="ts">
// Expenses (spec 6.8): the marketing spend journal (from the ads APIs and
// typed in by hand) and the state of every connection.
import { Plus, RefreshCw, Trash2 } from "@lucide/vue";
import { CURRENCIES } from "#shared/utils/constants";
import { tashkentDay } from "#shared/utils/time";

definePageMeta({ title: "Расходы", filters: ["period", "channels", "currency"] });
useHead({ title: "Расходы · OneBranding" });

type Row = { id: number; spent_on: string; channel_id: number; campaign_id: number | null; campaign: string | null; placement: string | null; amount: number; currency: string; source: "api" | "manual"; impressions: number | null; clicks: number | null; comment: string | null; amount_report: number; author: string | null };
type Status = { provider: string; label: string; lastSuccessAt: string | null; lastAttemptAt: string | null; lastError: string | null };

const { params, currency } = useFilters();
const { meta, channelName, canEdit } = useMeta();
const { data, pending, refresh } = await useAsyncData("expenses", () => api<{ journal: Row[]; integrations: Status[] }>("/api/expenses", { query: params.value }), { watch: [params], server: false, lazy: true });
const total = computed(() => (data.value?.journal ?? []).reduce((s, r) => s + r.amount_report, 0));
const byChannel = computed(() => {
  const map = new Map<number, number>();
  for (const r of data.value?.journal ?? []) map.set(r.channel_id, (map.get(r.channel_id) ?? 0) + r.amount_report);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
});

const open = ref(false);
const form = reactive({ spentOn: tashkentDay(), channelId: "", campaignId: "", amount: "" as string | number, currency: "USD", comment: "" });
const manualChannels = computed(() => (meta.value?.channels ?? []).filter((c) => c.isActive && c.costMode !== "none"));
async function save() {
  const ok = await attempt(() => api("/api/expenses", {
    method: "POST",
    body: { ...form, channelId: Number(form.channelId), campaignId: form.campaignId ? Number(form.campaignId) : null, amount: Number(form.amount), comment: form.comment || null },
  }), "Расход добавлен");
  if (ok) {
    open.value = false;
    Object.assign(form, { amount: "", comment: "", campaignId: "" });
    await refresh();
  }
}
const remove = async (id: number) => {
  if (!confirm("Удалить расход?")) return;
  await attempt(() => api(`/api/expenses/${id}`, { method: "DELETE" }), "Удалено");
  await refresh();
};
const syncing = ref(false);
async function sync() {
  syncing.value = true;
  const result = await attempt(() => api<{ report: Record<string, string> }>("/api/settings/actions", { method: "POST", body: { action: "sync_ads", days: 7 } }));
  syncing.value = false;
  if (result) {
    const { toast } = await import("vue-sonner");
    toast.success("Расходы обновлены", { description: Object.entries(result.report).map(([k, v]) => `${k}: ${v}`).join(" · ") });
    await refresh();
  }
}
const ago = (value: string | null) => (value ? formatDateTime(value) : "никогда");
const healthy = (s: Status) => !!s.lastSuccessAt && Date.now() - Date.parse(s.lastSuccessAt) < 26 * 3600_000 && !s.lastError;
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="flex flex-wrap items-center justify-end gap-2">
      <Button v-if="canEdit" variant="outline" size="sm" :disabled="syncing" @click="sync"><RefreshCw :class="syncing && 'animate-spin'" />Обновить из рекламных кабинетов</Button>
      <Button v-if="canEdit" size="sm" @click="open = true"><Plus />Расход вручную</Button>
    </div>

    <div class="grid gap-4 @5xl/main:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Расходы за период</CardDescription>
          <CardTitle class="text-3xl tabular-nums">{{ formatMoney(total, currency, { compact: currency === "UZS" }) }}</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-2">
          <div v-for="[channelId, amount] in byChannel" :key="channelId" class="flex justify-between text-sm">
            <span>{{ channelName(channelId) }}</span>
            <span class="tabular-nums">{{ formatMoney(amount, currency, { compact: currency === "UZS" }) }}</span>
          </div>
        </CardContent>
      </Card>
      <Card class="@5xl/main:col-span-2">
        <CardHeader>
          <CardTitle>Подключения</CardTitle>
          <CardDescription>Когда данные обновлялись последний раз и были ли ошибки</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-2 @xl/main:grid-cols-2">
          <div v-for="s in data?.integrations ?? []" :key="s.provider" class="flex items-start gap-3 rounded-lg border p-3">
            <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="healthy(s) ? 'bg-emerald-500' : s.lastError ? 'bg-red-500' : 'bg-muted-foreground/40'" />
            <div class="min-w-0 text-sm">
              <div class="font-medium">{{ s.label }}</div>
              <div class="text-muted-foreground text-xs">Успешно: {{ ago(s.lastSuccessAt) }}</div>
              <div v-if="s.lastError" class="text-xs break-words text-red-600 dark:text-red-400">{{ s.lastError }}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader><CardTitle>Журнал расходов</CardTitle></CardHeader>
      <CardContent>
        <DataTable
          :rows="data?.journal ?? []"
          :loading="pending && !data"
          export-name="raskhody"
          :default-sort="{ key: 'spent_on', desc: true }"
          :columns="[
            { key: 'spent_on', label: 'Дата', format: (r) => formatDay(r.spent_on) },
            { key: 'channel_id', label: 'Канал', value: (r) => channelName(r.channel_id) },
            { key: 'campaign', label: 'Кампания / блогер / посев', format: (r) => r.campaign ?? r.comment ?? '—' },
            { key: 'amount', label: 'Сумма', align: 'right', format: (r) => formatMoney(r.amount, r.currency) },
            { key: 'amount_report', label: currency, align: 'right', format: (r) => formatMoney(r.amount_report, currency) },
            { key: 'impressions', label: 'Показы', align: 'right', format: (r) => (r.impressions ? formatNumber(r.impressions) : '—') },
            { key: 'clicks', label: 'Клики', align: 'right', format: (r) => (r.clicks ? formatNumber(r.clicks) : '—') },
            { key: 'source', label: 'Откуда', value: (r) => (r.source === 'api' ? 'API' : `Вручную${r.author ? `, ${r.author}` : ''}`) },
            { key: 'actions', label: '', sortable: false },
          ]"
        >
          <template #actions="{ row }">
            <Button v-if="row.source === 'manual' && canEdit" variant="ghost" size="icon-xs" aria-label="Удалить" @click.stop="remove(row.id)"><Trash2 /></Button>
          </template>
        </DataTable>
      </CardContent>
    </Card>

    <Dialog v-model:open="open">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Расход вручную</DialogTitle>
          <DialogDescription>Блогеры, посевы, платное продвижение на площадках.</DialogDescription>
        </DialogHeader>
        <form class="grid gap-4" @submit.prevent="save">
          <div class="grid grid-cols-2 gap-2">
            <Field><FieldLabel>Дата</FieldLabel><Input v-model="form.spentOn" type="date" required /></Field>
            <Field>
              <FieldLabel>Канал</FieldLabel>
              <NativeSelect v-model="form.channelId" required>
                <option value="" disabled>Выберите</option>
                <option v-for="c in manualChannels" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
              </NativeSelect>
            </Field>
          </div>
          <div class="grid grid-cols-[1fr_7rem] gap-2">
            <Field><FieldLabel>Сумма</FieldLabel><Input v-model="form.amount" type="number" min="0.01" step="0.01" required /></Field>
            <Field><FieldLabel>Валюта</FieldLabel><NativeSelect v-model="form.currency"><option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option></NativeSelect></Field>
          </div>
          <Field>
            <FieldLabel>Комментарий</FieldLabel>
            <Input v-model="form.comment" placeholder="Блогер, канал посева…" />
            <FieldDescription>Чтобы привязать к лидам, создайте кампанию в генераторе UTM-ссылок и укажите её там.</FieldDescription>
          </Field>
          <DialogFooter><Button type="submit" :disabled="!form.channelId || !form.amount">Добавить</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
