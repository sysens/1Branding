import { COMPANY, COMPANY_ADDRESS, COMPANY_MAP_URL } from "./company";
import { LANGUAGE_TAGS, type SiteLocale } from "./locales";

export type SeoLocale = SiteLocale;

export const SITE_NAME = "OneBranding";
export const DEFAULT_OG_IMAGE = { path: "/og-image.jpg", width: 1200, height: 630 };
export const OG_LOCALES: Record<SeoLocale, string> = { en: "en_US", ru: "ru_RU", uz: "uz_UZ" };

// Search results show about 60 characters of a title; past that the brand
// suffix would only push the words that matter out of view.
const TITLE_MAX = 60;

/** Adds the brand suffix unless the title already carries it or would get too long (mirrors app.vue's titleTemplate). */
export const withSiteName = (title: string) => {
  const clean = title.trim();
  if (!clean) return SITE_NAME;
  if (clean.includes(SITE_NAME)) return clean;
  const full = `${clean} | ${SITE_NAME}`;
  return full.length > TITLE_MAX ? clean : full;
};

/** Strips markup and collapses whitespace, then trims to a snippet-sized sentence. */
export const toMetaDescription = (value: string | null | undefined, max = 160) => {
  const text = (value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd()}…`;
};

/** One page's entry in the CMS "SEO" single type (the shared.seo component). */
export type CmsSeo = { title?: string | null; description?: string | null };

// The CMS "SEO" single type was seeded with scaffolding such as "HomePage",
// "About Page  title" or "Contacts page  Description". Publishing those as the
// page title would bury the site in search results, so such values fall back to
// the curated copy in i18n until an editor writes real text.
const PLACEHOLDER = /^(?:home\s*page|about\s*page|price\s*page|contacts?\s*page|one\s*guarantee\s*page|page)\b.*$/i;

// Vocabulary of "Lorem ipsum" filler text; real Russian/English/Uzbek copy never
// contains two of these words.
const LOREM_WORDS = /\b(lorem|ipsum|dolor|amet|consectetur|adipiscing|pellentesque|suspendisse|vestibulum|facilisi|sodales|euismod|tincidunt|laoreet|fermentum|vehicula|rhoncus|curae)\b/gi;

/** True for dummy CMS copy such as "Lorem ipsum dolor sit amet…". */
export const isPlaceholderCopy = (value: string | null | undefined) =>
  new Set((value || "").toLowerCase().match(LOREM_WORDS) ?? []).size >= 2;

export const cmsSeoText = (value: string | null | undefined, minLength: number) => {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (text.length < minLength || PLACEHOLDER.test(text)) return "";
  return text;
};

export type BreadcrumbItem = { name: string; path: string };

export const breadcrumbSchema = (origin: string, items: BreadcrumbItem[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${origin}${item.path}`,
  })),
});

type OrganizationContact = {
  telephone?: string;
  email?: string;
  sameAs?: string[];
  /** The service pages, with names in the page's language (else SERVICES). */
  services?: Array<{ name: string; url: string }>;
};

const SERVICES: Record<SeoLocale, string[]> = {
  ru: [
    "Стратегия и платформа бренда",
    "Нейминг",
    "Разработка логотипа",
    "Фирменный стиль и айдентика",
    "Брендбук и гайдлайн",
    "Дизайн упаковки",
    "Ребрендинг",
    "Презентации и digital-дизайн",
  ],
  en: [
    "Brand strategy and platform",
    "Naming",
    "Logo design",
    "Visual identity",
    "Brand book and guidelines",
    "Packaging design",
    "Rebranding",
    "Presentations and digital design",
  ],
  uz: [
    "Brend strategiyasi va platformasi",
    "Neyming",
    "Logotip yaratish",
    "Firma uslubi va vizual identifikatsiya",
    "Brendbuk va gaydlayn",
    "Qadoq dizayni",
    "Rebrending",
    "Taqdimot va digital dizayn",
  ],
};

