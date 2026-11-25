<script setup lang="ts">
// A card on the board (spec 6.2): name, company, service, amount, source,
// days on the stage; flags for "no answer in 15 min" and "idle N days".
import { CheckSquare, Clock, Repeat } from "@lucide/vue";
import type { BoardDeal } from "~/utils/types";


const props = defineProps<{ deal: BoardDeal }>();
const { channelName, channelColor, serviceNames } = useMeta();
const services = computed(() => serviceNames(props.deal.service_ids));
</script>

<template>
  <NuxtLink
    :to="`/deals/${deal.id}`"
    :data-id="deal.id"
    class="bg-card hover:border-foreground/20 block rounded-lg border p-3 text-sm shadow-xs transition-colors select-none"
    :class="deal.overdue && 'border-red-500/60 ring-1 ring-red-500/30'"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="truncate font-medium">{{ deal.client || deal.title || `Сделка #${deal.id}` }}</div>
        <div v-if="deal.contact_name && deal.contact_name !== deal.client" class="text-muted-foreground truncate text-xs">{{ deal.contact_name }}</div>
      </div>
      <span class="text-muted-foreground shrink-0 text-xs tabular-nums">#{{ deal.id }}</span>
    </div>
    <div v-if="services.length" class="text-muted-foreground mt-1.5 line-clamp-1 text-xs">{{ services.join(", ") }}</div>
    <div class="mt-2 flex items-center justify-between gap-2">
      <span class="font-medium tabular-nums">{{ deal.amount !== null ? formatMoney(deal.amount, deal.currency) : "—" }}</span>
      <span class="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
        <span class="size-2 shrink-0 rounded-full" :style="{ background: channelColor(deal.channel_id) }" />
        <span class="truncate">{{ channelName(deal.channel_id) }}</span>
      </span>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <Badge v-if="deal.overdue" variant="destructive">Нет ответа</Badge>
      <Badge v-else-if="deal.stale" variant="outline" class="text-amber-600 dark:text-amber-400">Без движения</Badge>
      <Badge v-if="deal.is_repeat" variant="secondary"><Repeat />Повторная</Badge>
      <span class="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
        <span v-if="deal.open_tasks" class="flex items-center gap-0.5"><CheckSquare class="size-3" />{{ deal.open_tasks }}</span>
        <span class="flex items-center gap-0.5 tabular-nums"><Clock class="size-3" />{{ deal.days_on_stage }} дн.</span>
      </span>
    </div>
  </NuxtLink>
</template>
