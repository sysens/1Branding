import { SITE_LOCALES, localizedPath, type SiteLocale } from "./locales";

/**
 * The service pages (/services/<slug>): one page per service, with its own
 * address in each language, so a search for "разработка логотипа" or
 * "logotip yaratish" can land on a page about exactly that. Names and short
 * descriptions are in i18n (servicePages.<key>); each page's copy is in
 * app/content/services/<key>.<locale>.json.
 *
 * Slugs are part of the URLs: change one only together with a 301 from the
 * old address (server/middleware/legacy-urls.ts redirects any known slug of a
 * service to its slug in the requested language).
 */
export type ServiceKey =
  | "strategy" | "branding" | "logo" | "identity" | "brandbook" | "packaging" | "print"
  | "social" | "photo" | "motion" | "presentation" | "web" | "uiux" | "crm" | "signage";

export type PriceCategory = "Branding" | "Logo" | "Packaging" | "Presentation";

export interface ServicePage {
  key: ServiceKey;
  slugs: Record<SiteLocale, string>;
  /** The page's picture: one of our own projects. */
  image: string;
  /** The /pricing category whose packages the page lists. */
  priceCategory?: PriceCategory;
  /** What one price buys when it is not the whole job (presentations: a slide). */
  priceUnit?: "slide";
  /** The broader service this one is part of (breadcrumbs, links). */
  parent?: ServiceKey;
  related: ServiceKey[];
  /** CMS case study tags shown as this service's work (none: no block). */
  caseTags?: string[];
  /** Last content change, for the sitemap's lastmod. */
  updated: string;
}

const UPDATED = "2026-10-23";
// The pages that show related case studies ("Our work") since this date.
const CASES_ADDED = "2026-10-25";

