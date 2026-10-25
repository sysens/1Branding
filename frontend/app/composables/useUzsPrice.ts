import { formatRate, formatRateDate, uzsAmount } from "~/utils/uzs";
import { toSiteLocale } from "~/utils/locales";

/**
 * Dollar prices also in so'm: "≈ 10.7 mln so'm" under "$900", at the Central
 * Bank of Uzbekistan's rate (server/api/usd-rate.get.ts), with a note naming
 * the rate and its date. Without a rate both are empty and the price lists
 * show dollars only.
 */
type RateResponse = { rate: number | null; date: string | null };

export const useUzsPrice = async () => {
  // Before the await: after it a composable has no current component instance.
  const { t, locale } = useI18n();
  const { data } = await useFetch<RateResponse>("/api/usd-rate", { key: "usd-rate" });
  const siteLocale = computed(() => toSiteLocale(locale.value));

  const uzs = (usd: number) => {
    const rate = data.value?.rate;
    const value = rate ? uzsAmount(usd, rate, siteLocale.value) : null;
    return value ? t(value.unit === "million" ? "pricing.uzsMillion" : "pricing.uzsThousand", { amount: value.amount }) : "";
  };

  const uzsNote = computed(() => {
    const { rate, date } = data.value || {};
    return rate && date ? t("pricing.uzsNote", { date: formatRateDate(date), rate: formatRate(rate, siteLocale.value) }) : "";
  });

  return { uzs, uzsNote };
};
