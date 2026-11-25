<script setup lang="ts">
// Month plans: leads and revenue, for this month and the next five.
import { addDays, monthStart, tashkentDay } from "#shared/utils/time";
import type { SettingsData } from "~/utils/types";

const props = defineProps<{ data: SettingsData }>();
const emit = defineEmits<{ saved: [] }>();
const months = (() => {
  const list: string[] = [];
  let month = monthStart(tashkentDay());
  month = monthStart(addDays(month, -1));
  for (let i = 0; i < 7; i += 1) {
    list.push(month);
    month = monthStart(addDays(month, 32));
  }
  return list;
})();
const rows = reactive(months.map((month) => {
  const plan = props.data.plans.find((p) => p.month === month);
  return { month, leads: plan?.leads ?? ("" as number | string), revenue: plan?.revenue ?? ("" as number | string), currency: plan?.currency ?? "USD" };
}));
const label = (month: string) => new Date(`${month}T00:00:00Z`).toLocaleDateString("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" });
async function save() {
  const ok = await attempt(() => api("/api/settings/plans", {
    method: "PUT",
    body: rows.map((r) => ({ month: r.month, leads: r.leads === "" ? null : Number(r.leads), revenue: r.revenue === "" ? null : Number(r.revenue), currency: r.currency })),
  }), "План сохранён");
  if (ok) emit("saved");
}
</script>

<template>
  <Card class="max-w-3xl">
    <CardHeader>
      <CardTitle>План на месяц</CardTitle>
      <CardDescription>Лиды и выручка; на сводке и в финансах показывается план/факт</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-2">
      <div class="text-muted-foreground grid grid-cols-[1fr_7rem_9rem_6rem] gap-2 px-1 text-xs"><span>Месяц</span><span>Лиды</span><span>Выручка</span><span>Валюта</span></div>
      <div v-for="row in rows" :key="row.month" class="grid grid-cols-[1fr_7rem_9rem_6rem] items-center gap-2">
        <span class="text-sm capitalize">{{ label(row.month) }}</span>
        <Input v-model="row.leads" type="number" min="0" />
        <Input v-model="row.revenue" type="number" min="0" />
        <NativeSelect v-model="row.currency"><option value="USD">USD</option><option value="UZS">UZS</option></NativeSelect>
      </div>
    </CardContent>
    <CardFooter class="justify-end"><Button @click="save">Сохранить план</Button></CardFooter>
  </Card>
</template>
