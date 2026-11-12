import { SERVICE_PAGES, servicePath } from "~/utils/servicePages";
import { toSiteLocale } from "~/utils/locales";
import { categoryKey, dollars, isSupersededDescription, missingCategories, priceNumber, wasPrice, withPriceChanges } from "~/utils/pricePlans";

/**
 * The CMS price list (priceCategories) for /pricing: the cards and the
 * structured data share this one request. A language without categories of
 * its own (Uzbek; Russian until entered) shows the English ones with the
 * names and texts of i18n pricing.categories.<category>, keeping the package
 * names and prices.
 */
export type CmsPricingItem = {
  title: string;
  price: string;
  priceText: string;
  description: string;
  /** Set by usePriceCategories: the full price a discounted package is crossed out from (dollars). */
  was?: number | null;
};
export type CmsPriceCategory = { title: string; pricing: CmsPricingItem[] };

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

// The packages' full prices (oldPrice: what a discounted package is crossed
// out from), asked for apart from the price list: a backend that does not
// have the field yet refuses a query that names it, and the price list itself
// must not depend on that.
const OFFERS_QUERY = `
  query PriceOffers($locale: I18NLocaleCode!, $withFallback: Boolean!) {
    priceCategories(locale: $locale) {
      title
      pricing { title oldPrice }
    }
    fallbackPriceCategories: priceCategories(locale: "en") @include(if: $withFallback) {
      title
      pricing { title oldPrice }
    }
  }
`;

type PriceCategoriesResponse = {
  priceCategories?: CmsPriceCategory[];
  fallbackPriceCategories?: CmsPriceCategory[];
};

type CmsOffer = { title: string; pricing: Array<{ title: string; oldPrice?: string | null }> };
type PriceOffersResponse = { priceCategories?: CmsOffer[]; fallbackPriceCategories?: CmsOffer[] };

/** "$5900.00" -> 5900 (NaN when there is no number). */
export const priceAmount = (value: string) => priceNumber(value);

const same = (a?: string | null, b?: string | null) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

export const usePriceCategories = async () => {
  // Before the await: after it a composable has no current component instance.
  const { t, te, locale } = useI18n();
  const cmsLocale = useCmsLocale();
  const graphqlUrl = useGraphqlUrl();
  const list = useCmsQuery<PriceCategoriesResponse>("price-categories", QUERY);
  const offersRequest = useAsyncData(
    () => `cms:price-offers:${cmsLocale.value}`,
    async () => {
      if (!graphqlUrl) return null;
      try {
        return await cmsRequest<PriceOffersResponse>(graphqlUrl, OFFERS_QUERY, cmsVariables(cmsLocale.value));
      } catch {
        // No discounts are shown; the prices themselves are in the other request.
        return null;
      }
    },
  );
  const [{ data }, { data: offers }] = await Promise.all([list, offersRequest]);

  const own = computed(() => (data.value?.data?.priceCategories || []).length > 0);

  // The full price of a discounted package, in dollars: the CMS's oldPrice of
  // the same language's entries as the price list's, used only when it is
  // above the package's price. null: no discount.
  const offerList = computed<CmsOffer[]>(() => {
    const current = offers.value?.data?.priceCategories || [];
    return current.length ? current : offers.value?.data?.fallbackPriceCategories || [];
  });
  const cmsOldPrice = (category: CmsPriceCategory, plan: CmsPricingItem) => {
    const offer = offerList.value.find((item) => same(item.title, category.title))?.pricing?.find((item) => same(item.title, plan.title));
    return wasPrice(priceAmount(offer?.oldPrice ?? ""), priceAmount(plan.price));
  };

  // The price list with the changes of pricePlans.ts applied (a package the
  // CMS still has at its old price shows the new price, name and companions;
  // a service the CMS does not have yet is added at the end) and, for a
  // discounted package, `was`.
  const categories = computed<CmsPriceCategory[]>(() => {
    const current = data.value?.data?.priceCategories || [];
    const list = current.length ? current : data.value?.data?.fallbackPriceCategories || [];
    const changed = list.map((category) => ({
      ...category,
      pricing: withPriceChanges(category.title ?? "", category.pricing ?? []).map((plan) => ({ ...plan, was: plan.was ?? cmsOldPrice(category, plan) })),
    }));
    const added = missingCategories(list.map((category) => category.title)).map((service) => ({
      title: service.category,
      pricing: service.plans.map((plan) => ({ title: plan.title, price: dollars(plan.price), priceText: "", description: "", was: null })),
    }));
    return [...changed, ...added];
  });

  const key = (category: CmsPriceCategory) => `pricing.categories.${categoryKey(category.title ?? "")}`;
  const localCopy = (category: CmsPriceCategory, field: "title" | "description") =>
    !own.value && te(`${key(category)}.${field}`) ? t(`${key(category)}.${field}`) : "";

  const categoryTitle = (category: CmsPriceCategory) => localCopy(category, "title") || category.title;
  // A service's description: its own language's copy (i18n) where the CMS has
  // no entry of that language, else the CMS's (unless it is one the site's copy
  // has replaced, utils/pricePlans.ts: isSupersededDescription; an editor's
  // own wording stays), else the i18n copy again (a service entered in the CMS
  // without a text, or not there yet).
  const categoryDescription = (category: CmsPriceCategory) =>
    localCopy(category, "description") ||
    (isSupersededDescription(category.title ?? "", category.pricing?.[0]?.description) ? "" : category.pricing?.[0]?.description?.trim()) ||
    (te(`${key(category)}.description`) ? t(`${key(category)}.description`) : "") ||
    category.pricing?.[0]?.priceText?.trim() ||
    "";
  // The service page each category belongs to (Branding -> /services/branding).
  const categoryPage = (category: CmsPriceCategory) => {
    const page = SERVICE_PAGES.find((item) => item.priceCategory?.toLowerCase() === category.title?.trim().toLowerCase());
    return page ? { path: servicePath(page.key, toSiteLocale(locale.value)), name: t(`servicePages.${page.key}.name`), unit: page.priceUnit ?? null } : null;
  };

  return { categories, categoryTitle, categoryDescription, categoryPage };
};
