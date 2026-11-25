<script setup lang="ts">
// Settings (spec 6.9), one tab per area. Owners change everything; the
// other roles see their profile and the UTM link builder.
import type { SettingsData } from "~/utils/types";
definePageMeta({ title: "Настройки" });
useHead({ title: "Настройки · OneBranding" });


const route = useRoute();
const router = useRouter();
const { isOwner, load } = useMeta();
const tab = computed({
  get: () => String(route.query.tab ?? (isOwner.value ? "general" : "utm")),
  set: (value: string) => router.replace({ query: { ...route.query, tab: value } }),
});
const { data, refresh } = await useAsyncData("settings", () => api<SettingsData>("/api/settings"), { server: false, lazy: true });
const reload = async () => {
  await Promise.all([refresh(), load(true)]);
};
const tabs = computed(() => [
  ...(isOwner.value ? [
    { value: "general", label: "Общие" },
    { value: "users", label: "Пользователи" },
    { value: "funnel", label: "Воронка" },
    { value: "catalog", label: "Услуги и отрасли" },
    { value: "channels", label: "Каналы и UTM" },
  ] : []),
  { value: "utm", label: "Генератор ссылок" },
  ...(isOwner.value ? [
    { value: "plan", label: "План" },
    { value: "connections", label: "Подключения" },
    { value: "audit", label: "Журнал" },
  ] : []),
  { value: "profile", label: "Профиль" },
]);
</script>

<template>
  <Tabs v-model="tab" class="gap-4">
    <div class="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <TabsList>
        <TabsTrigger v-for="t in tabs" :key="t.value" :value="t.value">{{ t.label }}</TabsTrigger>
      </TabsList>
    </div>
    <div v-if="!data" class="grid gap-4"><Skeleton class="h-64 w-full" /></div>
    <template v-else>
      <TabsContent value="general"><SettingsGeneral :data="data" @saved="reload" /></TabsContent>
      <TabsContent value="users"><SettingsUsers :data="data" @saved="reload" /></TabsContent>
      <TabsContent value="funnel"><SettingsFunnel @saved="reload" /></TabsContent>
      <TabsContent value="catalog"><SettingsCatalog @saved="reload" /></TabsContent>
      <TabsContent value="channels"><SettingsChannels @saved="reload" /></TabsContent>
      <TabsContent value="utm"><SettingsUtm :data="data" @saved="reload" /></TabsContent>
      <TabsContent value="plan"><SettingsPlan :data="data" @saved="reload" /></TabsContent>
      <TabsContent value="connections"><SettingsConnections :data="data" @saved="reload" /></TabsContent>
      <TabsContent value="audit"><SettingsAudit /></TabsContent>
      <TabsContent value="profile"><SettingsProfile /></TabsContent>
    </template>
  </Tabs>
</template>
