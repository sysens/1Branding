<script setup lang="ts">
// Services and packages with base prices; industries of the form.
import { CURRENCIES } from "#shared/utils/constants";
import type { Industry, Service } from "~/composables/useSession";

type ServiceRow = Partial<Service> & { name: string };
type IndustryRow = Partial<Industry> & { name: string };

const emit = defineEmits<{ saved: [] }>();
const { meta } = useMeta();
const services = ref<ServiceRow[]>(deepCopy((meta.value?.services ?? []).filter((s) => s.isActive)));
const industries = ref<IndustryRow[]>(deepCopy((meta.value?.industries ?? []).filter((s) => s.isActive)));
const newService = (): ServiceRow => ({ name: "", kind: "service", basePrice: null, currency: "USD" });
const newIndustry = (): IndustryRow => ({ name: "" });

async function saveServices() {
  const ok = await attempt(() => api("/api/settings/lists/services", {
    method: "PUT",
    body: services.value.map((s) => ({
      id: s.id ?? null, name: s.name, key: s.key, kind: s.kind ?? "service",
      basePrice: s.basePrice === null || s.basePrice === undefined || (s.basePrice as unknown) === "" ? null : Number(s.basePrice),
      currency: s.currency ?? "USD", isActive: true,
    })),
  }), "Услуги сохранены");
  if (ok) emit("saved");
}
async function saveIndustries() {
  const ok = await attempt(() => api("/api/settings/lists/industries", {
    method: "PUT",
    body: industries.value.map((i) => ({ id: i.id ?? null, name: i.name, key: i.key, isActive: true })),
  }), "Отрасли сохранены");
  if (ok) emit("saved");
}
</script>

<template>
  <div class="grid gap-4 @5xl/main:grid-cols-3">
    <Card class="@5xl/main:col-span-2">
      <CardHeader>
        <CardTitle>Услуги и пакеты</CardTitle>
        <CardDescription>Ключи совпадают с услугами сайта: заявка с формы попадает в нужную услугу. Удалённая услуга со сделками просто скрывается.</CardDescription>
      </CardHeader>
      <CardContent>
        <EditableList v-model="services" :new-item="newService" add-label="Добавить услугу">
          <template #extra="{ item }">
            <NativeSelect v-model="item.kind" size="sm" class="w-28"><option value="service">Услуга</option><option value="package">Пакет</option></NativeSelect>
            <Input
              :model-value="item.basePrice ?? ''"
              type="number"
              min="0"
              placeholder="Цена от"
              class="h-8 w-24"
              @update:model-value="(v) => (item.basePrice = v === '' ? null : Number(v))"
            />
            <NativeSelect v-model="item.currency" size="sm" class="w-20"><option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option></NativeSelect>
          </template>
        </EditableList>
      </CardContent>
      <CardFooter class="justify-end"><Button @click="saveServices">Сохранить услуги</Button></CardFooter>
    </Card>
    <Card>
      <CardHeader><CardTitle>Отрасли</CardTitle></CardHeader>
      <CardContent><EditableList v-model="industries" :new-item="newIndustry" add-label="Добавить отрасль" /></CardContent>
      <CardFooter class="justify-end"><Button @click="saveIndustries">Сохранить отрасли</Button></CardFooter>
    </Card>
  </div>
</template>
