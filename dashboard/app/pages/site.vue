<script setup lang="ts">
// The site (spec 6.5): the site funnel, visits by day / source / device /
// language, time and scroll by page, exit pages, CTA clicks, forms,
// messenger clicks against real conversations; links to Metrika and Looker Studio.
import { ExternalLink } from "@lucide/vue";
import { DEVICE_LABELS, LANGUAGE_LABELS } from "#shared/utils/constants";

definePageMeta({ title: "Сайт", filters: ["period", "channels"] });
useHead({ title: "Сайт · OneBranding" });

type Report = {
  funnel: Array<{ name: string; count: number }>;
  totals: { visits: number; avg_active: number; avg_pages: number };
  byDay: Array<{ day: string; visits: number; visitors: number }>;
  byChannel: Array<{ channel_id: number | null; visits: number }>;
  byDevice: Array<{ device: string | null; visits: number }>;
  byLanguage: Array<{ language: string | null; visits: number }>;
  pages: Array<{ page: string; views: number; avg_active: number; scroll50: number; scroll90: number }>;
  exits: Array<{ page: string; exits: number }>;
  cta: Array<{ button: string; page: string; clicks: number }>;
  forms: { opened: number; started: number; sent: number };
  messengers: Array<{ channel: string; clicks: number; dialogs: number }>;
};

