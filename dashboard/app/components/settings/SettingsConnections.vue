<script setup lang="ts">
// API tokens and ids (stored encrypted; only "set / not set" comes back),
// plus the buttons to connect the Telegram webhook, test notifications,
// load CBU rates and refresh Instagram statistics.
import { CheckCircle2, Copy } from "@lucide/vue";
import { toast } from "vue-sonner";
import type { SettingsData } from "~/utils/types";

const props = defineProps<{ data: SettingsData }>();
const emit = defineEmits<{ saved: [] }>();

type FieldDef = { key: string; label: string; hint?: string; secret?: boolean };
const GROUPS: Array<{ title: string; description: string; fields: FieldDef[]; actions?: Array<{ action: string; label: string }> }> = [
  {
    title: "Telegram",
    description: "Бот уведомлений и бизнес-бот @Onebranding_contact: в Telegram → Настройки → Telegram для бизнеса → Чат-боты подключите бота, доступ — только чтение, только новые чаты и не контакты.",
    fields: [
      { key: "telegram_bot_token", label: "Токен бота", hint: "От @BotFather; в BotFather включите Business Mode.", secret: true },
      { key: "telegram_chat_id", label: "Chat ID общего чата владельцев", hint: "Добавьте бота в чат и отправьте /id." },
    ],
    actions: [{ action: "telegram_webhook", label: "Подключить вебхук" }, { action: "telegram_test", label: "Тестовое уведомление" }],
  },
  {
    title: "Meta: реклама, Pixel и Conversions API",
    description: "Расходы по кампаниям и событие Lead с сервера (с тем же event_id, что у Pixel).",
    fields: [
      { key: "meta_access_token", label: "Access token (ads_read)", secret: true },
      { key: "meta_ad_account_id", label: "ID рекламного кабинета", hint: "act_123… или только цифры" },
      { key: "meta_pixel_id", label: "Pixel ID" },
      { key: "meta_capi_token", label: "Токен Conversions API", secret: true },
      { key: "meta_app_secret", label: "App secret (подпись вебхуков Instagram)", secret: true },
    ],
  },
  {
    title: "Instagram Direct",
    description: "Нужны профессиональный аккаунт, привязка к Meta Business и проверка приложения. URL вебхука указан ниже.",
    fields: [
      { key: "instagram_account_id", label: "ID аккаунта Instagram" },
      { key: "instagram_access_token", label: "Access token", secret: true },
      { key: "instagram_verify_token", label: "Verify token вебхука", hint: "Любая строка; та же — в настройках вебхука в Meta." },
    ],
    actions: [{ action: "instagram_stats", label: "Обновить статистику" }],
  },
  {
    title: "Google Ads",
    description: "Developer token выдаётся после заявки в Google; подайте её сразу — одобрение занимает время.",
    fields: [
      { key: "google_ads_developer_token", label: "Developer token", secret: true },
      { key: "google_ads_client_id", label: "OAuth client ID" },
      { key: "google_ads_client_secret", label: "OAuth client secret", secret: true },
      { key: "google_ads_refresh_token", label: "Refresh token", secret: true },
      { key: "google_ads_customer_id", label: "Customer ID", hint: "123-456-7890" },
      { key: "google_ads_login_customer_id", label: "Login customer ID (MCC)", hint: "Если доступ через управляющий аккаунт." },
    ],
  },
  {
    title: "Яндекс Директ",
    description: "OAuth-токен с доступом к API Директа; отчёты по кампаниям раз в сутки.",
    fields: [
      { key: "yandex_direct_token", label: "OAuth-токен", secret: true },
      { key: "yandex_direct_client_login", label: "Логин клиента", hint: "Для агентского аккаунта." },
    ],
  },
  {
    title: "Защита формы",
    description: "Секретный ключ Cloudflare Turnstile (ключ сайта задаётся на сайте: NUXT_PUBLIC_TURNSTILE_SITE_KEY).",
    fields: [{ key: "turnstile_secret", label: "Turnstile secret key", secret: true }],
  },
];

