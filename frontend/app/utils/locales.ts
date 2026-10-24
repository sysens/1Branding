// The site's languages. English is the default and lives at "/", the others
// under their own prefix ("/ru", "/uz"). Order: x-default first.
export const SITE_LOCALES = ["en", "ru", "uz"] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];

export const isSiteLocale = (value: unknown): value is SiteLocale =>
  (SITE_LOCALES as readonly unknown[]).includes(value);

/** The locale of a page from i18n's code; anything unknown is English. */
export const toSiteLocale = (value: unknown): SiteLocale => (isSiteLocale(value) ? value : "en");

/** "" for English, "/ru" or "/uz" otherwise. */
export const localePrefix = (locale: SiteLocale) => (locale === "en" ? "" : `/${locale}`);

/** A site path in a language: localizedPath("/", "ru") === "/ru". */
export const localizedPath = (path: string, locale: SiteLocale) => {
  const prefix = localePrefix(locale);
  if (!prefix) return path || "/";
  return path === "/" || !path ? prefix : `${prefix}${path}`;
};

/** Each language by its own name, for the language switcher. */
export const LANGUAGE_NAMES: Record<SiteLocale, string> = { en: "English", ru: "Русский", uz: "Oʻzbekcha" };

/** BCP 47 tags for <html lang>, hreflang and JSON-LD inLanguage. */
export const LANGUAGE_TAGS: Record<SiteLocale, string> = { en: "en", ru: "ru", uz: "uz" };
