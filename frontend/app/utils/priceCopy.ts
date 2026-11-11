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
