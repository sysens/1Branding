<script setup lang="ts">
// Сводка (spec 6.1): KPI tiles against the previous period, the end-to-end
// funnel, leads per day by channel, the month's plan and fact, channels.
definePageMeta({ title: "Сводка", filters: ["period", "channels", "services", "currency"] });
useHead({ title: "Сводка · OneBranding" });

type Kpis = {
  visits: number; leads: number; siteLeads: number; siteCr: number | null; expenses: number; cpl: number | null;
  newClients: number; cac: number | null; revenue: number; averageCheck: number | null; romi: number | null; roi: number | null;
  receivables: number; responseMedianMinutes: number | null; responseFastShare: number | null; grossProfit: number;
  repeatShare: number | null; cycleDays: number | null; ltv: number | null; ltvToCac: number | null; salesTotal: number;
};
type ChannelRow = { key: number | null; expenses: number; leads: number; cpl: number | null; clients: number; revenue: number; cac: number | null; romi: number | null };
type Summary = {
  kpis: Kpis;
  previous: Kpis;
  previousPeriod: { from: string; to: string };
  funnel: Array<{ key: string; name: string; count: number }>;
  leadsByDay: Array<{ day: string; channel_id: number | null; n: number }>;
  plan: { month: string; leadsPlan: number | null; leadsFact: number; revenuePlan: number | null; revenueFact: number };
  channels: ChannelRow[];
  lossReasons: Array<{ reason: string | null; stage: string | null; n: number }>;
};

const { params, currency, range } = useFilters();
const { channelName, channelColor } = useMeta();
const { data, pending } = await useAsyncData("summary", () => api<Summary>("/api/reports/summary", { query: params.value }), { watch: [params], server: false, lazy: true });

const k = computed(() => data.value?.kpis);
const p = computed(() => data.value?.previous);
const money = (value: number | null | undefined) => formatMoney(value, currency.value, { compact: currency.value === "UZS" });
const change = (key: keyof Kpis) => delta(k.value?.[key] as number | null, p.value?.[key] as number | null);

const tiles = computed(() => [
  { title: "Визиты", value: formatNumber(k.value?.visits), change: change("visits") },
  { title: "Лиды", value: formatNumber(k.value?.leads), change: change("leads"), hint: `С сайта: ${formatNumber(k.value?.siteLeads)}` },
  { title: "CR сайта", value: formatPercent(k.value?.siteCr), change: change("siteCr"), hint: "Лиды с сайта / визиты" },
  { title: "Расходы", value: money(k.value?.expenses), change: change("expenses"), lowerIsBetter: true },
  { title: "CPL", value: money(k.value?.cpl), change: change("cpl"), lowerIsBetter: true, hint: "Стоимость заявки" },
  { title: "Новые клиенты", value: formatNumber(k.value?.newClients), change: change("newClients"), hint: "Первая оплата за всё время" },
  { title: "CAC", value: money(k.value?.cac), change: change("cac"), lowerIsBetter: true, hint: "Стоимость привлечения клиента" },
  { title: "Выручка", value: money(k.value?.revenue), change: change("revenue"), hint: "Платежи без комиссий площадок" },
  { title: "Средний чек", value: money(k.value?.averageCheck), change: change("averageCheck") },
  { title: "ROMI", value: formatPercent(k.value?.romi, 0), change: change("romi"), hint: "(Выручка − расходы) / расходы" },
  { title: "ROI", value: formatPercent(k.value?.roi, 0), change: change("roi"), hint: "С учётом себестоимости" },
  { title: "Дебиторка", value: money(k.value?.receivables), hint: "Сколько ещё должны клиенты" },
  {
    title: "Скорость первого ответа",
    value: formatMinutes(k.value?.responseMedianMinutes),
    change: change("responseMedianMinutes"),
    lowerIsBetter: true,
    hint: `Медиана; быстрее 15 мин: ${formatPercent(k.value?.responseFastShare, 0)}`,
  },
]);

// Leads per day, stacked by channel; days without leads are kept (zeros).
const chart = computed(() => {
  const rows = data.value?.leadsByDay ?? [];
  const keys = [...new Set(rows.map((r) => r.channel_id ?? 0))];
  const days: string[] = [];
  for (let d = range.value.from; d <= range.value.to && days.length < 370; d = addDays(d, 1)) days.push(d);
  return {
    series: keys.map((id) => ({ key: `c${id}`, label: id ? channelName(id) : "Не определён", color: channelColor(id || null) })),
    data: days.map((day) => {
      const row: Record<string, number | string> = { day };
      for (const id of keys) row[`c${id}`] = rows.filter((r) => r.day === day && (r.channel_id ?? 0) === id).reduce((s, r) => s + r.n, 0);
      return row;
    }),
  };
});

