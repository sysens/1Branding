import type { ServiceKey } from "./servicePages";
import type { SiteLocale } from "./locales";

/**
 * One service page's copy in one language
 * (app/content/services/<key>.<locale>.json). Every claim in it must be true
 * of OneBranding: no invented numbers, clients or results.
 */
export interface ServicePageCopy {
  /** <title> without the brand (added when it fits in 60 characters). */
  title: string;
  /** Meta description, 140–160 characters. */
  description: string;
  h1: string;
  /** The answer in one or two sentences: what it is, for whom, from how much. */
  lead: string;
  intro: string[];
  includes: { title: string; items: string[] };
  process: { title: string; steps: Array<{ name: string; text: string }> };
  /** Only when the site states the timeline (FAQ: identity in 2–6 weeks). */
  timeline?: { title: string; text: string } | null;
  faq: { title: string; items: Array<{ q: string; a: string }> };
  cta: { title: string; text: string; button: string };
}

const loaders = import.meta.glob<ServicePageCopy>("../content/services/*.json", { import: "default" });

/** The copy of a service page, or null when that language has none. */
export const loadServiceCopy = async (key: ServiceKey, locale: SiteLocale): Promise<ServicePageCopy | null> => {
  const load = loaders[`../content/services/${key}.${locale}.json`];
  return load ? load() : null;
};