const { params } = useFilters();
const { meta, channelName, channelColor } = useMeta();
const { data, pending } = await useAsyncData("site-report", () => api<Report>("/api/reports/site", { query: params.value }), { watch: [params], server: false, lazy: true });
const share = (n: number, list: Array<{ visits: number }>) => {
  const total = list.reduce((s, r) => s + r.visits, 0);
  return total ? (n / total) * 100 : 0;
};
const metrikaUrl = computed(() => {
  const id = meta.value?.defaults.links?.metrikaCounterId;
  return id ? `https://metrika.yandex.ru/stat/visor?id=${encodeURIComponent(id)}` : "https://metrika.yandex.ru/";
});
const lookerUrl = computed(() => meta.value?.defaults.links?.lookerStudioUrl || "");
const MESSENGER: Record<string, string> = { telegram: "Telegram", whatsapp: "WhatsApp", instagram: "Instagram" };
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="grid grid-cols-2 gap-4 @3xl/main:grid-cols-4">
      <KpiCard title="Визиты" :value="formatNumber(data?.totals.visits)" :loading="pending && !data" />
      <KpiCard title="Среднее активное время" :value="formatDuration(data?.totals.avg_active)" :loading="pending && !data" />
      <KpiCard title="Страниц за визит" :value="formatNumber(data?.totals.avg_pages, 1)" :loading="pending && !data" />
      <KpiCard
        title="Брошенные формы"
        :value="formatNumber(data ? Math.max(0, data.forms.started - data.forms.sent) : null)"
        :hint="data ? `Открыли ${data.forms.opened} · начали ${data.forms.started} · отправили ${data.forms.sent}` : ''"
        :loading="pending && !data"
      />
    </div>

    <div class="grid gap-4 @5xl/main:grid-cols-3">
      <Card class="@5xl/main:col-span-2">
        <CardHeader>
          <CardTitle>Визиты и посетители</CardTitle>
          <CardAction class="flex gap-2">
            <Button variant="outline" size="sm" as-child><a :href="metrikaUrl" target="_blank" rel="noopener"><ExternalLink />Тепловые карты и Вебвизор</a></Button>
            <Button v-if="lookerUrl" variant="outline" size="sm" as-child><a :href="lookerUrl" target="_blank" rel="noopener"><ExternalLink />Подробный отчёт</a></Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <AreaTrendChart
            v-if="data"
            :data="data.byDay"
            date-key="day"
            :series="[{ key: 'visits', label: 'Визиты', color: 'var(--chart-1)', area: true }, { key: 'visitors', label: 'Посетители', color: 'var(--chart-2)' }]"
          />
          <Skeleton v-else class="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Воронка сайта</CardTitle>
          <CardDescription>Вовлечённые — ≥30 сек или скролл ≥50%</CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelBars v-if="data" :steps="data.funnel" />
          <Skeleton v-else class="h-64 w-full" />
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 @3xl/main:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Источники</CardTitle></CardHeader>
        <CardContent class="grid gap-2.5">
          <div v-for="row in data?.byChannel ?? []" :key="row.channel_id ?? 0" class="grid gap-1">
            <div class="flex justify-between text-sm"><span class="flex items-center gap-2"><span class="size-2 rounded-full" :style="{ background: channelColor(row.channel_id) }" />{{ channelName(row.channel_id) }}</span><span class="tabular-nums">{{ formatNumber(row.visits) }}</span></div>
            <Progress :model-value="share(row.visits, data!.byChannel)" class="h-1.5" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Устройства</CardTitle></CardHeader>
        <CardContent class="grid gap-2.5">
          <div v-for="row in data?.byDevice ?? []" :key="row.device ?? '-'" class="grid gap-1">
            <div class="flex justify-between text-sm"><span>{{ DEVICE_LABELS[row.device ?? ""] ?? "Не определено" }}</span><span class="tabular-nums">{{ formatPercent(share(row.visits, data!.byDevice), 0) }}</span></div>
            <Progress :model-value="share(row.visits, data!.byDevice)" class="h-1.5" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Языки</CardTitle></CardHeader>
        <CardContent class="grid gap-2.5">
          <div v-for="row in data?.byLanguage ?? []" :key="row.language ?? '-'" class="grid gap-1">
            <div class="flex justify-between text-sm"><span>{{ LANGUAGE_LABELS[row.language ?? ""] ?? "Не определён" }}</span><span class="tabular-nums">{{ formatPercent(share(row.visits, data!.byLanguage), 0) }}</span></div>
            <Progress :model-value="share(row.visits, data!.byLanguage)" class="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Страницы</CardTitle>
        <CardDescription>Просмотры, активное время и глубина скролла</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          :rows="data?.pages ?? []"
          :loading="pending && !data"
          export-name="stranitsy"
          :default-sort="{ key: 'views', desc: true }"
          :columns="[
            { key: 'page', label: 'Страница', class: 'max-w-80 truncate' },
            { key: 'views', label: 'Просмотры', align: 'right' },
            { key: 'avg_active', label: 'Активное время', align: 'right', format: (r) => formatDuration(r.avg_active) },
            { key: 'scroll50', label: 'Скролл ≥50%', align: 'right', value: (r) => (r.views ? (r.scroll50 / r.views) * 100 : null), format: (r) => formatPercent(r.views ? (r.scroll50 / r.views) * 100 : null, 0) },
            { key: 'scroll90', label: 'Скролл ≥90%', align: 'right', value: (r) => (r.views ? (r.scroll90 / r.views) * 100 : null), format: (r) => formatPercent(r.views ? (r.scroll90 / r.views) * 100 : null, 0) },
          ]"
        />
      </CardContent>
    </Card>

    <div class="grid gap-4 @5xl/main:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Страницы, на которых уходят</CardTitle></CardHeader>
        <CardContent>
          <DataTable :rows="data?.exits ?? []" :columns="[{ key: 'page', label: 'Страница' }, { key: 'exits', label: 'Выходы', align: 'right' }]" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Клики по CTA</CardTitle></CardHeader>
        <CardContent>
          <DataTable :rows="data?.cta ?? []" export-name="cta" :columns="[{ key: 'button', label: 'Кнопка' }, { key: 'page', label: 'Страница' }, { key: 'clicks', label: 'Клики', align: 'right' }]" />
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Мессенджеры</CardTitle>
        <CardDescription>Клики по кнопкам против реальных диалогов: разница — сколько людей передумали писать</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          :rows="data?.messengers ?? []"
          :columns="[
            { key: 'channel', label: 'Мессенджер', format: (r) => MESSENGER[r.channel] ?? r.channel },
            { key: 'clicks', label: 'Клики', align: 'right' },
            { key: 'dialogs', label: 'Диалоги', align: 'right' },
            { key: 'gap', label: 'Не написали', align: 'right', value: (r) => Math.max(0, r.clicks - r.dialogs) },
          ]"
          empty="Кликов по мессенджерам за период нет"
        />
      </CardContent>
    </Card>
  </div>
</template>
