<script setup lang="ts">
// The UTM link builder (spec 5): pick the channel and the campaign, get the
// tagged link; the campaign is saved so its spend attaches to its leads.
// utm_campaign follows YYYYMM_channel_service_geo.
import { Copy, Trash2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import { tashkentDay } from "#shared/utils/time";
import type { SettingsData } from "~/utils/types";

const props = defineProps<{ data: SettingsData }>();
const emit = defineEmits<{ saved: [] }>();
const { meta, channelName, isOwner } = useMeta();

const channels = computed(() => (meta.value?.channels ?? []).filter((c) => c.isActive && c.rules.some((r) => r.source || r.medium)));
const form = reactive({ channelId: "", source: "", medium: "", service: "branding", geo: "tas", suffix: "", content: "", placement: "", path: "/" });
watch(() => form.channelId, (id) => {
  const channel = channels.value.find((c) => String(c.id) === id);
  const rule = channel?.rules.find((r) => r.source && r.medium) ?? channel?.rules.find((r) => r.source || r.medium);
  form.source = rule?.source ?? "";
  form.medium = rule?.medium ?? "";
});
const slug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const campaign = computed(() => [tashkentDay().slice(0, 7).replace("-", ""), slug(form.source) || "channel", slug(form.service) || "service", slug(form.geo) || "geo", slug(form.suffix)].filter(Boolean).join("_"));
const preview = computed(() => {
  const url = new URL(form.path.startsWith("/") ? form.path : `/${form.path}`, meta.value?.siteUrl || "https://onebrandingworld.com");
  url.searchParams.set("utm_source", form.source || "…");
  url.searchParams.set("utm_medium", form.medium || "…");
  url.searchParams.set("utm_campaign", campaign.value);
  if (form.content) url.searchParams.set("utm_content", slug(form.content));
  return url.toString();
});
const result = ref("");

async function create() {
  const response = await attempt(() => api<{ url: string }>("/api/settings/campaigns", {
    method: "POST",
    body: {
      channelId: Number(form.channelId), utmSource: form.source, utmMedium: form.medium, utmCampaign: campaign.value,
      utmContent: form.content ? slug(form.content) : null, name: campaign.value, placement: form.placement || form.content || null, path: form.path || "/",
    },
  }), "Кампания сохранена");
  if (response) {
    result.value = response.url;
    emit("saved");
  }
}
const copy = async (text: string) => {
  await navigator.clipboard.writeText(text);
  toast.success("Ссылка скопирована");
};
const remove = async (id: number) => {
  if (!confirm("Удалить кампанию?")) return;
  if (await attempt(() => api(`/api/settings/campaigns/${id}`, { method: "DELETE" }), "Удалено")) emit("saved");
};
const SERVICES = ["branding", "logo", "packaging", "identity", "brandbook", "naming", "web", "smm", "presentation"];
</script>

<template>
  <div class="grid gap-4 @5xl/main:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Генератор UTM-ссылок</CardTitle>
        <CardDescription>Любая ссылка из рекламы, от блогера или из поста — только с метками. Называйте кампанию в рекламном кабинете так же, как utm_campaign: так расходы свяжутся с лидами.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="create">
          <Field>
            <FieldLabel>Канал</FieldLabel>
            <NativeSelect v-model="form.channelId" required>
              <option value="" disabled>Выберите канал</option>
              <option v-for="c in channels" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
            </NativeSelect>
          </Field>
          <div class="grid grid-cols-2 gap-3">
            <Field><FieldLabel>utm_source</FieldLabel><Input v-model="form.source" required /></Field>
            <Field><FieldLabel>utm_medium</FieldLabel><Input v-model="form.medium" required /></Field>
            <Field>
              <FieldLabel>Услуга</FieldLabel>
              <Input v-model="form.service" list="utm-services" />
              <datalist id="utm-services"><option v-for="s in SERVICES" :key="s" :value="s" /></datalist>
            </Field>
            <Field><FieldLabel>Гео</FieldLabel><Input v-model="form.geo" placeholder="tas, uz, kz" /></Field>
          </div>
          <Field><FieldLabel>Уточнение (необязательно)</FieldLabel><Input v-model="form.suffix" placeholder="spring, retarget" /></Field>
          <Field>
            <FieldLabel>utm_content</FieldLabel>
            <Input v-model="form.content" placeholder="Креатив, имя блогера или канала посева" />
          </Field>
          <Field><FieldLabel>Страница сайта</FieldLabel><Input v-model="form.path" placeholder="/ru/services/brending" /></Field>
          <div class="bg-muted rounded-lg p-3 font-mono text-xs break-all">{{ preview }}</div>
          <Button type="submit" :disabled="!form.channelId || !form.source || !form.medium">Сохранить кампанию и получить ссылку</Button>
          <div v-if="result" class="flex items-center gap-2 rounded-lg border p-3">
            <code class="flex-1 text-xs break-all">{{ result }}</code>
            <Button type="button" size="sm" variant="outline" @click="copy(result)"><Copy />Копировать</Button>
          </div>
        </form>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Кампании</CardTitle><CardDescription>Созданные здесь и пришедшие из рекламных кабинетов</CardDescription></CardHeader>
      <CardContent>
        <ScrollArea class="h-[32rem]">
          <div class="grid gap-2 pr-3">
            <div v-for="c in props.data.campaigns" :key="c.id" class="flex items-start justify-between gap-2 rounded-lg border p-3 text-sm">
              <div class="min-w-0">
                <div class="truncate font-mono text-xs">{{ c.utmCampaign }}</div>
                <div class="text-muted-foreground text-xs">{{ channelName(c.channelId) }}<span v-if="c.placement"> · {{ c.placement }}</span><span v-if="c.externalId"> · API</span></div>
              </div>
              <Button v-if="isOwner" variant="ghost" size="icon-xs" aria-label="Удалить" @click="remove(c.id)"><Trash2 /></Button>
            </div>
            <p v-if="!props.data.campaigns.length" class="text-muted-foreground text-sm">Кампаний пока нет.</p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  </div>
</template>
