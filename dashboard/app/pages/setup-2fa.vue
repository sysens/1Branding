<script setup lang="ts">
// Two-factor setup (spec 11): scan the QR code, confirm with the first code.
definePageMeta({ layout: "auth" });
useHead({ title: "Двухфакторная защита · OneBranding" });

const data = ref<{ secret: string; svg: string } | null>(null);
const code = ref("");
const error = ref("");
const busy = ref(false);

onMounted(async () => {
  try {
    data.value = await $fetch("/api/auth/totp");
  } catch (e) {
    error.value = apiError(e);
  }
});

async function confirm() {
  if (code.value.length !== 6 || busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await $fetch("/api/auth/totp", { method: "POST", body: { code: code.value } });
    await loadMe(true);
    await navigateTo("/");
  } catch (e) {
    error.value = apiError(e);
    code.value = "";
  } finally {
    busy.value = false;
  }
}
watch(code, (value) => {
  if (value.length === 6) confirm();
});
const svgUrl = computed(() => (data.value ? `data:image/svg+xml;utf8,${encodeURIComponent(data.value.svg)}` : ""));
</script>

<template>
  <Card>
    <CardHeader class="text-center">
      <CardTitle class="text-xl">Двухфакторная защита</CardTitle>
      <CardDescription>Отсканируйте код в Google Authenticator, 1Password или другом приложении и введите 6 цифр.</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col items-center gap-4">
      <div class="rounded-lg border bg-white p-2">
        <img v-if="data" :src="svgUrl" alt="QR-код для приложения" class="size-44">
        <Skeleton v-else class="size-44" />
      </div>
      <p v-if="data" class="text-muted-foreground text-center text-xs">
        Или введите ключ вручную:<br>
        <code class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs break-all">{{ data.secret }}</code>
      </p>
      <InputOTP v-model="code" :maxlength="6">
        <InputOTPGroup>
          <InputOTPSlot v-for="i in 6" :key="i" :index="i - 1" />
        </InputOTPGroup>
      </InputOTP>
      <FieldError v-if="error">{{ error }}</FieldError>
    </CardContent>
  </Card>
</template>
