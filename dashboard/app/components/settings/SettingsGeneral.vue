<script setup lang="ts">
// Working hours, response target, idle days, report defaults, links, notifications.
import { ATTRIBUTION_LABELS } from "#shared/utils/constants";
import type { SettingsData } from "~/utils/types";

const props = defineProps<{ data: SettingsData }>();
const emit = defineEmits<{ saved: [] }>();
const g = props.data.general;
const state = reactive({
  days: [...g.workSchedule.days],
  start: g.workSchedule.start,
  end: g.workSchedule.end,
  responseTargetMinutes: g.responseTargetMinutes,
  staleDays: g.staleDays,
  reportCurrency: g.reportCurrency,
  attribution: g.attribution,
  notifications: { ...g.notifications },
  metrikaCounterId: g.links?.metrikaCounterId ?? "",
  lookerStudioUrl: g.links?.lookerStudioUrl ?? "",
});
const lookerUrl = computed({ get: () => state.lookerStudioUrl, set: (v: string) => { state.lookerStudioUrl = v; } });
const isOn = (key: string) => state.notifications[key] !== false;
const setOn = (key: string, value: boolean) => { state.notifications[key] = value; };
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const NOTIFICATIONS: Record<string, string> = {
  newLead: "Новая заявка — сразу",
  unanswered: "Заявка без ответа 15 минут",
  payment: "Платёж внесён",
  dailyTasks: "Задачи на день — 10:00",
  daySummary: "Итоги дня — 19:30",
  weekSummary: "Итоги недели — понедельник 10:00",
  integrationFailure: "Сбой интеграции (нет данных 24 ч)",
};
const toggleDay = (day: number) => {
  state.days = state.days.includes(day) ? state.days.filter((d) => d !== day) : [...state.days, day].sort();
};
async function save() {
  const ok = await attempt(() => api("/api/settings/general", {
    method: "PUT",
    body: {
      workSchedule: { days: state.days, start: state.start, end: state.end },
      responseTargetMinutes: Number(state.responseTargetMinutes),
      staleDays: Number(state.staleDays),
      reportCurrency: state.reportCurrency,
      attribution: state.attribution,
      notifications: state.notifications,
      links: { metrikaCounterId: state.metrikaCounterId.trim(), lookerStudioUrl: state.lookerStudioUrl.trim() },
    },
  }), "Настройки сохранены");
  if (ok) emit("saved");
}
</script>

<template>
  <form class="grid gap-4 @5xl/main:grid-cols-2" @submit.prevent="save">
    <Card>
      <CardHeader>
        <CardTitle>Рабочее время</CardTitle>
        <CardDescription>По нему считаются скорость ответа и напоминание «без ответа»</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="flex flex-wrap gap-1.5">
          <Button v-for="(label, i) in WEEKDAYS" :key="label" type="button" size="sm" :variant="state.days.includes(i + 1) ? 'default' : 'outline'" @click="toggleDay(i + 1)">{{ label }}</Button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <Field><FieldLabel>Начало</FieldLabel><Input v-model="state.start" type="time" /></Field>
          <Field><FieldLabel>Конец</FieldLabel><Input v-model="state.end" type="time" /></Field>
          <Field><FieldLabel>Норма ответа, мин</FieldLabel><Input v-model="state.responseTargetMinutes" type="number" min="1" /></Field>
          <Field><FieldLabel>«Без движения» через, дней</FieldLabel><Input v-model="state.staleDays" type="number" min="1" /></Field>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Отчёты по умолчанию</CardTitle></CardHeader>
      <CardContent class="grid gap-4">
        <Field>
          <FieldLabel>Валюта отчётов</FieldLabel>
          <ToggleGroup v-model="state.reportCurrency" type="single" variant="outline" class="justify-start">
            <ToggleGroupItem value="USD" class="px-4">USD</ToggleGroupItem>
            <ToggleGroupItem value="UZS" class="px-4">UZS</ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <Field>
          <FieldLabel>Модель атрибуции</FieldLabel>
          <NativeSelect v-model="state.attribution"><option v-for="(label, key) in ATTRIBUTION_LABELS" :key="key" :value="key">{{ label }}</option></NativeSelect>
        </Field>
        <Field>
          <FieldLabel>Номер счётчика Яндекс Метрики</FieldLabel>
          <Input v-model="state.metrikaCounterId" inputmode="numeric" placeholder="12345678" />
          <FieldDescription>Для ссылок «Запись визита» и «Тепловые карты и Вебвизор».</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Отчёт в Looker Studio</FieldLabel>
          <Input v-model="lookerUrl" placeholder="https://lookerstudio.google.com/reporting/..." />
        </Field>
      </CardContent>
    </Card>
    <Card class="@5xl/main:col-span-2">
      <CardHeader>
        <CardTitle>Уведомления в Telegram</CardTitle>
        <CardDescription>Бот пишет в общий чат владельцев (Подключения → Telegram)</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-3 @3xl/main:grid-cols-2">
        <Label v-for="(label, key) in NOTIFICATIONS" :key="key" class="flex items-center justify-between gap-3 rounded-lg border p-3 font-normal">
          {{ label }}
          <Switch :model-value="isOn(key)" @update:model-value="(v: boolean) => setOn(key, v)" />
        </Label>
      </CardContent>
      <CardFooter class="justify-end"><Button type="submit">Сохранить</Button></CardFooter>
    </Card>
  </form>
</template>
