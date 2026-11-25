<script setup lang="ts">
// Finance (spec 6.7): payments journal, revenue by month against plan,
// gross profit, revenue by service and package, receivables.
import { PAYMENT_KIND_LABELS, PAYMENT_METHOD_LABELS, type PaymentKind, type PaymentMethod } from "#shared/utils/constants";

definePageMeta({ title: "Финансы", filters: ["period", "channels", "services", "currency"] });
useHead({ title: "Финансы · OneBranding" });

type Report = {
  journal: Array<{ id: number; paid_on: string; kind: PaymentKind; amount: number; currency: string; method: PaymentMethod; note: string | null; commission_percent: number; amount_report: number; deal_id: number; deal_title: string | null; client: string | null }>;
  monthly: Array<{ month: string; revenue: number; costs: number; expenses: number; plan: number | null; plan_currency: string | null }>;
  byService: Array<{ service_id: number | null; revenue: number }>;
  receivables: { total: number; items: Array<{ id: number; title: string; client: string | null; currency: string; amount: number; paid: number; remaining: number; remaining_report: number; last_paid: string; expected: string | null }> };
};

const { params, currency } = useFilters();
const { meta } = useMeta();
const { data, pending } = await useAsyncData("finance", () => api<Report>("/api/reports/finance", { query: params.value }), { watch: [params], server: false, lazy: true });
const money = (v: number | null | undefined) => formatMoney(v, currency.value, { compact: currency.value === "UZS" });
const periodRevenue = computed(() => (data.value?.journal ?? []).reduce((s, p) => s + p.amount_report, 0));
const monthly = computed(() => (data.value?.monthly ?? []).map((m) => ({
  ...m,
  gross: m.revenue - m.costs,
  // A plan in the other currency is left out of the chart rather than mixed in.
  planValue: m.plan !== null && m.plan_currency === currency.value ? m.plan : null,
})));
const thisMonth = computed(() => monthly.value[monthly.value.length - 1]);
const serviceName = (id: number | null) => (id ? meta.value?.services.find((s) => s.id === id)?.name ?? `#${id}` : "Без услуги");
const totalByService = computed(() => (data.value?.byService ?? []).reduce((s, r) => s + r.revenue, 0));
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="grid grid-cols-2 gap-4 @3xl/main:grid-cols-4">
      <KpiCard title="Выручка за период" :value="money(periodRevenue)" :hint="`Платежей: ${data?.journal.length ?? 0}`" :loading="pending && !data" />
      <KpiCard title="Валовая прибыль месяца" :value="money(thisMonth ? thisMonth.gross : null)" :hint="thisMonth ? `Себестоимость ${money(thisMonth.costs)}` : ''" :loading="pending && !data" />
      <KpiCard title="План месяца" :value="money(thisMonth?.planValue)" :hint="thisMonth?.planValue ? `Выполнено ${formatPercent((thisMonth.revenue / thisMonth.planValue) * 100, 0)}` : 'Не задан'" :loading="pending && !data" />
      <KpiCard title="Дебиторка" :value="money(data?.receivables.total)" :hint="`Сделок: ${data?.receivables.items.length ?? 0}`" :loading="pending && !data" />
    </div>

    <div class="grid gap-4 @5xl/main:grid-cols-3">
      <Card class="@5xl/main:col-span-2">
        <CardHeader>
          <CardTitle>Выручка по месяцам</CardTitle>
          <CardDescription>Выручка, валовая прибыль, расходы на маркетинг и план</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaTrendChart
            v-if="data"
            :data="monthly"
            date-key="month"
            monthly
            :format="(v) => money(v)"
            :series="[
              { key: 'revenue', label: 'Выручка', color: 'var(--chart-1)', area: true },
              { key: 'gross', label: 'Валовая прибыль', color: 'var(--chart-2)' },
              { key: 'expenses', label: 'Маркетинг', color: 'var(--chart-5)' },
              { key: 'planValue', label: 'План', color: 'var(--muted-foreground)', dashed: true },
            ]"
          />
          <Skeleton v-else class="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>По услугам и пакетам</CardTitle>
          <CardDescription>Платёж за несколько услуг делится поровну</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-2.5">
          <div v-for="row in data?.byService ?? []" :key="row.service_id ?? 0" class="grid gap-1">
            <div class="flex justify-between gap-2 text-sm"><span class="truncate">{{ serviceName(row.service_id) }}</span><span class="tabular-nums">{{ money(row.revenue) }}</span></div>
            <Progress :model-value="totalByService ? (row.revenue / totalByService) * 100 : 0" class="h-1.5" />
          </div>
          <p v-if="data && !data.byService.length" class="text-muted-foreground text-sm">Платежей за период нет.</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Дебиторка</CardTitle>
        <CardDescription>Сделки с предоплатой, где остаток ещё не получен</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          :rows="data?.receivables.items ?? []"
          :loading="pending && !data"
          export-name="debitorka"
          :default-sort="{ key: 'remaining_report', desc: true }"
          empty="Все оплачено"
          :columns="[
            { key: 'title', label: 'Сделка', format: (r) => `#${r.id} ${r.client ?? r.title}` },
            { key: 'amount', label: 'Сумма', align: 'right', format: (r) => formatMoney(r.amount, r.currency) },
            { key: 'paid', label: 'Оплачено', align: 'right', format: (r) => formatMoney(r.paid, r.currency) },
            { key: 'remaining', label: 'Остаток', align: 'right', format: (r) => formatMoney(r.remaining, r.currency) },
            { key: 'remaining_report', label: `Остаток, ${currency}`, align: 'right', format: (r) => money(r.remaining_report) },
            { key: 'last_paid', label: 'Последний платёж', format: (r) => formatDay(r.last_paid) },
            { key: 'expected', label: 'Срок', format: (r) => formatDay(r.expected) },
          ]"
          @row-click="(r) => navigateTo(`/deals/${r.id}`)"
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Журнал платежей</CardTitle></CardHeader>
      <CardContent>
        <DataTable
          :rows="data?.journal ?? []"
          :loading="pending && !data"
          export-name="platezhi"
          :default-sort="{ key: 'paid_on', desc: true }"
          :columns="[
            { key: 'paid_on', label: 'Дата', format: (r) => formatDay(r.paid_on) },
            { key: 'client', label: 'Клиент', format: (r) => r.client ?? r.deal_title ?? `#${r.deal_id}` },
            { key: 'kind', label: 'Тип', value: (r) => PAYMENT_KIND_LABELS[r.kind] },
            { key: 'method', label: 'Способ', value: (r) => PAYMENT_METHOD_LABELS[r.method] },
            { key: 'amount', label: 'Сумма', align: 'right', format: (r) => formatMoney(r.amount, r.currency) },
            { key: 'commission_percent', label: 'Комиссия', align: 'right', format: (r) => (r.commission_percent ? `${r.commission_percent}%` : '—') },
            { key: 'amount_report', label: `Выручка, ${currency}`, align: 'right', format: (r) => money(r.amount_report) },
          ]"
          @row-click="(r) => navigateTo(`/deals/${r.deal_id}`)"
        />
      </CardContent>
    </Card>
  </div>
</template>
