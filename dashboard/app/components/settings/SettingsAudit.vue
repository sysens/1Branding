<script setup lang="ts">
// Who did what (spec 11): the latest 300 actions.
type Entry = { id: number; action: string; entity: string | null; entityId: string | null; user: string | null; ip: string | null; createdAt: string };
const { data } = await useAsyncData("audit", () => api<Entry[]>("/api/settings/audit"), { server: false, lazy: true });
const ACTIONS: Record<string, string> = {
  "auth.login": "Вход", "auth.login_failed": "Неудачный вход", "auth.2fa_failed": "Неверный код 2FA", "auth.2fa_enabled": "Включена 2FA",
  "auth.password_changed": "Смена пароля", "deal.create": "Создана сделка", "deal.update": "Изменена сделка", "deal.move": "Смена этапа",
  "deal.delete": "Удалена сделка", "payment.create": "Внесён платёж", "payment.delete": "Удалён платёж", "expense.create": "Добавлен расход",
  "expense.delete": "Удалён расход", "settings.update": "Настройки", "settings.list": "Справочник", "connections.update": "Подключения",
  "user.create": "Новый пользователь", "user.update": "Изменён пользователь", "client.merge": "Объединение клиентов", "ads.sync": "Обновление расходов",
};
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Журнал действий</CardTitle></CardHeader>
    <CardContent>
      <DataTable
        :rows="data ?? []"
        export-name="zhurnal"
        :columns="[
          { key: 'createdAt', label: 'Когда', format: (r) => formatDateTime(r.createdAt) },
          { key: 'user', label: 'Кто', format: (r) => r.user ?? 'Система' },
          { key: 'action', label: 'Действие', value: (r) => ACTIONS[r.action] ?? r.action },
          { key: 'entity', label: 'Объект', format: (r) => (r.entity ? `${r.entity}${r.entityId ? ` #${r.entityId}` : ''}` : '—') },
          { key: 'ip', label: 'IP', format: (r) => r.ip ?? '—' },
        ]"
      />
    </CardContent>
  </Card>
</template>
