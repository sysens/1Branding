<script setup lang="ts">
// Tasks with due dates across all deals: overdue, today, later.
import { tashkentDay } from "#shared/utils/time";

definePageMeta({ title: "Задачи" });
useHead({ title: "Задачи · OneBranding" });

type Task = { id: number; dealId: number | null; text: string; dueOn: string | null; done: boolean; dealTitle: string | null; client: string | null; assignee: string | null };
const { canEdit } = useMeta();
const { data, refresh, pending } = await useAsyncData("tasks", () => api<{ open: Task[]; done: Task[] }>("/api/tasks"), { server: false, lazy: true });
const today = tashkentDay();
const groups = computed(() => {
  const open = data.value?.open ?? [];
  return [
    { title: "Просрочено", items: open.filter((t) => t.dueOn && t.dueOn < today), tone: "text-red-600 dark:text-red-400" },
    { title: "Сегодня", items: open.filter((t) => t.dueOn === today), tone: "" },
    { title: "Позже", items: open.filter((t) => !t.dueOn || t.dueOn > today), tone: "" },
  ];
});
const toggle = async (task: Task) => {
  await attempt(() => api(`/api/tasks/${task.id}`, { method: "PATCH", body: { done: !task.done } }));
  await refresh();
};
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-6">
    <div class="grid gap-4 @5xl/main:grid-cols-3">
      <Card v-for="group in groups" :key="group.title">
        <CardHeader>
          <CardTitle :class="group.tone">{{ group.title }}</CardTitle>
          <CardAction><Badge variant="secondary">{{ group.items.length }}</Badge></CardAction>
        </CardHeader>
        <CardContent class="grid gap-2">
          <Skeleton v-if="pending && !data" class="h-20 w-full" />
          <div v-for="t in group.items" :key="t.id" class="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox :model-value="t.done" :disabled="!canEdit" class="mt-0.5" @update:model-value="toggle(t)" />
            <div class="min-w-0 text-sm">
              <div>{{ t.text }}</div>
              <div class="text-muted-foreground text-xs">
                <NuxtLink v-if="t.dealId" :to="`/deals/${t.dealId}`" class="underline-offset-4 hover:underline">{{ t.client ?? t.dealTitle ?? `#${t.dealId}` }}</NuxtLink>
                <span v-if="t.dueOn"> · до {{ formatDay(t.dueOn) }}</span>
                <span v-if="t.assignee"> · {{ t.assignee }}</span>
              </div>
            </div>
          </div>
          <p v-if="data && !group.items.length" class="text-muted-foreground text-sm">Нет задач</p>
        </CardContent>
      </Card>
    </div>
    <Card v-if="data?.done.length">
      <CardHeader><CardTitle>Выполнено за 2 недели</CardTitle></CardHeader>
      <CardContent class="grid gap-1.5">
        <div v-for="t in data.done" :key="t.id" class="text-muted-foreground flex items-center gap-3 text-sm">
          <Checkbox :model-value="true" :disabled="!canEdit" @update:model-value="toggle(t)" />
          <span class="line-through">{{ t.text }}</span>
          <NuxtLink v-if="t.dealId" :to="`/deals/${t.dealId}`" class="text-xs underline-offset-4 hover:underline">{{ t.client ?? t.dealTitle }}</NuxtLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
