<script setup lang="ts">
// Users and roles. A new user (or a reset) gets a one-time password shown
// once here; they set up 2FA on their first sign-in.
import { Copy, MoreHorizontal, Plus } from "@lucide/vue";
import { toast } from "vue-sonner";
import { ROLE_LABELS, ROLES, type Role } from "#shared/utils/constants";
import type { SettingsData } from "~/utils/types";

defineProps<{ data: SettingsData }>();
const emit = defineEmits<{ saved: [] }>();
const me = useMe();
const addOpen = ref(false);
const form = reactive({ name: "", email: "", role: "owner" as Role, telegramId: "" });
const secret = ref<{ name: string; email?: string; password: string } | null>(null);

async function add() {
  const result = await attempt(() => api<{ password: string }>("/api/settings/users", { method: "POST", body: { ...form, telegramId: form.telegramId || null } }));
  if (result) {
    secret.value = { name: form.name, email: form.email, password: result.password };
    addOpen.value = false;
    Object.assign(form, { name: "", email: "", role: "owner", telegramId: "" });
    emit("saved");
  }
}
async function update(id: number, body: Record<string, unknown>, success = "Сохранено") {
  const result = await attempt(() => api<{ password: string | null }>(`/api/settings/users/${id}`, { method: "PATCH", body }), success);
  if (result?.password) secret.value = { name: "", password: result.password };
  emit("saved");
}
const copy = async (text: string) => {
  await navigator.clipboard.writeText(text);
  toast.success("Скопировано");
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Пользователи</CardTitle>
      <CardDescription>Владелец — всё; менеджер — сделки, клиенты, платежи и расходы; просмотр — только чтение. Права проверяются на сервере.</CardDescription>
      <CardAction><Button size="sm" @click="addOpen = true"><Plus />Добавить</Button></CardAction>
    </CardHeader>
    <CardContent>
      <Alert v-if="secret" class="mb-4">
        <AlertTitle>Одноразовый пароль{{ secret.name ? ` для ${secret.name}` : "" }}</AlertTitle>
        <AlertDescription class="flex flex-wrap items-center gap-2">
          <code class="bg-muted rounded px-2 py-1 font-mono">{{ secret.password }}</code>
          <Button size="xs" variant="outline" @click="copy(secret.password)"><Copy />Копировать</Button>
          <span class="text-xs">Передайте лично; больше он не покажется. При первом входе нужно включить двухфакторную защиту.</span>
        </AlertDescription>
      </Alert>
      <div class="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader class="bg-muted/50"><TableRow><TableHead>Имя</TableHead><TableHead>E-mail</TableHead><TableHead>Роль</TableHead><TableHead>2FA</TableHead><TableHead>Последний вход</TableHead><TableHead class="w-10" /></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="u in data.users" :key="u.id" :class="!u.isActive && 'opacity-50'">
              <TableCell class="font-medium">{{ u.name }}<Badge v-if="u.id === me?.id" variant="secondary" class="ml-2">Вы</Badge></TableCell>
              <TableCell>{{ u.email }}</TableCell>
              <TableCell>
                <NativeSelect :model-value="u.role" size="sm" class="w-40" :disabled="u.id === me?.id" @change="(e: Event) => update(u.id, { role: (e.target as HTMLSelectElement).value }, 'Роль изменена')">
                  <option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option>
                </NativeSelect>
              </TableCell>
              <TableCell><Badge :variant="u.totpEnabled ? 'outline' : 'destructive'">{{ u.totpEnabled ? "Включена" : "Не настроена" }}</Badge></TableCell>
              <TableCell class="text-muted-foreground">{{ u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—" }}</TableCell>
              <TableCell>
                <DropdownMenu v-if="u.id !== me?.id">
                  <DropdownMenuTrigger as-child><Button variant="ghost" size="icon-sm" aria-label="Действия"><MoreHorizontal /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="update(u.id, { resetPassword: true }, 'Пароль сброшен')">Сбросить пароль</DropdownMenuItem>
                    <DropdownMenuItem @click="update(u.id, { reset2fa: true }, '2FA сброшена')">Сбросить 2FA</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem :variant="u.isActive ? 'destructive' : 'default'" @click="update(u.id, { isActive: !u.isActive }, u.isActive ? 'Доступ отключён' : 'Доступ включён')">
                      {{ u.isActive ? "Отключить доступ" : "Включить доступ" }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>

  <Dialog v-model:open="addOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader><DialogTitle>Новый пользователь</DialogTitle></DialogHeader>
      <form class="grid gap-4" @submit.prevent="add">
        <Field><FieldLabel>Имя</FieldLabel><Input v-model="form.name" required minlength="2" /></Field>
        <Field><FieldLabel>E-mail</FieldLabel><Input v-model="form.email" type="email" required /></Field>
        <Field>
          <FieldLabel>Роль</FieldLabel>
          <NativeSelect v-model="form.role"><option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option></NativeSelect>
        </Field>
        <Field><FieldLabel>Telegram ID</FieldLabel><Input v-model="form.telegramId" inputmode="numeric" /><FieldDescription>Необязательно.</FieldDescription></Field>
        <DialogFooter><Button type="submit">Создать</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
