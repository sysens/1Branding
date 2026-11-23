import { DEALS, PERIOD_END, STAGES, VIEWS, type CrmView, type Stage } from "../data/crm";
import { formatDayMonth, formatShortDate, parseDay } from "../utils/format";

const DAY = 86_400_000;

export interface ChartBin {
  from: Date;
  count: number;
  label: string;
}

/**
 * State of the CRM mock-up: period, view (sidebar), stage filter, the open
 * deal. Deals can be moved to the next stage; the change lives in this
 * page view only.
 */
export function useCrm() {
  const deals = reactive(DEALS.map((deal) => ({ ...deal })));
  const days = ref(30);
  const view = ref<CrmView>("all");
  const stage = ref<Stage | null>(null);
  const selectedId = ref<string | null>(null);

  const start = computed(() => new Date(Date.UTC(2026, 10, 23 - days.value)));
  const inPeriod = computed(() => deals.filter((deal) => parseDay(deal.created) >= start.value));

  const counts = computed(() => Object.fromEntries(
    STAGES.map((name) => [name, inPeriod.value.filter((deal) => deal.stage === name).length]),
  ) as Record<Stage, number>);

  const total = computed(() => inPeriod.value.reduce((sum, deal) => sum + deal.amount, 0));
  const volumeInWork = computed(() => inPeriod.value.filter((deal) => deal.stage === "production").reduce((sum, deal) => sum + deal.qty, 0));

  const currentView = computed(() => VIEWS.find((item) => item.id === view.value)!);
  const filterStage = computed(() => stage.value ?? currentView.value.stage);
  const visible = computed(() => inPeriod.value.filter((deal) => !filterStage.value || deal.stage === filterStage.value));

  const rangeLabel = computed(() => `${formatDayMonth(start.value)} — ${formatDayMonth(PERIOD_END)} 2026`);

  // New requests per day (7-day period) or per 6 days (30-day period).
  const chart = computed<ChartBin[]>(() => {
    const binCount = days.value === 7 ? 7 : 5;
    const span = (days.value === 7 ? 1 : 6) * DAY;
    return Array.from({ length: binCount }, (_, index) => {
      const from = new Date(start.value.getTime() + index * span);
      const to = new Date(Math.min(from.getTime() + span, PERIOD_END.getTime() + 1));
      const count = inPeriod.value.filter((deal) => {
        const date = parseDay(deal.created);
        return date >= from && date < to;
      }).length;
      return { from, count, label: formatShortDate(from) };
    });
  });

  const chartLabel = computed(() =>
    `Новые запросы: ${chart.value.map((bin) => `${formatDayMonth(bin.from)} — ${bin.count}`).join("; ")}. Всего ${inPeriod.value.length}.`,
  );

  const selected = computed(() => deals.find((deal) => deal.id === selectedId.value));

  function selectView(id: CrmView) {
    view.value = id;
    stage.value = VIEWS.find((item) => item.id === id)!.stage;
  }

  function toggleStage(name: Stage) {
    stage.value = stage.value === name ? null : name;
    view.value = "all";
  }

  function resetFilters() {
    stage.value = null;
    view.value = "all";
  }

  function advanceSelected() {
    const deal = selected.value;
    if (!deal) return;
    const index = STAGES.indexOf(deal.stage);
    if (index < STAGES.length - 1) deal.stage = STAGES[index + 1]!;
  }

  return {
    days,
    view,
    stage,
    selectedId,
    counts,
    total,
    volumeInWork,
    inPeriod,
    visible,
    title: computed(() => currentView.value.title),
    rangeLabel,
    chart,
    chartLabel,
    selected,
    selectView,
    toggleStage,
    resetFilters,
    advanceSelected,
  };
}
