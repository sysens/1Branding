export type SeoLocale = "ru" | "en";

export const SITE_NAME = "OneBranding";
export const DEFAULT_OG_IMAGE = { path: "/og-image.jpg", width: 1200, height: 630 };
export const OG_LOCALES: Record<SeoLocale, string> = { ru: "ru_RU", en: "en_US" };

/** Adds the brand suffix unless the title already carries it (mirrors app.vue's titleTemplate). */
export const withSiteName = (title: string) => {
  const clean = title.trim();
  if (!clean) return SITE_NAME;
  return clean.includes(SITE_NAME) ? clean : `${clean} · ${SITE_NAME}`;
};

/** Strips markup and collapses whitespace, then trims to a snippet-sized sentence. */
export const toMetaDescription = (value: string | null | undefined, max = 160) => {
  const text = (value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd()}…`;
};

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
};

const ADDRESS: Record<SeoLocale, { streetAddress: string; addressLocality: string; addressRegion: string }> = {
  ru: { streetAddress: "ул. Амира Темура, 18А, офис 5", addressLocality: "Ташкент", addressRegion: "Шайхантахурский район" },
  en: { streetAddress: "18A Amir Temur St., office 5", addressLocality: "Tashkent", addressRegion: "Shaykhantakhur district" },
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
};

const ORG_DESCRIPTION: Record<SeoLocale, string> = {
  ru: "Брендинговое агентство полного цикла в Ташкенте: стратегия, нейминг, логотип, фирменный стиль, брендбук, дизайн упаковки и digital.",
  en: "Full-cycle branding agency in Tashkent, Uzbekistan: brand strategy, naming, logo design, visual identity, brand books, packaging and digital.",
};

/** Site-wide ProfessionalService + WebSite graph, referenced from pages by `@id`. */
export const organizationGraph = (origin: string, locale: SeoLocale, contact: OrganizationContact) => {
  const orgId = `${origin}/#organization`;
  const home = `${origin}${locale === "en" ? "/en" : "/"}`;
  return [
    {
      "@type": "ProfessionalService",
      "@id": orgId,
      name: SITE_NAME,
      alternateName: ["One Branding", "OneBranding agency", "Onebranding"],
      url: `${origin}/`,
      logo: `${origin}/General/apple-touch-icon.png`,
      image: `${origin}${DEFAULT_OG_IMAGE.path}`,
      description: ORG_DESCRIPTION[locale],
      slogan: "Design is how it works",
      address: { "@type": "PostalAddress", ...ADDRESS[locale], postalCode: "100047", addressCountry: "UZ" },
      areaServed: [
        { "@type": "City", name: locale === "ru" ? "Ташкент" : "Tashkent" },
        { "@type": "Country", name: locale === "ru" ? "Узбекистан" : "Uzbekistan" },
      ],
      knowsLanguage: ["ru", "uz", "en"],
      openingHoursSpecification: [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "19:00",
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
        name: locale === "ru" ? "Услуги брендинга" : "Branding services",
        itemListElement: SERVICES[locale].map((name) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name, provider: { "@id": orgId } },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: home,
      name: SITE_NAME,
      inLanguage: locale,
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
