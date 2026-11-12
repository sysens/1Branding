import type { SiteLocale } from "./locales";

/**
 * The /pricing cards' lists in one language (app/content/pricing/<locale>.json):
 * for each CMS price category (lower case), its ten items, from the basics up.
 * utils/pricePlans.ts says how many of them each package covers.
 */
export type PriceItems = Record<string, string[]>;

const loaders = import.meta.glob<PriceItems>("../content/pricing/*.json", { import: "default" });

/** The lists of a language, or null when it has none. */
export const loadPriceItems = async (locale: SiteLocale): Promise<PriceItems | null> => {
  const load = loaders[`../content/pricing/${locale}.json`];
  return load ? load() : null;
};

/**
 * A package's own texts (app/content/pricing-plans/<locale>.json): the line
 * under its price, what it includes (its own list, every item covered) and
 * the paragraph that goes under the packages' tabs. By category and package
 * (lower case, as in utils/pricePlans.ts: planKey). A package without an entry
 * shows its service's shared list.
 */
export type PlanCopy = { tagline: string; items: string[]; text: string };
export type PlanCopies = Record<string, Record<string, PlanCopy>>;

const planLoaders = import.meta.glob<PlanCopies>("../content/pricing-plans/*.json", { import: "default" });

/** The packages' texts of a language, or null when it has none. */
export const loadPlanCopies = async (locale: SiteLocale): Promise<PlanCopies | null> => {
  const load = planLoaders[`../content/pricing-plans/${locale}.json`];
  return load ? load() : null;
};
