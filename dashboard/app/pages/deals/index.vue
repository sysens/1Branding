<script setup lang="ts">
// The CRM funnel (spec 6.2): a board with a column per stage (cards are
// dragged between them) or a list with sorting and filters.
import { Kanban, List, Plus, Search } from "@lucide/vue";
import { refDebounced } from "@vueuse/core";
import { VueDraggable } from "vue-draggable-plus";
import { toast } from "vue-sonner";
import { DEAL_ORIGIN_LABELS } from "#shared/utils/constants";
import type { BoardDeal } from "~/utils/types";

definePageMeta({ title: "Воронка", filters: ["channels", "services"] });
useHead({ title: "Воронка · OneBranding" });

const route = useRoute();
const router = useRouter();
const { meta, channelName, stageName, userName, canEdit } = useMeta();
const { channels, services } = useFilters();

const view = computed(() => (route.query.view === "list" ? "list" : "board"));
const search = ref(String(route.query.q ?? ""));
const owner = ref(String(route.query.owner ?? ""));
const closedDays = ref(String(route.query.closed ?? "30"));
const debouncedSearch = refDebounced(search, 300);

const query = computed(() => ({
  q: debouncedSearch.value || undefined,
  owner: owner.value || undefined,
  closedDays: closedDays.value,
  channels: channels.value.join(",") || undefined,
  services: services.value.join(",") || undefined,
}));
const { data, refresh, pending } = await useAsyncData("deals", () => api<BoardDeal[]>("/api/deals", { query: query.value }), { watch: [query], server: false, lazy: true });

const stages = computed(() => meta.value?.stages ?? []);
// One column per stage; the drag library moves cards between these arrays.
const board = ref<Array<{ stageId: number; name: string; items: BoardDeal[] }>>([]);
watch([data, stages], () => {
  board.value = stages.value.map((stage) => ({
    stageId: stage.id,
    name: stage.name,
    items: (data.value ?? []).filter((deal) => deal.stage_id === stage.id),
  }));
}, { immediate: true });

const total = (list: BoardDeal[]) => {
  const usd = list.filter((d) => d.currency === "USD").reduce((s, d) => s + (d.amount ?? 0), 0);
  const uzs = list.filter((d) => d.currency === "UZS").reduce((s, d) => s + (d.amount ?? 0), 0);
  return [usd ? formatMoney(usd, "USD") : "", uzs ? formatMoney(uzs, "UZS", { compact: true }) : ""].filter(Boolean).join(" + ") || "—";
};

// Moving a card: "Lost" asks for the reason, a stage that needs a payment opens the payment form.
const lossOpen = ref(false);
const paymentOpen = ref(false);
const pending_move = ref<{ dealId: number; stageId: number; currency: string } | null>(null);

async function move(dealId: number, stageId: number, extra: Record<string, unknown> = {}) {
  try {
    await api(`/api/deals/${dealId}/move`, { method: "POST", body: { stageId, ...extra } });
    toast.success(`Перемещено в «${stageName(stageId)}»`);
  } catch (error) {
    const message = apiError(error);
    const stage = stages.value.find((s) => s.id === stageId);
    if (stage?.requiresPayment && /платёж/i.test(message)) {
      const deal = data.value?.find((d) => d.id === dealId);
      pending_move.value = { dealId, stageId, currency: deal?.currency ?? "USD" };
      paymentOpen.value = true;
      toast.info("Сначала внесите платёж");
    } else toast.error(message);
  }
  await refresh();
}

function onAdd(event: { item: HTMLElement }, stageId: number) {
  const dealId = Number(event.item.dataset.id || event.item.querySelector("[data-id]")?.getAttribute("data-id"));
  if (!dealId) return;
  if (!canEdit.value) {
    toast.error("Недостаточно прав");
    refresh();
    return;
  }
  const stage = stages.value.find((s) => s.id === stageId);
  if (stage?.kind === "lost") {
    pending_move.value = { dealId, stageId, currency: "USD" };
    lossOpen.value = true;
    return;
  }
  move(dealId, stageId);
}

const onLoss = (reasonId: number, comment: string) => {
  if (pending_move.value) move(pending_move.value.dealId, pending_move.value.stageId, { lossReasonId: reasonId, lossComment: comment || null });
  pending_move.value = null;
};
const onPaid = () => {
  if (pending_move.value) move(pending_move.value.dealId, pending_move.value.stageId);
  pending_move.value = null;
};

const setQuery = (patch: Record<string, string | undefined>) => router.replace({ query: { ...route.query, ...patch } });
watch(owner, (v) => setQuery({ owner: v || undefined }));
watch(closedDays, (v) => setQuery({ closed: v === "30" ? undefined : v }));
watch(debouncedSearch, (v) => setQuery({ q: v || undefined }));

