<script setup lang="ts">
// Clients (spec 6.6): deals, lifetime revenue, first and last purchase,
// the channel of the first contact, repeat clients.
import { Search } from "@lucide/vue";
import { refDebounced } from "@vueuse/core";

definePageMeta({ title: "Клиенты", filters: ["currency"] });
useHead({ title: "Клиенты · OneBranding" });

type ClientRow = {
  id: number; name: string; contact_name: string | null; phone: string | null; telegram: string | null; industry: string | null;
  first_channel_id: number | null; deals: number; paid_deals: number; ltv: number; first_purchase: string | null; last_purchase: string | null; created_at: string;
};
const { currency } = useFilters();
const { channelName } = useMeta();
const search = ref("");
const q = refDebounced(search, 300);
const { data, pending } = await useAsyncData("clients", () => api<ClientRow[]>("/api/clients", { query: { q: q.value || undefined, currency: currency.value } }), { watch: [q, currency], server: false, lazy: true });
const repeatOnly = ref(false);
const rows = computed(() => (data.value ?? []).filter((r) => !repeatOnly.value || r.paid_deals > 1));
const paying = computed(() => (data.value ?? []).filter((r) => r.ltv > 0));
const avgLtv = computed(() => (paying.value.length ? paying.value.reduce((s, r) => s + r.ltv, 0) / paying.value.length : null));
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="grid grid-cols-2 gap-4 @3xl/main:grid-cols-4">
      <KpiCard title="Клиентов" :value="formatNumber(data?.length)" :loading="pending && !data" />
      <KpiCard title="Оплативших" :value="formatNumber(paying.length)" :loading="pending && !data" />
      <KpiCard title="Повторных" :value="formatNumber((data ?? []).filter((r) => r.paid_deals > 1).length)" :loading="pending && !data" />
      <KpiCard title="Средний LTV" :value="formatMoney(avgLtv, currency)" :loading="pending && !data" />
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative w-full sm:w-72">
        <Search class="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input v-model="search" placeholder="Компания, имя, телефон, Telegram" class="h-8 pl-8" />
      </div>
      <Label class="flex items-center gap-2 text-sm font-normal"><Switch v-model="repeatOnly" />Только повторные</Label>
    </div>
    <DataTable
      :rows="rows"
      :loading="pending && !data"
      :row-key="(r) => r.id"
      export-name="klienty"
      :default-sort="{ key: 'ltv', desc: true }"
      empty="Клиентов не найдено"
      :columns="[
        { key: 'name', label: 'Компания' },
        { key: 'contact_name', label: 'Контакт', format: (r) => r.contact_name ?? '—' },
        { key: 'industry', label: 'Отрасль', format: (r) => r.industry ?? '—' },
        { key: 'deals', label: 'Сделок', align: 'right' },
        { key: 'ltv', label: 'Выручка (LTV)', align: 'right', format: (r) => formatMoney(r.ltv, currency) },
        { key: 'first_purchase', label: 'Первая покупка', format: (r) => formatDay(r.first_purchase) },
        { key: 'last_purchase', label: 'Последняя', format: (r) => formatDay(r.last_purchase) },
        { key: 'first_channel_id', label: 'Первое обращение', value: (r) => channelName(r.first_channel_id) },
        { key: 'repeat', label: 'Повторный', value: (r) => (r.paid_deals > 1 ? 'Да' : '') },
      ]"
      @row-click="(r) => navigateTo(`/clients/${r.id}`)"
    />
  </div>
</template>
