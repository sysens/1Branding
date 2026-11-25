<script setup lang="ts">
// The deal card (spec 6.3): contacts with one-tap buttons, terms and costs,
// the client's path on the site, payments and balance, stage history,
// notes, tasks, the Telegram / Instagram conversation, the client's deals.
import { ArrowLeft, ExternalLink, MessageCircle, Phone, Plus, Send, Trash2 } from "@lucide/vue";
import {
  COST_CATEGORIES, COST_CATEGORY_LABELS, CURRENCIES, DEAL_ORIGIN_LABELS, DEVICE_LABELS, LANGUAGE_LABELS, PAYMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS, type CostCategory, type PaymentKind, type PaymentMethod,
} from "#shared/utils/constants";
import { tashkentDay } from "#shared/utils/time";

definePageMeta({ title: "Сделка" });

type Touch = { src?: string; med?: string; cmp?: string; cnt?: string; trm?: string; gclid?: string; yclid?: string; fbclid?: string; ref?: string; land?: string; at?: number };
type Deal = {
  id: number; title: string | null; contactName: string | null; stageId: number; amount: number | null; currency: string;
  serviceIds: number[]; expectedCloseOn: string | null; ownerId: number | null; isRepeat: boolean; origin: string; contactMethod: string | null;
  firstChannelId: number | null; lastChannelId: number | null; firstTouch: Touch | null; lastTouch: Touch | null; contactCode: string | null;
  createdAt: string; firstResponseAt: string | null; stageChangedAt: string; page: string | null; device: string | null; language: string | null; clientId: number | null;
  lossComment: string | null;
};
type Client = { id: number; name: string; contactName: string | null; phone: string | null; telegram: string | null; whatsapp: string | null; instagram: string | null; email: string | null; industryId: number | null; notes: string | null };
type Card = {
  deal: Deal; client: Client | null; industry: { name: string } | null; campaign: { name: string; utmCampaign: string } | null; lossReason: { name: string } | null;
  serviceNames: string[];
  payments: Array<{ id: number; kind: PaymentKind; amount: number; currency: string; paidOn: string; method: PaymentMethod; note: string | null; commissionPercent: number }>;
  paid: number; remaining: number | null;
  costs: Array<{ id: number; category: CostCategory; amount: number; currency: string; spentOn: string; note: string | null }>;
  notes: Array<{ id: number; text: string; author: string | null; createdAt: string }>;
  tasks: Array<{ id: number; text: string; dueOn: string | null; done: boolean; assignee: string | null }>;
  history: Array<{ id: number; from: string | null; to: string | null; user: string | null; at: string }>;
  messages: Array<{ id: number; channel: string; direction: "in" | "out"; text: string | null; senderName: string | null; at: string }>;
  otherDeals: Array<{ id: number; title: string | null; amount: number | null; currency: string; stage: string | null; createdAt: string }>;
  journey: null | {
    visitor: { gaClientId: string | null; ymClientId: string | null } | null;
    visits: Array<{ id: string; startedAt: string; landing: string | null; channel: string | null; activeSeconds: number; pageViews: number; device: string | null; touch: Touch | null }>;
    events: Array<{ id: string; name: string; page: string | null; at: string; params: Record<string, unknown> | null }>;
    visitsBeforeLead: number; activeSecondsBeforeLead: number; pagesBeforeLead: string[]; webvisorUrl: string | null;
  };
};

const route = useRoute();
const id = computed(() => Number(route.params.id));
const { meta, channelName, canEdit, isOwner } = useMeta();
const { data, refresh, error } = await useAsyncData(`deal-${id.value}`, () => api<Card>(`/api/deals/${id.value}`), { server: false, lazy: true });
useHead({ title: computed(() => `${data.value?.client?.name ?? data.value?.deal.title ?? "Сделка"} · OneBranding`) });

const deal = computed(() => data.value?.deal);
const stages = computed(() => meta.value?.stages ?? []);
const phone = computed(() => data.value?.client?.phone || data.value?.client?.whatsapp || null);
const digits = (value: string | null | undefined) => String(value ?? "").replace(/\D/g, "");