const createOpen = ref(false);
const listColumns = [
  { key: "id", label: "#", format: (r: BoardDeal) => `#${r.id}` },
  { key: "client", label: "Клиент", value: (r: BoardDeal) => r.client || r.title || "" },
  { key: "stage_id", label: "Этап", value: (r: BoardDeal) => stageName(r.stage_id) },
  { key: "amount", label: "Сумма", align: "right" as const, format: (r: BoardDeal) => (r.amount !== null ? formatMoney(r.amount, r.currency) : "—") },
  { key: "paid", label: "Оплачено", align: "right" as const, format: (r: BoardDeal) => (r.paid ? formatMoney(r.paid, r.currency) : "—") },
  { key: "channel_id", label: "Канал", value: (r: BoardDeal) => channelName(r.channel_id) },
  { key: "origin", label: "Как пришёл", value: (r: BoardDeal) => DEAL_ORIGIN_LABELS[r.origin as keyof typeof DEAL_ORIGIN_LABELS] ?? r.origin },
  { key: "owner_id", label: "Ответственный", value: (r: BoardDeal) => userName(r.owner_id) },
  { key: "created_at", label: "Создана", value: (r: BoardDeal) => r.created_at, format: (r: BoardDeal) => formatDateTime(r.created_at) },
  { key: "days_on_stage", label: "Дней на этапе", align: "right" as const },
];
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative w-full sm:w-64">
        <Search class="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input v-model="search" placeholder="Имя, компания, телефон, код…" class="h-8 pl-8" />
      </div>
      <NativeSelect v-model="owner" size="sm" class="w-44">
        <option value="">Все ответственные</option>
        <option v-for="u in meta?.users ?? []" :key="u.id" :value="String(u.id)">{{ u.name }}</option>
      </NativeSelect>
      <NativeSelect v-model="closedDays" size="sm" class="w-52">
        <option value="7">Закрытые за 7 дней</option>
        <option value="30">Закрытые за 30 дней</option>
        <option value="90">Закрытые за 90 дней</option>
        <option value="3650">Все закрытые</option>
      </NativeSelect>
      <div class="ml-auto flex items-center gap-2">
        <ToggleGroup type="single" variant="outline" size="sm" :model-value="view" @update:model-value="(v) => v && setQuery({ view: v === 'list' ? 'list' : undefined })">
          <ToggleGroupItem value="board" aria-label="Доска"><Kanban /></ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="Список"><List /></ToggleGroupItem>
        </ToggleGroup>
        <Button v-if="canEdit" size="sm" @click="createOpen = true"><Plus />Новая сделка</Button>
      </div>
    </div>

    <div v-if="view === 'board'" class="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
      <div class="flex min-h-[60vh] gap-3">
        <div v-for="column in board" :key="column.stageId" class="bg-muted/50 flex w-72 shrink-0 flex-col rounded-xl border">
          <div class="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
            <div class="flex min-w-0 items-center gap-2">
              <span class="truncate text-sm font-medium">{{ column.name }}</span>
              <Badge variant="secondary" class="tabular-nums">{{ column.items.length }}</Badge>
            </div>
            <span class="text-muted-foreground truncate text-xs tabular-nums">{{ total(column.items) }}</span>
          </div>
          <VueDraggable
            v-model="column.items"
            group="deals"
            :animation="150"
            :delay="150"
            :delay-on-touch-only="true"
          :force-fallback="true"
          :fallback-tolerance="4"
          :scroll-sensitivity="80"
            :disabled="!canEdit"
            ghost-class="opacity-40"
            class="flex flex-1 flex-col gap-2 px-2 pb-2"
            @add="(e: { item: HTMLElement }) => onAdd(e, column.stageId)"
          >
            <DealCard v-for="deal in column.items" :key="deal.id" :deal="deal" />
          </VueDraggable>
          <p v-if="!pending && !column.items.length" class="text-muted-foreground px-3 pb-4 text-center text-xs">Пусто</p>
        </div>
      </div>
    </div>

    <DataTable
      v-else
      :rows="data ?? []"
      :columns="listColumns"
      :loading="pending && !data"
      :row-key="(r) => r.id"
      :default-sort="{ key: 'created_at', desc: true }"
      export-name="sdelki"
      empty="Сделок не найдено"
      @row-click="(r) => navigateTo(`/deals/${r.id}`)"
    />

    <DealCreateDialog v-model:open="createOpen" @created="(id) => navigateTo(`/deals/${id}`)" />
    <LossDialog v-model:open="lossOpen" @confirm="onLoss" @cancel="pending_move = null; refresh()" />
    <PaymentDialog v-model:open="paymentOpen" :deal-id="pending_move?.dealId ?? null" :currency="pending_move?.currency" @saved="onPaid" />
  </div>
</template>
