<script setup lang="ts">
// Channels: name, where their spend comes from, marketplace commission,
// colour, and the "UTM → channel" rules (spec 5).
import { Plus, X } from "@lucide/vue";
import type { Channel, ChannelRuleRow } from "~/composables/useSession";

const emit = defineEmits<{ saved: [] }>();
const { meta } = useMeta();
const channels = ref<Array<Partial<Channel> & { name: string; rules: ChannelRuleRow[] }>>(deepCopy((meta.value?.channels ?? []).filter((c) => c.isActive)));
const SYSTEM = ["direct", "other", "unknown"];
const COST: Record<string, string> = { api: "API, авто", manual: "Вручную", none: "Без расходов" };

const ruleText = (rule: ChannelRuleRow) =>
  [rule.source && `source=${rule.source}`, rule.medium && `medium=${rule.medium}`, rule.clickId && `${rule.clickId}`, rule.referrer && `с сайта ${rule.referrer}`].filter(Boolean).join(" · ");
const draft = reactive<Record<number, { kind: "utm" | "referrer"; source: string; medium: string; referrer: string }>>({});
const addRule = (index: number) => {
  const d = draft[index];
  if (!d) return;
  const rule: ChannelRuleRow = d.kind === "utm"
    ? { ...(d.source ? { source: d.source.trim() } : {}), ...(d.medium ? { medium: d.medium.trim() } : {}) }
    : { referrer: d.referrer.trim() };
  if (!Object.keys(rule).length || (d.kind === "referrer" && !d.referrer.trim())) return;
  channels.value[index]!.rules = [...channels.value[index]!.rules, rule];
  draft[index] = { kind: d.kind, source: "", medium: "", referrer: "" };
};

async function save() {
  const ok = await attempt(() => api("/api/settings/lists/channels", {
    method: "PUT",
    body: channels.value.map((c) => ({
      id: c.id ?? null, name: c.name, key: c.key, costMode: c.costMode ?? "manual", commissionPercent: Number(c.commissionPercent ?? 0),
      color: c.color || null, isActive: true, rules: c.rules,
    })),
  }), "Каналы сохранены");
  if (ok) emit("saved");
}
async function recompute() {
  const result = await attempt(() => api<{ message: string }>("/api/settings/actions", { method: "POST", body: { action: "recompute_channels" } }));
  if (result) {
    const { toast } = await import("vue-sonner");
    toast.success(result.message);
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Каналы и правила «UTM → канал»</CardTitle>
      <CardDescription>
        Сначала проверяются UTM-метки, затем gclid / yclid, затем сайт, с которого пришли. Без признаков — «Прямой заход», с неизвестными метками — «Другие сайты».
      </CardDescription>
      <CardAction><Button variant="outline" size="sm" @click="recompute">Пересчитать визиты</Button></CardAction>
    </CardHeader>
    <CardContent class="grid gap-3">
      <div v-for="(channel, index) in channels" :key="channel.id ?? `n${index}`" class="grid gap-3 rounded-lg border p-3">
        <div class="flex flex-wrap items-center gap-2">
          <input v-model="channel.color" type="color" class="size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5" aria-label="Цвет">
          <Input v-model="channel.name" class="min-w-40 flex-1" />
          <NativeSelect v-model="channel.costMode" size="sm" class="w-36"><option v-for="(label, key) in COST" :key="key" :value="key">{{ label }}</option></NativeSelect>
          <div class="flex items-center gap-1.5">
            <Input v-model="channel.commissionPercent" type="number" min="0" max="100" step="0.1" class="h-8 w-20" aria-label="Комиссия площадки, %" />
            <span class="text-muted-foreground text-xs">% комиссии</span>
          </div>
          <Button v-if="!SYSTEM.includes(channel.key ?? '')" variant="ghost" size="icon-sm" aria-label="Удалить канал" @click="channels.splice(index, 1)"><X /></Button>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <Badge v-for="(rule, r) in channel.rules" :key="r" variant="secondary" class="gap-1 font-mono text-[11px]">
            {{ ruleText(rule) }}
            <button type="button" aria-label="Убрать правило" @click="channel.rules.splice(r, 1)"><X class="size-3" /></button>
          </Badge>
          <span v-if="!channel.rules.length" class="text-muted-foreground text-xs">Нет правил</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <NativeSelect :model-value="draft[index]?.kind ?? 'utm'" size="sm" class="w-32" @change="(e: Event) => (draft[index] = { kind: (e.target as HTMLSelectElement).value as 'utm' | 'referrer', source: '', medium: '', referrer: '' })">
            <option value="utm">По UTM</option>
            <option value="referrer">По сайту</option>
          </NativeSelect>
          <template v-if="(draft[index]?.kind ?? 'utm') === 'utm'">
            <Input :model-value="draft[index]?.source ?? ''" placeholder="utm_source" class="h-8 w-32" @update:model-value="(v) => (draft[index] = { ...(draft[index] ?? { kind: 'utm', medium: '', referrer: '' }), source: String(v) })" />
            <Input :model-value="draft[index]?.medium ?? ''" placeholder="utm_medium" class="h-8 w-32" @update:model-value="(v) => (draft[index] = { ...(draft[index] ?? { kind: 'utm', source: '', referrer: '' }), medium: String(v) })" />
          </template>
          <Input v-else :model-value="draft[index]?.referrer ?? ''" placeholder="instagram.com" class="h-8 w-48" @update:model-value="(v) => (draft[index] = { ...(draft[index] ?? { kind: 'referrer', source: '', medium: '' }), referrer: String(v) })" />
          <Button type="button" variant="outline" size="sm" @click="addRule(index)"><Plus />Правило</Button>
        </div>
      </div>
      <Button variant="outline" size="sm" class="justify-self-start" @click="channels.push({ name: 'Новый канал', costMode: 'manual', commissionPercent: 0, color: '#64748b', rules: [] })"><Plus />Добавить канал</Button>
    </CardContent>
    <CardFooter class="justify-end"><Button @click="save">Сохранить каналы</Button></CardFooter>
  </Card>
</template>