const values = reactive<Record<string, string>>({});
const status = (key: string) => props.data.secrets?.[key] ?? null;
async function saveGroup(fields: FieldDef[]) {
  const body = Object.fromEntries(fields.filter((f) => values[f.key] !== undefined && values[f.key] !== "").map((f) => [f.key, values[f.key]!]));
  if (!Object.keys(body).length) return;
  const ok = await attempt(() => api("/api/settings/connections", { method: "PUT", body }), "Сохранено");
  if (ok) {
    for (const key of Object.keys(body)) values[key] = "";
    emit("saved");
  }
}
async function clear(key: string) {
  if (!confirm("Удалить сохранённое значение?")) return;
  if (await attempt(() => api("/api/settings/connections", { method: "PUT", body: { [key]: "" } }), "Удалено")) emit("saved");
}
async function run(action: string) {
  const result = await attempt(() => api<{ message?: string }>("/api/settings/actions", { method: "POST", body: { action } }));
  if (result) toast.success(result.message ?? "Готово");
  emit("saved");
}
const copy = async (text: string) => {
  await navigator.clipboard.writeText(text);
  toast.success("Скопировано");
};
</script>

<template>
  <div class="grid gap-4 @5xl/main:grid-cols-2">
    <Card v-for="group in GROUPS" :key="group.title">
      <CardHeader>
        <CardTitle>{{ group.title }}</CardTitle>
        <CardDescription>{{ group.description }}</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-3">
        <Field v-for="field in group.fields" :key="field.key">
          <FieldLabel class="flex items-center justify-between gap-2">
            {{ field.label }}
            <span v-if="status(field.key)" class="text-muted-foreground flex items-center gap-1 text-xs font-normal">
              <CheckCircle2 class="size-3.5 text-emerald-600" />{{ status(field.key) === "env" ? "задано в окружении" : "сохранено" }}
              <button v-if="status(field.key) === 'db'" type="button" class="underline underline-offset-2" @click="clear(field.key)">удалить</button>
            </span>
          </FieldLabel>
          <Input v-model="values[field.key]" :type="field.secret ? 'password' : 'text'" autocomplete="off" :placeholder="status(field.key) ? '•••••• (оставьте пустым, чтобы не менять)' : ''" />
          <FieldDescription v-if="field.hint">{{ field.hint }}</FieldDescription>
        </Field>
        <template v-if="group.title === 'Telegram'">
          <div v-for="c in props.data.telegramConnections" :key="c.id" class="text-muted-foreground text-xs">
            Бизнес-подключение: @{{ c.username ?? "—" }} · {{ c.isEnabled ? "активно" : "отключено" }} · обновлено {{ formatDateTime(c.updatedAt) }}
          </div>
          <div class="flex items-center gap-2 text-xs"><span class="text-muted-foreground">Вебхук:</span><code class="truncate">{{ props.data.webhookUrls.telegram }}</code></div>
        </template>
        <div v-if="group.title === 'Instagram Direct'" class="flex items-center gap-2 text-xs">
          <span class="text-muted-foreground">URL вебхука:</span><code class="truncate">{{ props.data.webhookUrls.instagram }}</code>
          <Button variant="ghost" size="icon-xs" aria-label="Копировать" @click="copy(props.data.webhookUrls.instagram)"><Copy /></Button>
        </div>
      </CardContent>
      <CardFooter class="flex flex-wrap justify-end gap-2">
        <Button v-for="a in group.actions ?? []" :key="a.action" variant="outline" size="sm" @click="run(a.action)">{{ a.label }}</Button>
        <Button size="sm" @click="saveGroup(group.fields)">Сохранить</Button>
      </CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Курсы ЦБ Узбекистана</CardTitle>
        <CardDescription>Загружаются с cbu.uz трижды в день; каждый платёж и расход хранится с курсом своей даты.</CardDescription>
      </CardHeader>
      <CardFooter class="justify-end"><Button variant="outline" size="sm" @click="run('fx_refresh')">Загрузить курсы сейчас</Button></CardFooter>
    </Card>
  </div>
</template>
