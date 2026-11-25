<script setup lang="ts">
// The signed-in user's password and two-factor status.
import { ROLE_LABELS } from "#shared/utils/constants";

const me = useMe();
const form = reactive({ current: "", next: "", repeat: "" });
async function save() {
  if (form.next !== form.repeat) {
    const { toast } = await import("vue-sonner");
    toast.error("Пароли не совпадают");
    return;
  }
  const ok = await attempt(() => api("/api/auth/password", { method: "POST", body: { current: form.current, next: form.next } }), "Пароль изменён, другие сеансы закрыты");
  if (ok) Object.assign(form, { current: "", next: "", repeat: "" });
}
</script>

<template>
  <div class="grid max-w-3xl gap-4 @3xl/main:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>{{ me?.name }}</CardTitle>
        <CardDescription>{{ me?.email }} · {{ me ? ROLE_LABELS[me.role] : "" }}</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-2 text-sm">
        <div class="flex items-center justify-between">
          Двухфакторная защита
          <Badge :variant="me?.totpEnabled ? 'outline' : 'destructive'">{{ me?.totpEnabled ? "Включена" : "Не настроена" }}</Badge>
        </div>
        <Button v-if="!me?.totpEnabled" variant="outline" size="sm" as-child class="justify-self-start"><NuxtLink to="/setup-2fa">Настроить</NuxtLink></Button>
        <p v-else class="text-muted-foreground text-xs">Чтобы сменить устройство, попросите другого владельца сбросить 2FA.</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Смена пароля</CardTitle></CardHeader>
      <CardContent>
        <form class="grid gap-3" @submit.prevent="save">
          <Field><FieldLabel>Текущий пароль</FieldLabel><Input v-model="form.current" type="password" autocomplete="current-password" required /></Field>
          <Field><FieldLabel>Новый пароль</FieldLabel><Input v-model="form.next" type="password" autocomplete="new-password" minlength="10" required /></Field>
          <Field><FieldLabel>Ещё раз</FieldLabel><Input v-model="form.repeat" type="password" autocomplete="new-password" required /></Field>
          <Button type="submit">Сменить пароль</Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
