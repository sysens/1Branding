/**
 * /pricing: what each package covers. A service's list has ten items, from
 * the basics up (app/content/pricing/<locale>.json), and a package covers the
 * first N of them: the card shows all ten and dims the rest. A package with
 * texts of its own (app/content/pricing-plans/<locale>.json: a line, its own
 * list and a paragraph) shows those instead, every item of its list covered;
 * the shared list and these numbers are for the packages that have none.
 *
 * Categories and packages are named as in the CMS price list (lower case).
 * Every number here is a claim about what OneBranding sells: change it only
 * together with the people who quote these packages.
 */
export const PRICE_LIST_LENGTH = 10;

export const PLAN_COVERAGE: Record<string, Record<string, number>> = {
  branding: { "launch base": 5, "one pro": 8, "global ultimate": 10 },
  logo: { standard: 5, "one pro": 10 },
  packaging: { "one pro": 6, "leader product": 10 },
  presentation: { start: 4, product: 7, global: 10 },
  naming: { creative: 4, complex: 7, advanced: 10 },
  "visual identity": { creative: 10 },
  "visual content": { template: 4, individual: 10 },
};

/**
 * Packages with a fixed price: shown without "from" (a price the work is not
 * agreed above), like a ready-made template.
 */
const FIXED_PRICE: Record<string, readonly string[]> = {
  "visual content": ["template"],
};

export const isFixedPrice = (category: string, plan: string) => FIXED_PRICE[planKey(category)]?.includes(planKey(plan)) ?? false;

/**
 * Items of a service's list that carry a warning mark instead of the check
 * (by place in the list, the same in every language): Visual identity's last
 * item, the guide to using the identity.
 */
const WARNING_ITEMS: Record<string, readonly number[]> = {
  "visual identity": [PRICE_LIST_LENGTH - 1],
};

export const warningItems = (category: string): readonly number[] => WARNING_ITEMS[planKey(category)] ?? [];

/**
 * A package's colour, on its tab and its card: by its place among its
 * service's packages (cheapest first: white, the site's green, gold; any after
 * the third are gold), except the packages named in PLAN_TONE. The green one
 * is the recommended one.
 */
export type PlanTone = "white" | "green" | "gold";
const PLACE_TONES: readonly PlanTone[] = ["white", "green", "gold"];

export const PLAN_TONE: Record<string, Record<string, PlanTone>> = {
  packaging: { "one pro": "green", "leader product": "gold" },
};

export const planTone = (category: string, plan: string, place: number): PlanTone =>
  PLAN_TONE[planKey(category)]?.[planKey(plan)] ?? PLACE_TONES[Math.min(Math.max(place, 0), PLACE_TONES.length - 1)]!;

/** The i18n key of a price's wording: "from {price}", or "{price} per slide" for a price that buys a unit. */
export const priceUnitKey = (unit?: "slide" | null) => (unit === "slide" ? "servicesPage.pricePerSlide" : "servicesPage.priceFrom");

/**
 * The price a discounted package is crossed out from: the CMS's full price
 * (a package's oldPrice) when it is a number above the package's price,
 * else null (no discount is shown).
 */
export const wasPrice = (old: number, now: number) => (Number.isFinite(old) && Number.isFinite(now) && old > now ? old : null);

/** "  One  Pro " -> "one pro": how categories and packages are looked up. */
export const planKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

/** "Visual identity" -> "visualIdentity": the name of a service's texts in i18n (pricing.categories.<key>). */
export const categoryKey = (title: string) => planKey(title).replace(/ (\S)/g, (_, letter: string) => letter.toUpperCase());

/**
 * The descriptions the CMS price list was entered with, which the site's own
 * copy (i18n pricing.categories.<key>.description) has replaced. A service
 * whose CMS description is still one of these shows the site's copy; one an
 * editor has since rewritten shows the editor's. Compared with the white space
 * squeezed (the CMS keeps a line break between the sentences).
 */
const SUPERSEDED_DESCRIPTIONS: Record<string, readonly string[]> = {
  branding: [
    "Branding is a comprehensive development of your business as a strong and recognizable brand. It includes strategy, positioning, logo, corporate identity, and the entire visual system that builds trust and sets you apart from competitors.",
  ],
  logo: [
    "Logo design is the creation of a brand’s key symbol, which forms the first impression and sets the visual direction for the entire identity. We create logos based on strategy and positioning so that they are not only aesthetically pleasing but also recognizable, relevant, and enduring.",
  ],
};

const squeeze = (text: string) => text.replace(/\s+/g, " ").trim();

export const isSupersededDescription = (category: string, text?: string | null) =>
  SUPERSEDED_DESCRIPTIONS[planKey(category)]?.some((old) => squeeze(old) === squeeze(text ?? "")) ?? false;

