import { SERVICE_PAGES, servicePath } from "~/utils/servicePages";
import { toSiteLocale } from "~/utils/locales";

/**
 * The CMS price list (priceCategories) for /pricing: the slider's cards and
 * the price table share this one request. A language without categories of
 * its own (Uzbek; Russian until entered) shows the English ones with the
 * names and texts of i18n pricing.categories.<category>, keeping the package
 * names and prices.
 */
export type PricingItem = { title: string; price: string; priceText: string; description: string };
export type PriceCategory = { title: string; pricing: PricingItem[] };

const QUERY = `
  query PriceCategories($locale: I18NLocaleCode!, $withFallback: Boolean!) {
    priceCategories(locale: $locale) {
      title
      pricing { title price priceText description }
    }
    fallbackPriceCategories: priceCategories(locale: "en") @include(if: $withFallback) {
      title
      pricing { title price priceText description }
    }
  }
`;

type PriceCategoriesResponse = {
  priceCategories?: PriceCategory[];
  fallbackPriceCategories?: PriceCategory[];
};

/** "$5900.00" -> 5900 (NaN when there is no number). */
export const priceAmount = (value: string) => Number.parseFloat(String(value || "").replace(/[^0-9.]/g, ""));

export const usePriceCategories = async () => {
  // Before the await: after it a composable has no current component instance.
  const { t, te, locale } = useI18n();
  const { data } = await useCmsQuery<PriceCategoriesResponse>("price-categories", QUERY);

  const own = computed(() => (data.value?.data?.priceCategories || []).length > 0);
  const categories = computed<PriceCategory[]>(() => {
    const current = data.value?.data?.priceCategories || [];
    return current.length ? current : data.value?.data?.fallbackPriceCategories || [];
  });

  const key = (category: PriceCategory) => `pricing.categories.${category.title?.trim().toLowerCase()}`;
  const localCopy = (category: PriceCategory, field: "title" | "description") =>
    !own.value && te(`${key(category)}.${field}`) ? t(`${key(category)}.${field}`) : "";

  const categoryTitle = (category: PriceCategory) => localCopy(category, "title") || category.title;
  const categoryDescription = (category: PriceCategory) =>
    localCopy(category, "description") ||
    category.pricing?.[0]?.description?.trim() ||
    category.pricing?.[0]?.priceText?.trim() ||
    "";
  // The service page each category belongs to (Branding -> /services/branding).
  const categoryPage = (category: PriceCategory) => {
    const page = SERVICE_PAGES.find((item) => item.priceCategory?.toLowerCase() === category.title?.trim().toLowerCase());
    return page ? { path: servicePath(page.key, toSiteLocale(locale.value)), name: t(`servicePages.${page.key}.name`), perSlide: page.priceUnit === "slide" } : null;
  };

  return { categories, categoryTitle, categoryDescription, categoryPage };
};
