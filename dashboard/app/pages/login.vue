<script setup lang="ts">
// Sign in: e-mail and password, then the authenticator code. On a fresh
// deployment (no users yet) the first owner is created here with the setup key.
definePageMeta({ layout: "auth" });
useHead({ title: "Вход · OneBranding" });

const route = useRoute();
const step = ref<"password" | "code" | "setup">("password");
const email = ref("");
const password = ref("");
const code = ref("");
const setup = reactive({ token: "", name: "", email: "", password: "" });
const busy = ref(false);
const error = ref("");

onMounted(async () => {
  const state = await $fetch<{ hasUsers: boolean; setupEnabled: boolean }>("/api/auth/state").catch(() => null);
  if (state && !state.hasUsers && state.setupEnabled) step.value = "setup";
});

async function finish() {
  await loadMe(true);
  const me = useMe().value;
  if (me?.needs2faSetup) return navigateTo("/setup-2fa");
  return navigateTo(String(route.query.next || "/"));
}

async function submitPassword() {
  busy.value = true;
  error.value = "";
  try {
    const result = await $fetch<{ next: "2fa" | "2fa_setup" | "app" }>("/api/auth/login", { method: "POST", body: { email: email.value, password: password.value } });
    if (result.next === "2fa") step.value = "code";
    else await finish();
  } catch (e) {
    error.value = apiError(e);
  } finally {
    busy.value = false;
  }
}

async function submitCode() {
  if (code.value.length !== 6) return;
  busy.value = true;
  error.value = "";
  try {
    await $fetch("/api/auth/2fa", { method: "POST", body: { code: code.value } });
    await finish();
  } catch (e) {
    error.value = apiError(e);
    code.value = "";
  } finally {
    busy.value = false;
  }
}

async function submitSetup() {
  busy.value = true;
  error.value = "";
  try {
    await $fetch("/api/auth/setup", { method: "POST", body: setup });
    await finish();
  } catch (e) {
    error.value = apiError(e);
  } finally {
    busy.value = false;
  }
}

watch(code, (value) => {
  if (value.length === 6) submitCode();
});
</script>

<template>
  <Card>
    <template v-if="step === 'password'">
      <CardHeader class="text-center">
        <CardTitle class="text-xl">Вход в дашборд</CardTitle>
        <CardDescription>Трафик, заявки, воронка и деньги OneBranding</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-6" @submit.prevent="submitPassword">
          <FieldGroup>
            <Field>
              <FieldLabel for="email">E-mail</FieldLabel>
              <Input id="email" v-model="email" type="email" autocomplete="username" required />
            </Field>
            <Field>
              <FieldLabel for="password">Пароль</FieldLabel>
              <Input id="password" v-model="password" type="password" autocomplete="current-password" required />
            </Field>
            <FieldError v-if="error">{{ error }}</FieldError>
            <Button type="submit" class="w-full" :disabled="busy">
              <Spinner v-if="busy" />
              Войти
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </template>

    <template v-else-if="step === 'code'">
      <CardHeader class="text-center">
        <CardTitle class="text-xl">Код подтверждения</CardTitle>
        <CardDescription>Введите 6 цифр из приложения-аутентификатора</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col items-center gap-4">
        <InputOTP v-model="code" :maxlength="6" autofocus>
          <InputOTPGroup>
            <InputOTPSlot v-for="i in 6" :key="i" :index="i - 1" />
          </InputOTPGroup>
        </InputOTP>
        <FieldError v-if="error">{{ error }}</FieldError>
        <Button variant="ghost" size="sm" @click="step = 'password'; error = ''">Назад</Button>
      </CardContent>
    </template>

    <template v-else>
      <CardHeader class="text-center">
        <CardTitle class="text-xl">Первый владелец</CardTitle>
        <CardDescription>Дашборд ещё пуст. Создайте учётную запись владельца с ключом установки (NUXT_SETUP_TOKEN).</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-6" @submit.prevent="submitSetup">
          <FieldGroup>
            <Field>
              <FieldLabel for="token">Ключ установки</FieldLabel>
              <Input id="token" v-model="setup.token" type="password" required />
            </Field>
            <Field>
              <FieldLabel for="name">Имя</FieldLabel>
              <Input id="name" v-model="setup.name" autocomplete="name" required />
            </Field>
            <Field>
              <FieldLabel for="setup-email">E-mail</FieldLabel>
              <Input id="setup-email" v-model="setup.email" type="email" autocomplete="username" required />
            </Field>
            <Field>
              <FieldLabel for="setup-password">Пароль</FieldLabel>
              <Input id="setup-password" v-model="setup.password" type="password" autocomplete="new-password" minlength="10" required />
              <FieldDescription>Не короче 10 символов. После входа включите двухфакторную защиту.</FieldDescription>
            </Field>
            <FieldError v-if="error">{{ error }}</FieldError>
            <Button type="submit" class="w-full" :disabled="busy">Создать и войти</Button>
          </FieldGroup>
        </form>
      </CardContent>
    </template>
  </Card>
</template>