// ---- stage
const lossOpen = ref(false);
const paymentOpen = ref(false);
const paymentKind = ref<PaymentKind>("prepayment");
const pendingStage = ref<number | null>(null);
async function changeStage(value: unknown) {
  const stageId = Number(value);
  const stage = stages.value.find((s) => s.id === stageId);
  if (!stage || !deal.value || stageId === deal.value.stageId) return;
  if (stage.kind === "lost") {
    pendingStage.value = stageId;
    lossOpen.value = true;
    return;
  }
  if (stage.requiresPayment && !data.value?.payments.length) {
    pendingStage.value = stageId;
    paymentKind.value = "prepayment";
    paymentOpen.value = true;
    return;
  }
  await attempt(() => api(`/api/deals/${id.value}/move`, { method: "POST", body: { stageId } }), `Этап: ${stage.name}`);
  await refresh();
}
async function onLoss(reasonId: number, comment: string) {
  await attempt(() => api(`/api/deals/${id.value}/move`, { method: "POST", body: { stageId: pendingStage.value, lossReasonId: reasonId, lossComment: comment || null } }), "Сделка закрыта отказом");
  pendingStage.value = null;
  await refresh();
}
async function onPaymentSaved() {
  if (pendingStage.value) {
    await attempt(() => api(`/api/deals/${id.value}/move`, { method: "POST", body: { stageId: pendingStage.value } }));
    pendingStage.value = null;
  }
  await refresh();
}

// ---- terms
const editOpen = ref(false);
const edit = reactive({ title: "", contactName: "", amount: "" as string | number, currency: "USD", serviceIds: [] as number[], expectedCloseOn: "", ownerId: "", lastChannelId: "", firstChannelId: "", contactCode: "", isRepeat: false, phone: "", telegram: "", whatsapp: "", instagram: "", email: "", industryId: "" });
function openEdit() {
  const d = deal.value!;
  const c = data.value?.client;
  Object.assign(edit, {
    title: d.title ?? "", contactName: d.contactName ?? "", amount: d.amount ?? "", currency: d.currency, serviceIds: [...d.serviceIds],
    expectedCloseOn: d.expectedCloseOn ?? "", ownerId: d.ownerId ? String(d.ownerId) : "", lastChannelId: d.lastChannelId ? String(d.lastChannelId) : "",
    firstChannelId: d.firstChannelId ? String(d.firstChannelId) : "", contactCode: d.contactCode ?? "", isRepeat: d.isRepeat,
    phone: c?.phone ?? "", telegram: c?.telegram ?? "", whatsapp: c?.whatsapp ?? "", instagram: c?.instagram ?? "", email: c?.email ?? "",
    industryId: c?.industryId ? String(c.industryId) : "",
  });
  editOpen.value = true;
}
async function saveEdit() {
  const d = deal.value!;
  const ok = await attempt(() => api(`/api/deals/${id.value}`, {
    method: "PATCH",
    body: {
      title: edit.title, contactName: edit.contactName || null, amount: edit.amount === "" ? null : Number(edit.amount), currency: edit.currency,
      serviceIds: edit.serviceIds, expectedCloseOn: edit.expectedCloseOn || null, ownerId: edit.ownerId ? Number(edit.ownerId) : null, isRepeat: edit.isRepeat,
      firstChannelId: edit.firstChannelId ? Number(edit.firstChannelId) : null, lastChannelId: edit.lastChannelId ? Number(edit.lastChannelId) : null,
      ...(edit.contactCode !== (d.contactCode ?? "") ? { contactCode: edit.contactCode || null } : {}),
      client: { phone: edit.phone || null, telegram: edit.telegram || null, whatsapp: edit.whatsapp || null, instagram: edit.instagram || null, email: edit.email || null, industryId: edit.industryId ? Number(edit.industryId) : null },
    },
  }), "Сохранено");
  if (ok) {
    editOpen.value = false;
    await refresh();
  }
}