const channelRows = computed(() => (data.value?.channels ?? []).filter((r) => r.leads || r.expenses).sort((a, b) => b.leads - a.leads));
const plan = computed(() => data.value?.plan);
const pct = (fact: number, target: number | null) => (target ? Math.min(100, (fact / target) * 100) : 0);
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="grid grid-cols-2 gap-3 md:gap-4 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4">
      <KpiCard v-for="tile in tiles" :key="tile.title" v-bind="tile" :loading="pending && !data" />
    </div>

    <div class="grid gap-4 @5xl/main:grid-cols-3">
      <Card class="@5xl/main:col-span-2">
        <CardHeader>
          <CardTitle>Лиды по дням</CardTitle>
          <CardDescription>В разрезе каналов</CardDescription>
        </CardHeader>
        <CardContent>
          <StackedBarChart v-if="data" :data="chart.data" :series="chart.series" />
          <Skeleton v-else class="h-64 w-full" />
          <div v-if="chart.series.length" class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
            <span v-for="s in chart.series" :key="s.key" class="text-muted-foreground flex items-center gap-1.5">
              <span class="size-2 rounded-[2px]" :style="{ background: s.color }" />
              {{ s.label }}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сквозная воронка</CardTitle>
          <CardDescription>Лиды периода и куда они дошли</CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelBars v-if="data" :steps="data.funnel" />
          <Skeleton v-else class="h-64 w-full" />
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 @5xl/main:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>План и факт</CardTitle>
          <CardDescription v-if="plan">{{ new Date(`${plan.month}T00:00:00Z`).toLocaleDateString("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" }) }}</CardDescription>
        </CardHeader>
        <CardContent v-if="plan" class="grid gap-5">
          <div class="grid gap-2">
            <div class="flex justify-between text-sm">
              <span>Выручка</span>
              <span class="tabular-nums">{{ money(plan.revenueFact) }} <span class="text-muted-foreground">из {{ money(plan.revenuePlan) }}</span></span>
            </div>
            <Progress :model-value="pct(plan.revenueFact, plan.revenuePlan)" />
          </div>
          <div class="grid gap-2">
            <div class="flex justify-between text-sm">
              <span>Лиды</span>
              <span class="tabular-nums">{{ plan.leadsFact }} <span class="text-muted-foreground">из {{ plan.leadsPlan ?? "—" }}</span></span>
            </div>
            <Progress :model-value="pct(plan.leadsFact, plan.leadsPlan)" />
          </div>
          <p v-if="plan.revenuePlan === null && plan.leadsPlan === null" class="text-muted-foreground text-xs">
            План на месяц не задан. <NuxtLink to="/settings?tab=plan" class="underline underline-offset-4">Задать в настройках</NuxtLink>
          </p>
          <Separator />
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><div class="text-muted-foreground text-xs">LTV</div><div class="font-medium tabular-nums">{{ money(k?.ltv) }}</div></div>
            <div><div class="text-muted-foreground text-xs">LTV / CAC</div><div class="font-medium tabular-nums">{{ formatNumber(k?.ltvToCac, 1) }}</div></div>
            <div><div class="text-muted-foreground text-xs">Цикл сделки</div><div class="font-medium tabular-nums">{{ k?.cycleDays === null || k?.cycleDays === undefined ? "—" : `${formatNumber(k.cycleDays)} дн.` }}</div></div>
            <div><div class="text-muted-foreground text-xs">Доля повторных продаж</div><div class="font-medium tabular-nums">{{ formatPercent(k?.repeatShare, 0) }}</div></div>
          </div>
        </CardContent>
        <CardContent v-else><Skeleton class="h-40 w-full" /></CardContent>
      </Card>

      <Card class="@5xl/main:col-span-2">
        <CardHeader>
          <CardTitle>Каналы</CardTitle>
          <CardDescription>Кратко; подробно — в разделе «Каналы и реклама»</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" as-child><NuxtLink :to="{ path: '/channels', query: $route.query }">Подробнее</NuxtLink></Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            :rows="channelRows"
            :loading="pending && !data"
            :row-key="(r) => r.key ?? 0"
            :default-sort="{ key: 'leads', desc: true }"
            :columns="[
              { key: 'key', label: 'Канал', format: (r) => channelName(r.key), value: (r) => channelName(r.key) },
              { key: 'leads', label: 'Лиды', align: 'right' },
              { key: 'expenses', label: 'Расходы', align: 'right', format: (r) => money(r.expenses) },
              { key: 'cpl', label: 'CPL', align: 'right', format: (r) => money(r.cpl) },
              { key: 'clients', label: 'Клиенты', align: 'right' },
              { key: 'revenue', label: 'Выручка', align: 'right', format: (r) => money(r.revenue) },
              { key: 'romi', label: 'ROMI', align: 'right', format: (r) => formatPercent(r.romi, 0) },
            ]"
          />
        </CardContent>
      </Card>
    </div>

    <Card v-if="data?.lossReasons.length">
      <CardHeader>
        <CardTitle>Причины отказов</CardTitle>
        <CardDescription>Сделки, закрытые отказом за период, и этап, на котором это случилось</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          :rows="data.lossReasons"
          export-name="prichiny-otkazov"
          :columns="[
            { key: 'reason', label: 'Причина', format: (r) => r.reason ?? '—' },
            { key: 'stage', label: 'С этапа', format: (r) => r.stage ?? '—' },
            { key: 'n', label: 'Сделок', align: 'right' },
          ]"
        />
      </CardContent>
    </Card>
  </div>
</template>
