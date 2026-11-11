import type { Core } from "@strapi/strapi";

// The price list's changes of November 2026. On boot a package still at its
// old price gets the new one (and the new name, if there is one); with a
// discount, the price the site shows crossed out next to it (oldPrice); and
// the packages that come with the change are added, each with the texts of
// the package it comes with. A price edited in the admin panel is no longer
// the old one, so it is never changed here, and a package an editor removed
// later is not added back: after the first boot this does nothing.
export type PriceChange = {
  /** The price list entry's title, e.g. "Branding" (any case). */
  category: string;
  /** The package's title in that entry, e.g. "One Pro" (any case). */
  plan: string;
  /** The price the package had, in dollars: changed only while it still has it. */
  from: number;
  /** The new price, written as the price list writes prices ("$5400.00"). */
  price: string;
  /** With a discount: the full price, crossed out on the site. */
  oldPrice?: string;
  /** The package's new name. */
  title?: string;
  /** Packages added with the change. */
  add?: Array<{ title: string; price: string; oldPrice?: string }>;
};

// The site shows these prices from the day the frontend has them: the same
// list is in frontend/app/utils/pricePlans.ts (PRICE_CHANGES), applied there
// while the CMS still answers with the old list. Keep the two alike.
export const CHANGES: PriceChange[] = [
  { category: "Branding", plan: "Launch Base", from: 1900, price: "$2750.00" },
  { category: "Branding", plan: "One Pro", from: 2900, price: "$5400.00", oldPrice: "$12750.00" },
  { category: "Branding", plan: "Global ultimate", from: 5900, price: "$25000.00" },
  { category: "Logo", plan: "Individual", from: 900, price: "$560.00", title: "Standard", add: [{ title: "One Pro", price: "$1500.00" }] },
  { category: "Packaging", plan: "Advanced", from: 500, price: "$17200.00", title: "Leader product" },
  { category: "Packaging", plan: "All in one", from: 1900, price: "$1650.00", title: "One Pro" },
  { category: "Presentation", plan: "Start", from: 35, price: "$15.00" },
  { category: "Presentation", plan: "Global", from: 99, price: "$125.00" },
];

const PRICE_CATEGORY = "api::price-category.price-category";

type Package = {
  id?: number;
  title?: string | null;
  price?: string | null;
  priceText?: string | null;
  description?: string | null;
  oldPrice?: string | null;
};
type PriceEntry = { documentId: string; title?: string | null; pricing?: Package[] | null };

const same = (a?: string | null, b?: string | null) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
/** "$5900.00" -> 5900 (NaN when there is no number). */
const amount = (price?: string | null) => Number.parseFloat(String(price ?? "").replace(/[^0-9.]/g, ""));

/** Applies the changes in every language of the price list; returns how many packages changed or were added. */
export const applyPriceChanges = async (strapi: Core.Strapi, changes: PriceChange[]): Promise<number> => {
  const documents = strapi.documents(PRICE_CATEGORY);
  const locales = ((await strapi.plugin("i18n").service("locales").find()) as Array<{ code: string }>).map((locale) => locale.code);
  let changed = 0;

  for (const locale of locales) {
    const entries = (await documents.findMany({ locale, populate: ["pricing"] } as never)) as PriceEntry[];
    for (const entry of entries) {
      let touched = 0;
      // A repeatable component is saved whole: every package goes back with
      // its id and its own fields, the changed ones with the new values, the
      // added ones (no id) after the package they come with.
      const pricing = (entry.pricing ?? []).flatMap((item): Package[] => {
        const change = changes.find((candidate) => same(candidate.category, entry.title) && same(candidate.plan, item.title));
        const kept = { id: item.id, title: item.title, price: item.price, priceText: item.priceText, description: item.description, oldPrice: item.oldPrice };
        if (!change || amount(item.price) !== change.from) return [kept];
        touched += 1 + (change.add?.length ?? 0);
        return [
          { ...kept, title: change.title ?? item.title, price: change.price, oldPrice: change.oldPrice ?? null },
          ...(change.add ?? []).map((extra) => ({ title: extra.title, price: extra.price, priceText: item.priceText, description: item.description, oldPrice: extra.oldPrice ?? null })),
        ];
      });
      if (!touched) continue;
      await documents.update({ documentId: entry.documentId, locale, data: { pricing } } as never);
      changed += touched;
      strapi.log.info(`Bootstrap updated ${touched} package(s) of "${entry.title}" (${locale})`);
    }
  }
  return changed;
};

/** A service new to the price list, with its packages (cheapest first). */
export type AddedCategory = {
  category: string;
  plans: Array<{ title: string; price: string }>;
};

// Same list as frontend/app/utils/pricePlans.ts (ADDED_CATEGORIES): the site
// shows these services from the day the frontend has them.
export const ADDED_CATEGORIES: AddedCategory[] = [
  {
    category: "Naming",
    plans: [
      { title: "Creative", price: "$1500.00" },
      { title: "Complex", price: "$3000.00" },
      { title: "Advanced", price: "$6000.00" },
    ],
  },
  { category: "Visual identity", plans: [{ title: "Creative", price: "$1850.00" }] },
  {
    category: "Visual content",
    plans: [
      { title: "Template", price: "$620.00" },
      { title: "Individual", price: "$2000.00" },
    ],
  },
];

const ADDED_KEY = "added-categories";

/**
 * Creates the services the price list does not have yet, in English (the
 * other languages show the English entries with their own texts), once: the
 * service is then remembered as added, so one an editor removes later is not
 * created again. Returns how many were created.
 */
export const applyCategoryAdditions = async (strapi: Core.Strapi, additions: AddedCategory[]): Promise<number> => {
  const store = strapi.store({ type: "core", name: "one-branding-prices" });
  const done = new Set(((await store.get({ key: ADDED_KEY })) as string[] | null) ?? []);
  const documents = strapi.documents(PRICE_CATEGORY);
  let created = 0;

  for (const addition of additions) {
    if (done.has(addition.category.toLowerCase())) continue;
    const entries = (await documents.findMany({ locale: "en" } as never)) as PriceEntry[];
    if (!entries.some((entry) => same(entry.title, addition.category))) {
      await documents.create({ locale: "en", data: { title: addition.category, pricing: addition.plans.map((plan) => ({ title: plan.title, price: plan.price })) } } as never);
      created += 1;
      strapi.log.info(`Bootstrap added "${addition.category}" to the price list`);
    }
    done.add(addition.category.toLowerCase());
  }
  await store.set({ key: ADDED_KEY, value: [...done] });
  return created;
};

export const ensurePlanPrices = async (strapi: Core.Strapi): Promise<number> =>
  (await applyCategoryAdditions(strapi, ADDED_CATEGORIES)) + (await applyPriceChanges(strapi, CHANGES));