// ---- costs, notes, tasks
const cost = reactive({ category: "contractor" as CostCategory, amount: "" as string | number, currency: "USD", spentOn: tashkentDay(), note: "" });
const costOpen = ref(false);
async function addCost() {
  const ok = await attempt(() => api(`/api/deals/${id.value}/costs`, { method: "POST", body: { ...cost, amount: Number(cost.amount), note: cost.note || null } }), "Себестоимость добавлена");
  if (ok) {
    costOpen.value = false;
    Object.assign(cost, { amount: "", note: "" });
    await refresh();
  }
}
const removeCost = async (costId: number) => {
  await attempt(() => api(`/api/costs/${costId}`, { method: "DELETE" }));
  await refresh();
};
const removePayment = async (paymentId: number) => {
  if (!confirm("Удалить платёж? Это нельзя отменить.")) return;
  await attempt(() => api(`/api/payments/${paymentId}`, { method: "DELETE" }), "Платёж удалён");
  await refresh();
};

const note = ref("");
async function addNote() {
  if (!note.value.trim()) return;
  const ok = await attempt(() => api(`/api/deals/${id.value}/notes`, { method: "POST", body: { text: note.value } }));
  if (ok) {
    note.value = "";
    await refresh();
  }
}
const task = reactive({ text: "", dueOn: "" });
async function addTask() {
  if (!task.text.trim()) return;
  const ok = await attempt(() => api(`/api/deals/${id.value}/tasks`, { method: "POST", body: { text: task.text, dueOn: task.dueOn || null } }));
  if (ok) {
    Object.assign(task, { text: "", dueOn: "" });
    await refresh();
  }
}
const toggleTask = async (taskId: number, done: boolean) => {
  await attempt(() => api(`/api/tasks/${taskId}`, { method: "PATCH", body: { done } }));
  await refresh();
};
async function removeDeal() {
  if (!confirm("Удалить сделку вместе с платежами, задачами и историей? Это нельзя отменить.")) return;
  if (await attempt(() => api(`/api/deals/${id.value}`, { method: "DELETE" }), "Сделка удалена")) await navigateTo("/deals");
}

const touchRows = (touch: Touch | null) => {
  if (!touch) return [];
  const rows: Array<[string, string]> = [];
  if (touch.src) rows.push(["utm_source", touch.src]);
  if (touch.med) rows.push(["utm_medium", touch.med]);
  if (touch.cmp) rows.push(["utm_campaign", touch.cmp]);
  if (touch.cnt) rows.push(["utm_content", touch.cnt]);
  if (touch.trm) rows.push(["utm_term", touch.trm]);
  if (touch.gclid) rows.push(["gclid", "есть"]);
  if (touch.yclid) rows.push(["yclid", "есть"]);
  if (touch.fbclid) rows.push(["fbclid", "есть"]);
  if (touch.ref) rows.push(["Откуда", touch.ref]);
  if (touch.land) rows.push(["Страница входа", touch.land]);
  return rows;
};
const EVENT_LABELS: Record<string, string> = {
  page_view: "Просмотр страницы", view_pricing: "Увидел цены", view_case: "Открыл кейс", cta_click: "Нажал кнопку", form_open: "Открыл форму",
  form_start: "Начал заполнять", form_submit: "Отправил форму", messenger_click: "Нажал мессенджер", phone_click: "Нажал телефон", lang_switch: "Сменил язык",
};
const journeyEvents = computed(() => (data.value?.journey?.events ?? []).filter((e) => !/^scroll_|^engaged_/.test(e.name)));
</script>