export const SERVICE_PAGES: readonly ServicePage[] = [
  {
    key: "branding",
    caseTags: ["Branding"],
    slugs: { en: "branding", ru: "brending", uz: "brending" },
    image: "/home/threeLayerLocal/26.webp",
    priceCategory: "Branding",
    related: ["logo", "identity", "brandbook", "strategy", "packaging"],
    // Title moved off "branding agency", which is the home page's query.
    updated: "2026-10-25",
  },
  {
    key: "logo",
    caseTags: ["Logo"],
    slugs: { en: "logo-design", ru: "razrabotka-logotipa", uz: "logotip-yaratish" },
    image: "/home/threeLayerLocal/14.webp",
    priceCategory: "Logo",
    parent: "branding",
    related: ["identity", "brandbook", "branding", "packaging"],
    updated: CASES_ADDED,
  },
  {
    key: "identity",
    caseTags: ["Identity"],
    slugs: { en: "brand-identity", ru: "firmennyj-stil", uz: "firma-uslubi" },
    image: "/home/threeLayerLocal/22.webp",
    parent: "branding",
    related: ["logo", "brandbook", "print", "branding"],
    updated: CASES_ADDED,
  },
  {
    key: "brandbook",
    caseTags: ["Identity"],
    slugs: { en: "brand-book", ru: "brendbuk", uz: "brendbuk" },
    image: "/home/threeLayerLocal/16.webp",
    parent: "branding",
    related: ["identity", "logo", "branding", "print"],
    updated: CASES_ADDED,
  },
  {
    key: "strategy",
    slugs: { en: "brand-strategy-naming", ru: "brend-strategiya-i-nejming", uz: "brend-strategiyasi-va-neyming" },
    image: "/home/threeLayerLocal/15.webp",
    related: ["branding", "logo", "identity", "social"],
    updated: UPDATED,
  },
  {
    key: "packaging",
    caseTags: ["Packaging"],
    slugs: { en: "packaging-design", ru: "dizajn-upakovki", uz: "qadoq-dizayni" },
    image: "/home/threeLayerLocal/34.webp",
    priceCategory: "Packaging",
    related: ["branding", "photo", "print", "motion"],
    updated: CASES_ADDED,
  },
  {
    key: "print",
    caseTags: ["Menu"],
    slugs: { en: "graphic-print-design", ru: "graficheskij-dizajn-i-poligrafiya", uz: "grafik-dizayn-va-poligrafiya" },
    image: "/home/threeLayerLocal/18.webp",
    related: ["identity", "packaging", "signage", "presentation"],
    updated: CASES_ADDED,
  },
  {
    key: "social",
    slugs: { en: "social-media-marketing", ru: "smm-i-reklamnye-kampanii", uz: "smm-va-reklama-kampaniyalari" },
    image: "/home/threeLayerLocal/33.webp",
    related: ["photo", "motion", "strategy", "branding"],
    updated: UPDATED,
  },
  {
    key: "photo",
    slugs: { en: "product-photography", ru: "predmetnaya-fotosemka-i-retush", uz: "mahsulot-fotosurati-va-retush" },
    image: "/home/threeLayerLocal/13.webp",
    related: ["packaging", "social", "motion", "web"],
    updated: UPDATED,
  },
  {
    key: "motion",
    slugs: { en: "video-3d-motion-design", ru: "video-3d-i-motion-dizajn", uz: "video-3d-va-motion-dizayn" },
    image: "/home/threeLayerLocal/23.webp",
    related: ["social", "photo", "presentation", "packaging"],
    updated: UPDATED,
  },
  {
    key: "presentation",
    slugs: { en: "presentation-design", ru: "dizajn-prezentacij", uz: "taqdimot-dizayni" },
    image: "/home/threeLayerLocal/19.webp",
    priceCategory: "Presentation",
    priceUnit: "slide",
    related: ["identity", "print", "motion", "strategy"],
    updated: UPDATED,
  },
  {
    key: "web",
    slugs: { en: "website-development", ru: "razrabotka-sajtov", uz: "veb-sayt-yaratish" },
    image: "/home/threeLayerLocal/28.webp",
    related: ["uiux", "branding", "photo", "crm"],
    updated: UPDATED,
  },
  {
    key: "uiux",
    caseTags: ["UX/UI"],
    slugs: { en: "ui-ux-design", ru: "ui-ux-dizajn", uz: "ui-ux-dizayn" },
    image: "/home/threeLayerLocal/39.webp",
    related: ["web", "crm", "identity", "motion"],
    updated: CASES_ADDED,
  },
  {
    key: "crm",
    slugs: { en: "crm-erp-odoo", ru: "vnedrenie-crm-erp-odoo", uz: "crm-erp-odoo-joriy-etish" },
    image: "/home/Frame331.jpg",
    related: ["web", "uiux", "strategy"],
    updated: UPDATED,
  },
  {
    key: "signage",
    slugs: { en: "signage-exhibition-design", ru: "dizajn-vyvesok-i-vystavochnyh-stendov", uz: "lavha-va-korgazma-dizayni" },
    image: "/home/scene.jpg",
    related: ["identity", "print", "branding", "motion"],
    updated: UPDATED,
  },
];

const BY_KEY = new Map(SERVICE_PAGES.map((page) => [page.key, page]));

export const serviceByKey = (key: ServiceKey) => BY_KEY.get(key)!;

/** The service a slug (in any language) belongs to. */
export const serviceBySlug = (slug: string) => {
  const value = slug.toLowerCase();
  return SERVICE_PAGES.find((page) => SITE_LOCALES.some((locale) => page.slugs[locale] === value));
};

/** "/services/<slug>" with the language prefix, e.g. "/ru/services/razrabotka-logotipa". */
export const servicePath = (key: ServiceKey, locale: SiteLocale) =>
  localizedPath(`/services/${serviceByKey(key).slugs[locale]}`, locale);

/** The services hub, "/services" with the language prefix. */
export const servicesHubPath = (locale: SiteLocale) => localizedPath("/services", locale);

// The CMS category pages that were live before the service pages: their old
// addresses (/services/<documentId>) now 301 to the matching service page.
export const LEGACY_SERVICE_IDS: Record<string, ServiceKey> = {
  rq51r0st097n29olxjbe1q5h: "branding",
};
