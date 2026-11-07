import type { SiteLocale } from "./locales";

/**
 * The company's own details, in one place: the Contacts page, the footer and
 * the Organization JSON-LD all read them from here, so search engines and
 * directories see one name, address and phone (NAP) everywhere.
 *
 * They live in the code, not the CMS: the CMS "Contacts" entry still carries
 * another company's Istanbul address and phone, and a wrong NAP on the contact
 * page is the worst local-SEO error a site can make.
 */
export const COMPANY = {
  name: "OneBranding",
  // The name used in directories (Google Business Profile, Yandex, 2GIS).
  localName: "OneBranding Tashkent",
  website: "onebrandingworld.com",
  phone: { display: "+998 93 560 80 00", e164: "+998935608000" },
  postalCode: "100047",
  country: "UZ",
  hours: { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "10:00", closes: "19:00" },
  // The prices on /pricing run from $35 (a presentation) to $5,900 (branding).
  priceRange: "$35–$5900",
} as const;

type Address = {
  street: string;
  district: string;
  city: string;
  country: string;
  /** The whole address as one line, in the local order. */
  full: string;
};

export const COMPANY_ADDRESS: Record<SiteLocale, Address> = {
  en: {
    street: "18A Amir Temur St., office 5",
    district: "Shaykhantakhur district",
    city: "Tashkent",
    country: "Uzbekistan",
    full: "18A Amir Temur St., office 5, Shaykhantakhur district, Tashkent 100047, Uzbekistan",
  },
  ru: {
    street: "ул. Амира Темура, 18А, офис 5",
    district: "Шайхантахурский район",
    city: "Ташкент",
    country: "Узбекистан",
    full: "г. Ташкент, Шайхантахурский район, ул. Амира Темура, 18А, офис 5, Узбекистан, 100047",
  },
  uz: {
    street: "Amir Temur koʻchasi, 18A, 5-ofis",
    district: "Shayxontohur tumani",
    city: "Toshkent",
    country: "Oʻzbekiston",
    full: "Toshkent sh., Shayxontohur tumani, Amir Temur koʻchasi, 18A, 5-ofis, Oʻzbekiston, 100047",
  },
};

/** Google Maps search for the office (no coordinates are invented here). */
export const COMPANY_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${COMPANY.name}, ${COMPANY_ADDRESS.en.street}, ${COMPANY_ADDRESS.en.city}`
)}`;

export type SocialKind = "instagram" | "telegram" | "behance" | "linkedin";

/** Profiles known to be the company's own (the Telegram one is the CMS's OneGuarantee call to action). */
const KNOWN_PROFILES: Partial<Record<SocialKind, string>> = {
  instagram: "https://www.instagram.com/onebranding.uz/",
  telegram: "https://t.me/Onebranding_contact",
};

// A link counts as a profile only with a handle after the host: the CMS holds
// bare "https://www.instagram.com/" and "https://web.telegram.org" stand-ins,
// and a personal LinkedIn page (/in/...) is not the company's.
const PROFILE_PATTERNS: Record<SocialKind, RegExp> = {
  instagram: /^https:\/\/(?:www\.)?instagram\.com\/[\w.]+\/?$/i,
  telegram: /^https:\/\/t\.me\/[\w]{4,}\/?$/i,
  behance: /^https:\/\/(?:www\.)?behance\.net\/[\w-]+\/?$/i,
  linkedin: /^https:\/\/(?:www\.)?linkedin\.com\/company\/[\w-]+\/?$/i,
};

/** The URL when `raw` is a real company profile, otherwise "". */
export const socialProfileUrl = (kind: SocialKind, raw?: string | null) => {
  let value = String(raw || "").trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) value = `https://${value.replace(/^\/+/, "")}`;
  value = value.replace(/^http:/i, "https:");
  return PROFILE_PATTERNS[kind].test(value) ? value : "";
};

/** The company's profiles: CMS links that are real profiles, else the known ones. */
export const companyProfiles = (cms?: Partial<Record<`${SocialKind}Link`, string | null>> | null) => {
  const kinds: SocialKind[] = ["instagram", "telegram", "behance", "linkedin"];
  return kinds
    .map((kind) => ({ kind, url: socialProfileUrl(kind, cms?.[`${kind}Link`]) || KNOWN_PROFILES[kind] || "" }))
    .filter((profile) => !!profile.url);
};

/**
 * The two profiles listed on the contact page (components/contacts/Locations.vue),
 * in the order shown. A row without an address is shown as a name only, not a
 * link: add the address here when the profile is ready.
 */
export const CONTACT_PAGE_LINKS: ReadonlyArray<{ key: "behance" | "awwwards"; label: string; url: string }> = [
  { key: "behance", label: "Behance", url: "" },
  { key: "awwwards", label: "Awwwards", url: "" },
];