<template>
  <div v-if="error" class="text-muted-foreground py-20 text-center">Сделка не найдена. <NuxtLink to="/deals" class="underline">К воронке</NuxtLink></div>
  <div v-else-if="!data" class="grid gap-4"><Skeleton class="h-24 w-full" /><Skeleton class="h-96 w-full" /></div>
  <div v-else-if="deal" class="flex flex-col gap-4 md:gap-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <Button variant="ghost" size="icon-sm" as-child class="mt-0.5"><NuxtLink to="/deals" aria-label="К воронке"><ArrowLeft /></NuxtLink></Button>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="truncate text-xl font-semibold">{{ data.client?.name || deal.title || `Сделка #${deal.id}` }}</h2>
            <Badge variant="outline">#{{ deal.id }}</Badge>
            <Badge v-if="deal.isRepeat" variant="secondary">Повторная</Badge>
          </div>
          <p class="text-muted-foreground text-sm">
            {{ deal.contactName || "Без имени" }} · {{ DEAL_ORIGIN_LABELS[deal.origin as keyof typeof DEAL_ORIGIN_LABELS] ?? deal.origin }} · создана {{ formatDateTime(deal.createdAt) }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Select :model-value="String(deal.stageId)" :disabled="!canEdit" @update:model-value="changeStage">
          <SelectTrigger class="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="s in stages" :key="s.id" :value="String(s.id)">{{ s.name }}</SelectItem>
          </SelectContent>
        </Select>
        <Button v-if="canEdit" variant="outline" @click="openEdit">Изменить</Button>
        <Button v-if="isOwner" variant="ghost" size="icon" aria-label="Удалить сделку" @click="removeDeal"><Trash2 /></Button>
      </div>
    </div>

    <Alert v-if="data.lossReason" variant="destructive">
      <AlertTitle>Отказ: {{ data.lossReason.name }}</AlertTitle>
      <AlertDescription v-if="deal.lossComment">{{ deal.lossComment }}</AlertDescription>
    </Alert>

    <div class="grid gap-4 @5xl/main:grid-cols-3">
      <div class="grid content-start gap-4 @5xl/main:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Условия</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-4 @xl/main:grid-cols-4">
            <div><div class="text-muted-foreground text-xs">Сумма сделки</div><div class="text-lg font-semibold tabular-nums">{{ deal.amount !== null ? formatMoney(deal.amount, deal.currency) : "—" }}</div></div>
            <div><div class="text-muted-foreground text-xs">Оплачено</div><div class="text-lg font-semibold tabular-nums">{{ formatMoney(data.paid, deal.currency) }}</div></div>
            <div><div class="text-muted-foreground text-xs">Остаток</div><div class="text-lg font-semibold tabular-nums" :class="data.remaining ? 'text-amber-600 dark:text-amber-400' : ''">{{ data.remaining !== null ? formatMoney(data.remaining, deal.currency) : "—" }}</div></div>
            <div><div class="text-muted-foreground text-xs">Ожидаемое закрытие</div><div class="text-lg font-semibold">{{ formatDay(deal.expectedCloseOn) }}</div></div>
            <div class="@xl/main:col-span-2"><div class="text-muted-foreground text-xs">Услуги / пакет</div><div>{{ data.serviceNames.join(", ") || "—" }}</div></div>
            <div><div class="text-muted-foreground text-xs">Отрасль</div><div>{{ data.industry?.name ?? "—" }}</div></div>
            <div><div class="text-muted-foreground text-xs">Ответственный</div><div>{{ meta?.users.find((u) => u.id === deal!.ownerId)?.name ?? "—" }}</div></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Оплаты</CardTitle>
            <CardAction v-if="canEdit"><Button size="sm" variant="outline" @click="paymentKind = data.payments.length ? 'balance' : 'prepayment'; paymentOpen = true"><Plus />Платёж</Button></CardAction>
          </CardHeader>
          <CardContent>
            <Table v-if="data.payments.length">
              <TableHeader><TableRow><TableHead>Дата</TableHead><TableHead>Тип</TableHead><TableHead>Способ</TableHead><TableHead class="text-right">Сумма</TableHead><TableHead class="w-8" /></TableRow></TableHeader>
              <TableBody>
                <TableRow v-for="p in data.payments" :key="p.id">
                  <TableCell>{{ formatDay(p.paidOn) }}</TableCell>
                  <TableCell>{{ PAYMENT_KIND_LABELS[p.kind] }}</TableCell>
                  <TableCell>{{ PAYMENT_METHOD_LABELS[p.method] }}<span v-if="p.commissionPercent" class="text-muted-foreground text-xs"> · комиссия {{ p.commissionPercent }}%</span></TableCell>
                  <TableCell class="text-right tabular-nums">{{ formatMoney(p.amount, p.currency) }}</TableCell>
                  <TableCell><Button v-if="isOwner" variant="ghost" size="icon-xs" aria-label="Удалить платёж" @click="removePayment(p.id)"><Trash2 /></Button></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p v-else class="text-muted-foreground text-sm">Платежей ещё нет.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Себестоимость</CardTitle>
            <CardDescription>Подрядчики, печать, съёмка — для валовой прибыли и ROI</CardDescription>
            <CardAction v-if="canEdit"><Button size="sm" variant="outline" @click="costOpen = !costOpen"><Plus />Расход</Button></CardAction>
          </CardHeader>
          <CardContent class="grid gap-3">
            <form v-if="costOpen" class="grid gap-2 rounded-lg border p-3 @xl/main:grid-cols-[9rem_1fr_6rem_9rem_auto]" @submit.prevent="addCost">
              <NativeSelect v-model="cost.category"><option v-for="c in COST_CATEGORIES" :key="c" :value="c">{{ COST_CATEGORY_LABELS[c] }}</option></NativeSelect>
              <Input v-model="cost.amount" type="number" min="0.01" step="0.01" placeholder="Сумма" required />
              <NativeSelect v-model="cost.currency"><option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option></NativeSelect>
              <Input v-model="cost.spentOn" type="date" required />
              <Button type="submit">Добавить</Button>
            </form>
            <div v-for="c in data.costs" :key="c.id" class="flex items-center justify-between gap-2 text-sm">
              <span>{{ COST_CATEGORY_LABELS[c.category] }} <span class="text-muted-foreground">· {{ formatDay(c.spentOn) }}</span></span>
              <span class="flex items-center gap-1 tabular-nums">{{ formatMoney(c.amount, c.currency) }}<Button v-if="canEdit" variant="ghost" size="icon-xs" aria-label="Удалить" @click="removeCost(c.id)"><Trash2 /></Button></span>
            </div>
            <p v-if="!data.costs.length && !costOpen" class="text-muted-foreground text-sm">Не указана.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Путь клиента</CardTitle>
            <CardDescription>Откуда пришёл и что делал на сайте до заявки</CardDescription>
            <CardAction v-if="data.journey?.webvisorUrl">
              <Button size="sm" variant="outline" as-child><a :href="data.journey.webvisorUrl" target="_blank" rel="noopener"><ExternalLink />Запись визита</a></Button>
            </CardAction>
          </CardHeader>
          <CardContent class="grid gap-4">
            <div class="grid gap-4 @xl/main:grid-cols-2">
              <div class="grid content-start gap-1.5">
                <div class="text-sm font-medium">Первое касание · {{ channelName(deal.firstChannelId) }}</div>
                <dl class="grid grid-cols-[8rem_1fr] gap-x-2 gap-y-1 text-xs">
                  <template v-for="[k, v] in touchRows(deal.firstTouch)" :key="k"><dt class="text-muted-foreground">{{ k }}</dt><dd class="break-all">{{ v }}</dd></template>
                </dl>
                <p v-if="!deal.firstTouch" class="text-muted-foreground text-xs">Нет данных</p>
              </div>
              <div class="grid content-start gap-1.5">
                <div class="text-sm font-medium">Последний значимый переход · {{ channelName(deal.lastChannelId) }}</div>
                <dl class="grid grid-cols-[8rem_1fr] gap-x-2 gap-y-1 text-xs">
                  <template v-for="[k, v] in touchRows(deal.lastTouch)" :key="k"><dt class="text-muted-foreground">{{ k }}</dt><dd class="break-all">{{ v }}</dd></template>
                </dl>
                <p v-if="!deal.lastTouch" class="text-muted-foreground text-xs">Нет данных</p>
              </div>
            </div>
            <template v-if="data.journey">
              <Separator />
              <div class="grid grid-cols-3 gap-3 text-sm">
                <div><div class="text-muted-foreground text-xs">Визитов до заявки</div><div class="font-medium">{{ data.journey.visitsBeforeLead }}</div></div>
                <div><div class="text-muted-foreground text-xs">Время на сайте</div><div class="font-medium">{{ formatDuration(data.journey.activeSecondsBeforeLead) }}</div></div>
                <div><div class="text-muted-foreground text-xs">Страниц</div><div class="font-medium">{{ data.journey.pagesBeforeLead.length }}</div></div>
              </div>
              <div class="grid gap-1">
                <div v-for="v in data.journey.visits" :key="v.id" class="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs">
                  <span class="font-medium">{{ formatDateTime(v.startedAt) }}</span>
                  <span class="text-muted-foreground">{{ v.channel ?? "—" }} · {{ v.landing ?? "—" }}</span>
                  <span class="text-muted-foreground tabular-nums">{{ v.pageViews }} стр. · {{ formatDuration(v.activeSeconds) }} · {{ DEVICE_LABELS[v.device ?? ""] ?? v.device ?? "" }}</span>
                </div>
              </div>
              <ScrollArea class="h-56 rounded-md border">
                <ol class="grid gap-1 p-3 text-xs">
                  <li v-for="e in journeyEvents" :key="e.id" class="flex gap-3">
                    <span class="text-muted-foreground w-28 shrink-0 tabular-nums">{{ formatDateTime(e.at).slice(0, 17) }}</span>
                    <span class="font-medium">{{ EVENT_LABELS[e.name] ?? e.name }}</span>
                    <span class="text-muted-foreground truncate">{{ e.params?.button ?? e.params?.channel ?? e.page }}</span>
                  </li>
                </ol>
              </ScrollArea>
            </template>
            <p v-else class="text-muted-foreground text-sm">
              Визиты не связаны со сделкой: заявка пришла не через сайт или без кода обращения.
              <template v-if="canEdit">Если клиент назвал код (OB-…), добавьте его через «Изменить».</template>
            </p>
            <div class="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span v-if="deal.contactCode">Код обращения: <span class="text-foreground font-mono">{{ deal.contactCode }}</span></span>
              <span v-if="data.campaign">Кампания: {{ data.campaign.name }}</span>
              <span v-if="deal.page">Страница заявки: {{ deal.page }}</span>
              <span v-if="deal.language">Язык: {{ LANGUAGE_LABELS[deal.language] ?? deal.language }}</span>
              <span v-if="deal.device">Устройство: {{ DEVICE_LABELS[deal.device] ?? deal.device }}</span>
            </div>
          </CardContent>
        </Card>

        <Card v-if="data.messages.length">
          <CardHeader>
            <CardTitle>Переписка</CardTitle>
            <CardDescription>Только чтение; отвечайте из Telegram или Instagram</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea class="h-80 pr-3">
              <div class="grid gap-2">
                <div v-for="m in data.messages" :key="m.id" class="flex" :class="m.direction === 'out' ? 'justify-end' : 'justify-start'">
                  <div class="max-w-[80%] rounded-lg px-3 py-2 text-sm" :class="m.direction === 'out' ? 'bg-primary text-primary-foreground' : 'bg-muted'">
                    <div class="whitespace-pre-wrap">{{ m.text }}</div>
                    <div class="mt-1 text-[11px] opacity-70">{{ m.channel === "telegram" ? "Telegram" : "Instagram" }} · {{ formatDateTime(m.at) }}</div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div class="grid content-start gap-4">
        <Card>
          <CardHeader><CardTitle>Контакты</CardTitle></CardHeader>
          <CardContent class="grid gap-3 text-sm">
            <div class="flex flex-wrap gap-2">
              <Button v-if="phone" size="sm" as-child><a :href="`tel:${phone}`"><Phone />Позвонить</a></Button>
              <Button v-if="data.client?.telegram || phone" size="sm" variant="outline" as-child>
                <a :href="data.client?.telegram ? `https://t.me/${data.client.telegram}` : `https://t.me/+${digits(phone)}`" target="_blank" rel="noopener"><Send />Telegram</a>
              </Button>
              <Button v-if="data.client?.whatsapp || data.client?.phone" size="sm" variant="outline" as-child>
                <a :href="`https://wa.me/${digits(data.client?.whatsapp || data.client?.phone)}`" target="_blank" rel="noopener"><MessageCircle />WhatsApp</a>
              </Button>
            </div>
            <dl class="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1.5">
              <dt class="text-muted-foreground">Телефон</dt><dd>{{ data.client?.phone ?? "—" }}</dd>
              <dt class="text-muted-foreground">Telegram</dt><dd>{{ data.client?.telegram ? `@${data.client.telegram}` : "—" }}</dd>
              <dt class="text-muted-foreground">WhatsApp</dt><dd>{{ data.client?.whatsapp ?? "—" }}</dd>
              <dt class="text-muted-foreground">Instagram</dt><dd>{{ data.client?.instagram ?? "—" }}</dd>
              <dt class="text-muted-foreground">E-mail</dt><dd class="break-all">{{ data.client?.email ?? "—" }}</dd>
            </dl>
            <NuxtLink v-if="data.client" :to="`/clients/${data.client.id}`" class="text-sm underline underline-offset-4">Карточка клиента</NuxtLink>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Задачи</CardTitle></CardHeader>
          <CardContent class="grid gap-3">
            <form v-if="canEdit" class="grid gap-2" @submit.prevent="addTask">
              <Input v-model="task.text" placeholder="Например: перезвонить" />
              <div class="flex gap-2"><Input v-model="task.dueOn" type="date" /><Button type="submit" variant="outline" :disabled="!task.text.trim()">Добавить</Button></div>
            </form>
            <label v-for="t in data.tasks" :key="t.id" class="flex items-start gap-2 text-sm">
              <Checkbox :model-value="t.done" :disabled="!canEdit" class="mt-0.5" @update:model-value="(v) => toggleTask(t.id, !!v)" />
              <span :class="t.done && 'text-muted-foreground line-through'">
                {{ t.text }}
                <span v-if="t.dueOn" class="text-xs" :class="!t.done && t.dueOn < tashkentDay() ? 'text-red-600' : 'text-muted-foreground'"> · до {{ formatDay(t.dueOn) }}</span>
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Заметки</CardTitle></CardHeader>
          <CardContent class="grid gap-3">
            <form v-if="canEdit" class="grid gap-2" @submit.prevent="addNote">
              <Textarea v-model="note" placeholder="Что обсудили, договорённости…" rows="3" />
              <Button type="submit" variant="outline" size="sm" class="justify-self-end" :disabled="!note.trim()">Сохранить</Button>
            </form>
            <div v-for="n in data.notes" :key="n.id" class="grid gap-1 rounded-md border p-3 text-sm">
              <div class="whitespace-pre-wrap">{{ n.text }}</div>
              <div class="text-muted-foreground text-xs">{{ n.author ?? "—" }} · {{ formatDateTime(n.createdAt) }}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>История этапов</CardTitle></CardHeader>
          <CardContent>
            <ol class="relative grid gap-3 border-l pl-4 text-sm">
              <li v-for="h in data.history" :key="h.id" class="relative">
                <span class="bg-primary absolute top-1.5 -left-[21px] size-2 rounded-full" />
                <div>{{ h.from ? `${h.from} → ` : "" }}<span class="font-medium">{{ h.to }}</span></div>
                <div class="text-muted-foreground text-xs">{{ h.user ?? "Система" }} · {{ formatDateTime(h.at) }}</div>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card v-if="data.otherDeals.length">
          <CardHeader><CardTitle>Другие сделки клиента</CardTitle></CardHeader>
          <CardContent class="grid gap-2">
            <NuxtLink v-for="o in data.otherDeals" :key="o.id" :to="`/deals/${o.id}`" class="hover:bg-muted/50 flex justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span>#{{ o.id }} · {{ o.stage }}</span>
              <span class="tabular-nums">{{ o.amount !== null ? formatMoney(o.amount, o.currency) : "—" }}</span>
            </NuxtLink>
          </CardContent>
        </Card>
      </div>
    </div>

    <PaymentDialog v-model:open="paymentOpen" :deal-id="deal.id" :currency="deal.currency" :kind="paymentKind" :remaining="data.remaining" @saved="onPaymentSaved" />
    <LossDialog v-model:open="lossOpen" @confirm="onLoss" @cancel="pendingStage = null" />

    <Sheet v-model:open="editOpen">
      <SheetContent class="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>Сделка #{{ deal.id }}</SheetTitle></SheetHeader>
        <form class="grid gap-4 px-4 pb-4" @submit.prevent="saveEdit">
          <div class="grid grid-cols-2 gap-3">
            <Field><FieldLabel>Название</FieldLabel><Input v-model="edit.title" /></Field>
            <Field><FieldLabel>Имя контакта</FieldLabel><Input v-model="edit.contactName" /></Field>
            <Field><FieldLabel>Телефон</FieldLabel><Input v-model="edit.phone" type="tel" /></Field>
            <Field><FieldLabel>Telegram</FieldLabel><Input v-model="edit.telegram" /></Field>
            <Field><FieldLabel>WhatsApp</FieldLabel><Input v-model="edit.whatsapp" type="tel" /></Field>
            <Field><FieldLabel>Instagram</FieldLabel><Input v-model="edit.instagram" /></Field>
          </div>
          <Field><FieldLabel>E-mail</FieldLabel><Input v-model="edit.email" type="email" /></Field>
          <Field>
            <FieldLabel>Отрасль</FieldLabel>
            <NativeSelect v-model="edit.industryId"><option value="">—</option><option v-for="i in meta?.industries ?? []" :key="i.id" :value="String(i.id)">{{ i.name }}</option></NativeSelect>
          </Field>
          <Field><FieldLabel>Услуги / пакет</FieldLabel><ServicePicker v-model="edit.serviceIds" /></Field>
          <div class="grid grid-cols-[1fr_7rem] gap-2">
            <Field><FieldLabel>Сумма сделки</FieldLabel><Input v-model="edit.amount" type="number" min="0" step="0.01" /></Field>
            <Field><FieldLabel>Валюта</FieldLabel><NativeSelect v-model="edit.currency"><option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option></NativeSelect></Field>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <Field><FieldLabel>Ожидаемое закрытие</FieldLabel><Input v-model="edit.expectedCloseOn" type="date" /></Field>
            <Field>
              <FieldLabel>Ответственный</FieldLabel>
              <NativeSelect v-model="edit.ownerId"><option value="">—</option><option v-for="u in meta?.users ?? []" :key="u.id" :value="String(u.id)">{{ u.name }}</option></NativeSelect>
            </Field>
          </div>
          <FieldSeparator>Источник</FieldSeparator>
          <Field>
            <FieldLabel>Код обращения</FieldLabel>
            <Input v-model="edit.contactCode" placeholder="OB-1042" />
            <FieldDescription>Новый код заменит источник и визиты данными посетителя с этим кодом.</FieldDescription>
          </Field>
          <div class="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Первое касание</FieldLabel>
              <NativeSelect v-model="edit.firstChannelId"><option value="">Не определён</option><option v-for="c in meta?.channels ?? []" :key="c.id" :value="String(c.id)">{{ c.name }}</option></NativeSelect>
            </Field>
            <Field>
              <FieldLabel>Последний переход</FieldLabel>
              <NativeSelect v-model="edit.lastChannelId"><option value="">Не определён</option><option v-for="c in meta?.channels ?? []" :key="c.id" :value="String(c.id)">{{ c.name }}</option></NativeSelect>
            </Field>
          </div>
          <Field orientation="horizontal">
            <Checkbox id="repeat" v-model="edit.isRepeat" />
            <FieldLabel for="repeat">Повторная продажа</FieldLabel>
          </Field>
          <SheetFooter class="px-0"><Button type="submit">Сохранить</Button></SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>
