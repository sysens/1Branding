import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ADDED_CATEGORIES, PLAN_COVERAGE, PRICE_CHANGES, PRICE_LIST_LENGTH, categoryKey, coveredItems, dollars, isFixedPrice, missingCategories, planKey, planTone, priceNumber, priceUnitKey, warningItems, wasPrice, withPriceChanges } from "../app/utils/pricePlans";
import { SERVICE_PAGES } from "../app/utils/servicePages";
import { ADDED_CATEGORIES as BACKEND_ADDED, CHANGES as BACKEND_CHANGES } from "../../backend/src/utils/plan-prices";

const lists = (locale: string): Record<string, string[]> =>
  JSON.parse(readFileSync(path.join(import.meta.dir, "..", "app/content/pricing", `${locale}.json`), "utf8"));

describe("price packages", () => {
  test("every package has its place among its service's ten items", () => {
    for (const [category, plans] of Object.entries(PLAN_COVERAGE)) {
      const known = PRICE_CHANGES.filter((change) => change.category === category).flatMap((change) => [change.title ?? change.plan, ...(change.add ?? []).map((extra) => extra.title)]);
      for (const name of known) expect(Object.keys(plans)).toContain(planKey(name));
    }
    // An added service's packages: each has its place, the dearest the whole list.
    for (const added of ADDED_CATEGORIES) {
      const plans = PLAN_COVERAGE[planKey(added.category)] ?? {};
      expect(added.plans.map((plan) => planKey(plan.title))).toEqual(Object.keys(plans));
      expect(plans[planKey(added.plans.at(-1)!.title)]).toBe(PRICE_LIST_LENGTH);
    }
  });

  test("every service has ten items in every language", () => {
    for (const locale of ["en", "ru", "uz"]) {
      const copy = lists(locale);
      expect(Object.keys(copy).sort()).toEqual(Object.keys(PLAN_COVERAGE).sort());
      for (const items of Object.values(copy)) {
        expect(items).toHaveLength(PRICE_LIST_LENGTH);
        expect(new Set(items).size).toBe(PRICE_LIST_LENGTH);
      }
    }
  });

  test("a package covers the first items of its service's list", () => {
    expect(coveredItems("Branding", "Launch Base", 0, 3)).toBe(5);
    expect(coveredItems(" branding ", "One  Pro", 1, 3)).toBe(8);
    expect(coveredItems("Branding", "Global ultimate", 2, 3)).toBe(10);
    expect(coveredItems("Logo", "Individual", 0, 1)).toBe(10);
    // Never more than the list has.
    expect(coveredItems("Branding", "Global ultimate", 2, 3, 8)).toBe(8);
    expect(planKey("  All in  One ")).toBe("all in one");
  });

  test("the dearest package of a service covers the whole list", () => {
    for (const plans of Object.values(PLAN_COVERAGE)) {
      const counts = Object.values(plans);
      expect(Math.max(...counts)).toBe(PRICE_LIST_LENGTH);
      expect(Math.min(...counts)).toBeGreaterThan(0);
    }
  });

  test("a discounted package is crossed out from its full price", () => {
    expect(wasPrice(12750, 5400)).toBe(12750);
    // No full price in the CMS, or one that is not above the price: no discount.
    expect(wasPrice(Number.NaN, 25000)).toBeNull();
    expect(wasPrice(5400, 5400)).toBeNull();
    expect(wasPrice(1900, 2900)).toBeNull();
    expect(wasPrice(12750, Number.NaN)).toBeNull();
  });

  test("a package the CMS still has at its old price shows the new one", () => {
    const branding = withPriceChanges("Branding", [
      { title: "Launch Base", price: "$1900.00" },
      { title: " ONE pro ", price: "$2900.00" },
      { title: "Global ultimate", price: "$5900.00" },
    ]);
    expect(branding.map((plan) => [plan.title.trim(), plan.price, plan.was])).toEqual([
      ["Launch Base", "$2750.00", null],
      ["ONE pro", "$5400.00", 12750],
      ["Global ultimate", "$25000.00", null],
    ]);
    // Already updated in the CMS, edited there, or another package: shown as it is.
    const unchanged = [{ title: "One Pro", price: "$5400.00" }, { title: "One Pro", price: "$3100.00" }, { title: "Individual", price: "$900.00" }];
    expect(withPriceChanges("Branding", unchanged).map((plan) => [plan.title, plan.price, plan.was])).toEqual([
      ["One Pro", "$5400.00", null],
      ["One Pro", "$3100.00", null],
      ["Individual", "$900.00", null],
    ]);
  });

  test("the logo's package is renamed and gets a companion with its texts", () => {
    const logo = withPriceChanges("Logo", [{ title: "Individual", price: "$900.00", description: "Logo text." }]);
    expect(logo).toEqual([
      { title: "Standard", price: "$560.00", description: "Logo text.", was: null },
      { title: "One Pro", price: "$1500.00", description: "Logo text.", was: null },
    ]);
    // Once the CMS has the two packages, nothing is added again.
    const updated = [{ title: "Standard", price: "$560.00" }, { title: "One Pro", price: "$1500.00" }];
    expect(withPriceChanges("Logo", updated).map((plan) => plan.title)).toEqual(["Standard", "One Pro"]);
  });

  test("packaging's packages are One Pro and Leader product, One Pro first", () => {
    const packaging = withPriceChanges("Packaging", [
      { title: "Advanced", price: "$500.00" },
      { title: "All in one", price: "$1900.00" },
    ]);
    expect(packaging.map((plan) => [plan.title, plan.price])).toEqual([["Leader product", "$17200.00"], ["One Pro", "$1650.00"]]);
    // The tabs run cheapest first: One Pro, then Leader product.
    expect([...packaging].sort((a, b) => priceNumber(a.price) - priceNumber(b.price)).map((plan) => plan.title)).toEqual(["One Pro", "Leader product"]);
    // Both are "from" prices: only presentations are priced per slide.
    expect(SERVICE_PAGES.find((page) => page.priceCategory === "Packaging")?.priceUnit).toBeUndefined();
    expect(priceUnitKey("slide")).toBe("servicesPage.pricePerSlide");
    expect(priceUnitKey(null)).toBe("servicesPage.priceFrom");
  });

  test("presentation's Start and Global prices change, Product stays", () => {
    const presentation = withPriceChanges("Presentation", [
      { title: "Start", price: "$35.00" },
      { title: "Product", price: "$65.00" },
      { title: "Global", price: "$99.00" },
    ]);
    expect(presentation.map((plan) => [plan.title, plan.price])).toEqual([["Start", "$15.00"], ["Product", "$65.00"], ["Global", "$125.00"]]);
    // Still cheapest first: Start, Product, Global; priced per slide.
    expect([...presentation].sort((a, b) => priceNumber(a.price) - priceNumber(b.price)).map((plan) => plan.title)).toEqual(["Start", "Product", "Global"]);
    expect(SERVICE_PAGES.find((page) => page.priceCategory === "Presentation")?.priceUnit).toBe("slide");
  });

  test("a package's colour follows its place, but packaging's two have their own", () => {
    expect([0, 1, 2, 3].map((place) => planTone("Branding", "Any", place))).toEqual(["white", "green", "gold", "gold"]);
    expect(planTone("Logo", "Standard", 0)).toBe("white");
    expect(planTone("Logo", "One Pro", 1)).toBe("green");
    expect(planTone(" Packaging ", "One  Pro", 0)).toBe("green");
    expect(planTone("Packaging", "Leader product", 1)).toBe("gold");
  });

  test("Naming is a new service with Creative, Complex and Advanced", () => {
    const naming = ADDED_CATEGORIES.find((added) => added.category === "Naming")!;
    expect(naming.plans.map((plan) => [plan.title, plan.price])).toEqual([["Creative", 1500], ["Complex", 3000], ["Advanced", 6000]]);
    expect(naming.plans.map((plan) => dollars(plan.price))).toEqual(["$1500.00", "$3000.00", "$6000.00"]);
    // A price list without it gets it; one that has it (any case) does not.
    expect(missingCategories(["Branding", "Logo"]).map((added) => added.category)).toContain("Naming");
    expect(missingCategories(["Branding", " NAMING "]).map((added) => added.category)).not.toContain("Naming");
    expect(missingCategories(ADDED_CATEGORIES.map((added) => added.category.toUpperCase()))).toEqual([]);
    // Cheapest first, and the usual colours: white, green (recommended), gold.
    expect(naming.plans.map((plan) => plan.price)).toEqual([...naming.plans.map((plan) => plan.price)].sort((a, b) => a - b));
    expect(naming.plans.map((plan, place) => planTone("Naming", plan.title, place))).toEqual(["white", "green", "gold"]);
  });

  test("Visual identity and Visual content are new services too", () => {
    const find = (title: string) => ADDED_CATEGORIES.find((added) => added.category === title)!;
    expect(find("Visual identity").plans.map((plan) => [plan.title, plan.price])).toEqual([["Creative", 1850]]);
    expect(find("Visual content").plans.map((plan) => [plan.title, plan.price])).toEqual([["Template", 620], ["Individual", 2000]]);
    // The order of the services: Naming, then these two.
    expect(missingCategories([]).map((added) => added.category)).toEqual(["Naming", "Visual identity", "Visual content"]);
    // A one-package service is white; the two-package one is white, then green (recommended).
    expect(planTone("Visual identity", "Creative", 0)).toBe("white");
    expect(["Template", "Individual"].map((title, place) => planTone("Visual content", title, place))).toEqual(["white", "green"]);
  });

  test("a service's texts are named without spaces, and a template has a fixed price", () => {
    expect(categoryKey("Branding")).toBe("branding");
    expect(categoryKey(" Visual  identity ")).toBe("visualIdentity");
    expect(categoryKey("Visual content")).toBe("visualContent");
    expect(isFixedPrice("Visual content", "Template")).toBe(true);
    expect(isFixedPrice(" visual content ", " TEMPLATE ")).toBe(true);
    expect(isFixedPrice("Visual content", "Individual")).toBe(false);
    expect(isFixedPrice("Logo", "Standard")).toBe(false);
  });

  test("Visual identity's last item is the one with the warning mark", () => {
    expect(warningItems("Visual identity")).toEqual([PRICE_LIST_LENGTH - 1]);
    expect(warningItems(" visual  IDENTITY ")).toEqual([PRICE_LIST_LENGTH - 1]);
    expect(warningItems("Logo")).toEqual([]);
    for (const locale of ["en", "ru", "uz"]) {
      expect(lists(locale)["visual identity"]![PRICE_LIST_LENGTH - 1]).toBeTruthy();
    }
    // The English item is the guide.
    expect(lists("en")["visual identity"]![PRICE_LIST_LENGTH - 1]).toMatch(/^Guide/);
  });

  test("the pricing terms are the same seven rows in every language", () => {
    const terms = (locale: string) => JSON.parse(readFileSync(path.join(import.meta.dir, "..", "i18n/locales", `${locale}.json`), "utf8")).pricing.terms;
    for (const locale of ["en", "ru", "uz"]) {
      const { title, eyebrow, items } = terms(locale);
      expect(title).toBeTruthy();
      expect(eyebrow).toBeTruthy();
      expect(items).toHaveLength(7);
      for (const item of items) {
        expect(item.q).toBeTruthy();
        expect(item.a).toBeTruthy();
      }
    }
    // Names that stay as they are in every language.
    for (const locale of ["en", "ru", "uz"]) expect(terms(locale).items[3].q).toContain("FullSpeed-FullCreative");
  });

  test("every service has its name and text in every language", () => {
    for (const locale of ["en", "ru", "uz"]) {
      const categories = JSON.parse(readFileSync(path.join(import.meta.dir, "..", "i18n/locales", `${locale}.json`), "utf8")).pricing.categories;
      for (const category of Object.keys(PLAN_COVERAGE)) {
        expect(categories[categoryKey(category)]?.title).toBeTruthy();
        expect(categories[categoryKey(category)]?.description).toBeTruthy();
      }
    }
  });

  test("the backend creates the same services in the CMS", () => {
    const backend = BACKEND_ADDED.map((added) => ({ category: added.category, plans: added.plans.map((plan) => ({ title: plan.title, price: priceNumber(plan.price) })) }));
    expect(backend).toEqual(JSON.parse(JSON.stringify(ADDED_CATEGORIES)));
  });

  test("the backend writes the same changes into the CMS", () => {
    const dollars = (price: string) => priceNumber(price);
    const backend = BACKEND_CHANGES.map((change) => ({
      category: planKey(change.category),
      plan: planKey(change.plan),
      from: change.from,
      price: dollars(change.price),
      ...(change.oldPrice ? { was: dollars(change.oldPrice) } : {}),
      ...(change.title ? { title: change.title } : {}),
      ...(change.add ? { add: change.add.map((extra) => ({ title: extra.title, price: dollars(extra.price), ...(extra.oldPrice ? { was: dollars(extra.oldPrice) } : {}) })) } : {}),
    }));
    expect(backend.length).toBeGreaterThan(0);
    expect(backend).toEqual(JSON.parse(JSON.stringify(PRICE_CHANGES)));
  });

  test("a package added in the CMS is placed by its price", () => {
    // Four packages, none of them known: half the list, then evenly more.
    expect([0, 1, 2, 3].map((rank) => coveredItems("Web", `Plan ${rank}`, rank, 4))).toEqual([5, 7, 8, 10]);
    expect(coveredItems("Web", "Only", 0, 1)).toBe(10);
    // A fourth branding package between the known ones.
    expect(coveredItems("Branding", "New", 3, 4)).toBe(10);
    expect(coveredItems("Branding", "New", 1, 4)).toBe(7);
  });
});