const ORG_DESCRIPTION: Record<SeoLocale, string> = {
  ru: "Брендинговое агентство полного цикла в Ташкенте: стратегия, нейминг, логотип, фирменный стиль, брендбук, дизайн упаковки и digital.",
  en: "Full-cycle branding agency in Tashkent, Uzbekistan: brand strategy, naming, logo design, visual identity, brand books, packaging and digital.",
  uz: "Toshkentdagi toʻliq siklli brending agentligi: brend strategiyasi, neyming, logotip, firma uslubi, brendbuk, qadoq dizayni va digital.",
};

const PLACES: Record<SeoLocale, { city: string; country: string; catalog: string }> = {
  ru: { city: "Ташкент", country: "Узбекистан", catalog: "Услуги брендинга" },
  en: { city: "Tashkent", country: "Uzbekistan", catalog: "Branding services" },
  uz: { city: "Toshkent", country: "Oʻzbekiston", catalog: "Brending xizmatlari" },
};

/** Site-wide ProfessionalService + WebSite graph, referenced from pages by `@id`. */
export const organizationGraph = (origin: string, locale: SeoLocale, contact: OrganizationContact) => {
  const orgId = `${origin}/#organization`;
  const address = COMPANY_ADDRESS[locale];
  const place = PLACES[locale];
  return [
    {
      "@type": "ProfessionalService",
      "@id": orgId,
      name: SITE_NAME,
      alternateName: [COMPANY.localName, "OneBranding Uzbekistan"],
      url: `${origin}/`,
      logo: `${origin}/General/apple-touch-icon.png`,
      image: `${origin}${DEFAULT_OG_IMAGE.path}`,
      description: ORG_DESCRIPTION[locale],
      slogan: "Design is how it works",
      address: {
        "@type": "PostalAddress",
        streetAddress: `${address.street}, ${address.district}`,
        addressLocality: address.city,
        addressRegion: address.city,
        postalCode: COMPANY.postalCode,
        addressCountry: COMPANY.country,
      },
      hasMap: COMPANY_MAP_URL,
      priceRange: COMPANY.priceRange,
      areaServed: [
        { "@type": "City", name: place.city },
        { "@type": "Country", name: place.country },
      ],
      knowsLanguage: ["uz", "ru", "en"],
      openingHoursSpecification: [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [...COMPANY.hours.days],
        opens: COMPANY.hours.opens,
        closes: COMPANY.hours.closes,
      }],
      ...(contact.telephone ? { telephone: contact.telephone } : {}),
      ...(contact.email ? { email: contact.email } : {}),
      ...(contact.telephone || contact.email ? {
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          ...(contact.telephone ? { telephone: contact.telephone } : {}),
          ...(contact.email ? { email: contact.email } : {}),
          areaServed: "UZ",
          availableLanguage: ["Russian", "Uzbek", "English"],
        },
      } : {}),
      ...(contact.sameAs?.length ? { sameAs: contact.sameAs } : {}),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: place.catalog,
        itemListElement: (contact.services?.length
          ? contact.services
          : SERVICES[locale].map((name) => ({ name, url: "" }))
        ).map(({ name, url }) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name, ...(url ? { url } : {}), provider: { "@id": orgId } },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      // The site's home is "/" in every language; each language is listed.
      url: `${origin}/`,
      name: SITE_NAME,
      alternateName: COMPANY.localName,
      inLanguage: LANGUAGE_TAGS[locale],
      publisher: { "@id": orgId },
    },
  ];
};

/** Accepts only a bare http(s) origin, e.g. "https://onebranding.uz". */
export const normalizeOrigin = (value: string | null | undefined) => {
  try {
    const url = new URL(String(value || "").trim());
    if (!/^https?:$/.test(url.protocol) || !url.hostname) return "";
    return url.origin;
  } catch {
    return "";
  }
};
