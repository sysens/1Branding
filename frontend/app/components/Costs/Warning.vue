<script setup lang="ts">
import { computed, ref } from "vue";

type AppLocale = "ru" | "en";

type PriceRes = {
  data?: {
    price?: {
      forCustomer?: {
        title?: string | null;
        text?: string | null;
      } | null;
    } | null;
    fallbackPrice?: {
      forCustomer?: {
        title?: string | null;
        text?: string | null;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { t, locale } = useI18n<{ message: any }, AppLocale>();

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

const fallbackLocale: AppLocale = "en";

const query = `
  query PriceForCustomer($locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    price(locale: $locale) {
      forCustomer {
        title
        text
      }
    }
    fallbackPrice: price(locale: $fallbackLocale) {
      forCustomer {
        title
        text
      }
    }
  }
`;

const emptyData = ref<PriceRes | null>(null);

const { data: priceRes } = GRAPHQL_URL
  ? await useFetch<PriceRes>(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: computed(() => ({
        query,
        variables: { locale: gqlLocale.value, fallbackLocale },
      })),
      key: computed(() => `price-for-customer-${gqlLocale.value}`),
      watch: [gqlLocale],
    })
  : { data: emptyData };

const forCustomer = computed(
  () =>
    priceRes.value?.data?.price?.forCustomer ??
    priceRes.value?.data?.fallbackPrice?.forCustomer ??
    null
);
const title = computed(() => forCustomer.value?.title?.trim() || t("warning.title"));
const text = computed(() => forCustomer.value?.text?.trim() || t("warning.text"));
</script>

<template>
  <div class="bg-black">
    <div class="lastComp containerr">
      <div class="flex gap-[16px] pb-[30px]">
        <div><img src="/Costs/carbon_warning (1).png" alt="" /></div>
        <div>
          <h1
            class="text-[#808080]  font-normal text-[24px] leading-[25px] tracking-normal align-middle"
          >
            {{ title }}
          </h1>
        </div>
      </div>
      <p
        class="text-[#FFFFFF]  font-normal text-[16px] leading-[120%] tracking-normal"
      >
        {{ text }}
      </p>
    </div>
  </div>
</template>
