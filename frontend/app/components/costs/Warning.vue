<script setup lang="ts">
import { computed } from "vue";
import { isPlaceholderCopy } from "~/utils/seo";

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

const { t } = useI18n();

const query = `
  query PriceForCustomer($locale: I18NLocaleCode, $withFallback: Boolean!) {
    price(locale: $locale) {
      forCustomer {
        title
        text
      }
    }
    fallbackPrice: price(locale: "en") @include(if: $withFallback) {
      forCustomer {
        title
        text
      }
    }
  }
`;

const { data: priceRes } = await useCmsQuery<NonNullable<PriceRes["data"]>>("price-for-customer", query);

// Only the page's own language entry: the English one ("Dear customers",
// Lorem ipsum) would put English text on another language's page.
const forCustomer = computed(() => priceRes.value?.data?.price?.forCustomer ?? null);
const title = computed(() => cmsText(forCustomer.value?.title) || t("warning.title"));
const text = computed(() => {
  const value = cmsText(forCustomer.value?.text);
  return value && !isPlaceholderCopy(value) ? value : t("warning.text");
});
</script>

<template>
  <div class="bg-black">
    <div class="lastComp containerr">
      <div class="flex gap-[1rem] pb-[1.875rem]">
        <div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 2L2 20h20L12 2z" stroke="#808080" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M12 9v5" stroke="#808080" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="12" cy="17" r="0.75" fill="#808080"/>
          </svg>
        </div>
        <div>
          <h2 class="type-h5 align-middle text-[#8f8f8f]">
            {{ title }}
          </h2>
        </div>
      </div>
      <p class="type-body type-measure text-[#FFFFFF]">
        {{ text }}
      </p>
    </div>
  </div>
</template>
