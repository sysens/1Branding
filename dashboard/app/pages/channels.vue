<script setup lang="ts">
// Channels and ads (spec 6.4): every channel with its campaigns, bloggers
// and placements; cohort CAC, ROMI and ROI; first or last touch attribution.
import { ChevronRight, Download } from "@lucide/vue";

definePageMeta({ title: "Каналы и реклама", filters: ["period", "channels", "services", "attribution", "currency"] });
useHead({ title: "Каналы · OneBranding" });

type Row = {
  key: number | null; name?: string; placement?: string | null; expenses: number; impressions: number; clicks: number; ctr: number | null; cpc: number | null;
  visits: number; leads: number; cpl: number | null; qualified: number; meetings: number; clients: number; leadToClient: number | null;
  revenue: number; cac: number | null; romi: number | null; roi: number | null; averageCheck: number | null; ltv?: number | null; ltvToCac?: number | null;
};
type Report = { channels: Array<Row & { campaigns: Row[] }> };

const { params, currency } = useFilters();
const { channelName, channelColor } = useMeta();
const { data, pending } = await useAsyncData("channels-report", () => api<Report>("/api/reports/channels", { query: params.value }), { watch: [params], server: false, lazy: true });
const rows = computed(() => (data.value?.channels ?? []).filter((r) => r.leads || r.expenses || r.visits).sort((a, b) => b.leads - a.leads || b.expenses - a.expenses));
const open = ref<Set<number | null>>(new Set());
const toggle = (key: number | null) => {
  const next = new Set(open.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  open.value = next;
};
const money = (v: number | null | undefined) => formatMoney(v, currency.value, { compact: currency.value === "UZS" });

const totals = computed(() => {
  const sum = (k: keyof Row) => rows.value.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const expenses = sum("expenses");
  const revenue = sum("revenue");
  const leads = sum("leads");
  const clients = sum("clients");
  return { expenses, revenue, leads, clients, visits: sum("visits"), qualified: sum("qualified"), meetings: sum("meetings"), impressions: sum("impressions"), clicks: sum("clicks"),
    cpl: leads ? expenses / leads : null, cac: clients ? expenses / clients : null, romi: expenses ? ((revenue - expenses) / expenses) * 100 : null };
});

const COLUMNS: Array<{ key: keyof Row; label: string; fmt: (r: Row) => string; hint?: string }> = [
  { key: "expenses", label: "Расходы", fmt: (r) => money(r.expenses) },
  { key: "impressions", label: "Показы", fmt: (r) => (r.impressions ? formatNumber(r.impressions) : "—") },
  { key: "clicks", label: "Клики", fmt: (r) => (r.clicks ? formatNumber(r.clicks) : "—") },
  { key: "ctr", label: "CTR", fmt: (r) => formatPercent(r.ctr, 2) },
  { key: "cpc", label: "CPC", fmt: (r) => money(r.cpc) },
  { key: "visits", label: "Визиты", fmt: (r) => formatNumber(r.visits) },
  { key: "leads", label: "Лиды", fmt: (r) => formatNumber(r.leads) },
  { key: "cpl", label: "CPL", fmt: (r) => money(r.cpl) },
  { key: "qualified", label: "Квал. лиды", fmt: (r) => formatNumber(r.qualified) },
  { key: "meetings", label: "Встречи", fmt: (r) => formatNumber(r.meetings) },
  { key: "clients", label: "Клиенты", fmt: (r) => formatNumber(r.clients) },
  { key: "leadToClient", label: "CR лид → клиент", fmt: (r) => formatPercent(r.leadToClient, 0) },
  { key: "revenue", label: "Выручка", fmt: (r) => money(r.revenue) },
  { key: "cac", label: "CAC", fmt: (r) => money(r.cac) },
  { key: "romi", label: "ROMI", fmt: (r) => formatPercent(r.romi, 0) },
  { key: "roi", label: "ROI", fmt: (r) => formatPercent(r.roi, 0) },
  { key: "averageCheck", label: "Средний чек", fmt: (r) => money(r.averageCheck) },
];

function exportRows(kind: "xlsx" | "csv") {
  const flat = rows.value.flatMap((r) => [{ ...r, name: channelName(r.key), level: "Канал" }, ...r.campaigns.map((c) => ({ ...c, name: `${channelName(r.key)} / ${c.name}`, level: "Кампания" }))]);
  const columns = [{ label: "Канал / кампания", value: (r: (typeof flat)[number]) => r.name ?? "" }, ...COLUMNS.map((c) => ({ label: c.label, value: (r: (typeof flat)[number]) => r[c.key] as number | null }))];
  (kind === "xlsx" ? exportXlsx : exportCsv)(flat, columns, "kanaly");
}
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="grid grid-cols-2 gap-4 @3xl/main:grid-cols-4">
      <KpiCard title="Расходы" :value="money(totals.expenses)" :loading="pending && !data" />
      <KpiCard title="Лиды" :value="formatNumber(totals.leads)" :hint="`CPL ${money(totals.cpl)}`" :loading="pending && !data" />
      <KpiCard title="Клиенты из лидов периода" :value="formatNumber(totals.clients)" :hint="`CAC ${money(totals.cac)}`" :loading="pending && !data" />
      <KpiCard title="Выручка по когорте" :value="money(totals.revenue)" :hint="`ROMI ${formatPercent(totals.romi, 0)}`" :loading="pending && !data" />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Каналы</CardTitle>
        <CardDescription>
          Расходы периода против всей выручки (на сегодня) от лидов, созданных в этом периоде. Нажмите на канал, чтобы раскрыть кампании.
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger as-child><Button variant="outline" size="sm" :disabled="!rows.length"><Download />Экспорт</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="exportRows('xlsx')">Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem @click="exportRows('csv')">CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div class="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader class="bg-muted/50">
              <TableRow>
                <TableHead class="bg-muted/50 sticky left-0 z-10 min-w-52">Канал</TableHead>
                <TableHead v-for="c in COLUMNS" :key="c.key" class="text-right whitespace-nowrap">{{ c.label }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="pending && !data"><TableCell :colspan="COLUMNS.length + 1"><Skeleton class="h-24 w-full" /></TableCell></TableRow>
              <TableRow v-else-if="!rows.length"><TableCell :colspan="COLUMNS.length + 1" class="text-muted-foreground h-24 text-center">Нет данных за выбранный период</TableCell></TableRow>
              <template v-for="row in rows" :key="row.key ?? 0">
                <TableRow class="cursor-pointer" @click="toggle(row.key)">
                  <TableCell class="bg-background sticky left-0 z-10 font-medium">
                    <span class="flex items-center gap-2">
                      <ChevronRight class="text-muted-foreground size-4 transition-transform" :class="[open.has(row.key) && 'rotate-90', !row.campaigns.length && 'invisible']" />
                      <span class="size-2 rounded-full" :style="{ background: channelColor(row.key) }" />
                      {{ channelName(row.key) }}
                    </span>
                  </TableCell>
                  <TableCell v-for="c in COLUMNS" :key="c.key" class="text-right tabular-nums">{{ c.fmt(row) }}</TableCell>
                </TableRow>
                <template v-if="open.has(row.key)">
                  <TableRow v-for="campaign in row.campaigns" :key="`c${campaign.key}`" class="bg-muted/30">
                    <TableCell class="bg-muted/30 sticky left-0 z-10 pl-12 text-sm">
                      {{ campaign.name }}<span v-if="campaign.placement" class="text-muted-foreground"> · {{ campaign.placement }}</span>
                    </TableCell>
                    <TableCell v-for="c in COLUMNS" :key="c.key" class="text-muted-foreground text-right text-sm tabular-nums">{{ c.fmt(campaign) }}</TableCell>
                  </TableRow>
                </template>
              </template>
            </TableBody>
            <TableFooter v-if="rows.length">
              <TableRow>
                <TableCell class="sticky left-0 z-10 font-medium">Итого</TableCell>
                <TableCell class="text-right tabular-nums">{{ money(totals.expenses) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatNumber(totals.impressions) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatNumber(totals.clicks) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatPercent(totals.impressions ? (totals.clicks / totals.impressions) * 100 : null, 2) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ money(totals.clicks ? totals.expenses / totals.clicks : null) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatNumber(totals.visits) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatNumber(totals.leads) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ money(totals.cpl) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatNumber(totals.qualified) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatNumber(totals.meetings) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatNumber(totals.clients) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatPercent(totals.leads ? (totals.clients / totals.leads) * 100 : null, 0) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ money(totals.revenue) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ money(totals.cac) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatPercent(totals.romi, 0) }}</TableCell>
                <TableCell colspan="2" />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>LTV по каналу первого касания</CardTitle>
        <CardDescription>Средняя выручка с клиента за всё время и её отношение к CAC (ориентир — не ниже 3)</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          :rows="rows.filter((r) => r.ltv)"
          :columns="[
            { key: 'key', label: 'Канал', value: (r) => channelName(r.key) },
            { key: 'ltv', label: 'Средний LTV', align: 'right', format: (r) => money(r.ltv) },
            { key: 'cac', label: 'CAC', align: 'right', format: (r) => money(r.cac) },
            { key: 'ltvToCac', label: 'LTV / CAC', align: 'right', format: (r) => formatNumber(r.ltvToCac, 1) },
          ]"
          empty="Пока нет оплативших клиентов"
        />
      </CardContent>
    </Card>
  </div>
</template>
