<script setup lang="ts">
// Funnel stages (rename, reorder, add your own) and refusal reasons.
import type { LossReason, Stage } from "~/composables/useSession";

type StageRow = Partial<Stage> & { name: string };
type ReasonRow = Partial<LossReason> & { name: string };

const emit = defineEmits<{ saved: [] }>();
const { meta } = useMeta();
const stages = ref<StageRow[]>(deepCopy(meta.value?.stages ?? []));
const reasons = ref<ReasonRow[]>(deepCopy((meta.value?.lossReasons ?? []).filter((r) => r.isActive)));
const newStage = (): StageRow => ({ name: "Новый этап", kind: "open", requiresPayment: false });
const newReason = (): ReasonRow => ({ name: "" });
const KIND: Record<string, string> = { open: "В работе", won: "Успех", lost: "Отказ" };

async function saveStages() {
  const ok = await attempt(() => api("/api/settings/lists/stages", {
    method: "PUT",
    body: stages.value.map((s) => ({ id: s.id ?? null, name: s.name, kind: s.kind ?? "open", requiresPayment: !!s.requiresPayment })),
  }), "Этапы сохранены");
  if (ok) emit("saved");
}
async function saveReasons() {
  const ok = await attempt(() => api("/api/settings/lists/loss-reasons", {
    method: "PUT",
    body: reasons.value.map((r) => ({ id: r.id ?? null, name: r.name, key: r.key ?? null, isActive: true })),
  }), "Причины сохранены");
  if (ok) emit("saved");
}
</script>

<template>
  <div class="grid gap-4 @5xl/main:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Этапы воронки</CardTitle>
        <CardDescription>Встроенные этапы нельзя удалить: на них держатся метрики. Можно переименовать и добавить свои.</CardDescription>
      </CardHeader>
      <CardContent>
        <EditableList v-model="stages" :new-item="newStage" :can-remove="(s) => !s.isSystem" add-label="Добавить этап">
          <template #extra="{ item }">
            <Badge variant="outline">{{ KIND[item.kind ?? "open"] }}</Badge>
            <Label class="flex items-center gap-1.5 text-xs font-normal"><Checkbox v-model="item.requiresPayment" />Нужен платёж</Label>
          </template>
        </EditableList>
      </CardContent>
      <CardFooter class="justify-end"><Button @click="saveStages">Сохранить этапы</Button></CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Причины отказа</CardTitle>
        <CardDescription>«Спам» и «Не целевой» не считаются квалифицированными лидами.</CardDescription>
      </CardHeader>
      <CardContent>
        <EditableList v-model="reasons" :new-item="newReason" :can-remove="(r) => !r.key" add-label="Добавить причину" />
      </CardContent>
      <CardFooter class="justify-end"><Button @click="saveReasons">Сохранить причины</Button></CardFooter>
    </Card>
  </div>
</template>