/**
 * How many of a list's items a package covers. `rank` is the package's place
 * among its category's `count` packages by price (0: the cheapest).
 * A package the table above does not know (one added in the CMS) is placed by
 * its price: the dearest covers the whole list, the cheapest half of it, the
 * ones between evenly more.
 */
export const coveredItems = (category: string, plan: string, rank: number, count: number, length = PRICE_LIST_LENGTH) => {
  const known = PLAN_COVERAGE[planKey(category)]?.[planKey(plan)];
  if (known) return Math.min(length, known);
  if (count <= 1 || rank >= count - 1) return length;
  const base = Math.ceil(length / 2);
  return Math.round(base + ((length - base) * Math.max(0, rank)) / (count - 1));
};

/** "$5900.00" -> 5900 (NaN when there is no number). */
export const priceNumber = (price?: string | null) => Number.parseFloat(String(price ?? "").replace(/[^0-9.]/g, ""));

/**
 * The price list's changes of November 2026. A change is for the package
 * `plan` of `category` while the CMS still has it at `from`: it gets the new
 * `price` (dollars), the new name `title` if there is one, `was` (the full
 * price a discounted package is crossed out from) and, with `add`, the
 * packages that come with the change (each a copy of this package's texts
 * under its own name and price).
 *
 * The backend writes the same changes into the CMS on its next boot
 * (backend/src/utils/plan-prices.ts, which must list the same ones:
 * scripts/pricePlans.test.ts checks it); until then, and wherever the CMS
 * still answers with the old list, the site applies them itself. A package
 * whose price was edited in the CMS is no longer at `from`, so the edit shows.
 */
export type PriceChange = {
  category: string;
  plan: string;
  from: number;
  price: number;
  was?: number;
  title?: string;
  add?: ReadonlyArray<{ title: string; price: number; was?: number }>;
};

export const PRICE_CHANGES: readonly PriceChange[] = [
  { category: "branding", plan: "launch base", from: 1900, price: 2750 },
  { category: "branding", plan: "one pro", from: 2900, price: 5400, was: 12750 },
  { category: "branding", plan: "global ultimate", from: 5900, price: 25000 },
  { category: "logo", plan: "individual", from: 900, price: 560, title: "Standard", add: [{ title: "One Pro", price: 1500 }] },
  { category: "packaging", plan: "advanced", from: 500, price: 17200, title: "Leader product" },
  { category: "packaging", plan: "all in one", from: 1900, price: 1650, title: "One Pro" },
  { category: "presentation", plan: "start", from: 35, price: 15 },
  { category: "presentation", plan: "global", from: 99, price: 125 },
];

/** 5400 -> "$5400.00": how the price list writes a price. */
export const dollars = (amount: number) => `$${amount}.00`;

/**
 * Services new to the price list, with their packages (cheapest first). A
 * service the CMS does not have yet (by title) is added to the end of the
 * list; the backend creates it in the CMS on its next boot
 * (backend/src/utils/plan-prices.ts: scripts/pricePlans.test.ts checks that it
 * lists the same), after which the CMS's own entry shows.
 */
export type AddedCategory = { category: string; plans: ReadonlyArray<{ title: string; price: number }> };

export const ADDED_CATEGORIES: readonly AddedCategory[] = [
  { category: "Naming", plans: [{ title: "Creative", price: 1500 }, { title: "Complex", price: 3000 }, { title: "Advanced", price: 6000 }] },
  { category: "Visual identity", plans: [{ title: "Creative", price: 1850 }] },
  { category: "Visual content", plans: [{ title: "Template", price: 620 }, { title: "Individual", price: 2000 }] },
];

/** The added services a list of category titles does not have. */
export const missingCategories = (titles: ReadonlyArray<string | null | undefined>) =>
  ADDED_CATEGORIES.filter((added) => !titles.some((title) => planKey(title ?? "") === planKey(added.category)));

/**
 * A category's packages with the changes applied: each item comes back with
 * `was`, the full price it is crossed out from (null: no discount from the
 * changes; the caller may know another from the CMS).
 */
export const withPriceChanges = <T extends { title?: string | null; price?: string | null }>(category: string, items: readonly T[]) =>
  items.flatMap((item): Array<T & { was: number | null }> => {
    const change = PRICE_CHANGES.find((candidate) => candidate.category === planKey(category) && candidate.plan === planKey(item.title ?? "") && candidate.from === priceNumber(item.price));
    if (!change) return [{ ...item, was: null }];
    return [
      { ...item, title: change.title ?? item.title, price: dollars(change.price), was: change.was ?? null },
      ...(change.add ?? []).map((extra) => ({ ...item, title: extra.title, price: dollars(extra.price), was: extra.was ?? null })),
    ];
  });
