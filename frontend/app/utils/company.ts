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
  // The WhatsApp number of the request form's buttons (wa.me links). For now
  // the office phone: to be confirmed by the owners before it is advertised.
  whatsapp: { display: "+998 93 560 80 00", e164: "+998935608000" },
  country: "UZ",
  // The office: the C-Space Park coworking space, as Google Maps lists it.
  place: "C-Space Park",
  geo: { latitude: 41.3452744, longitude: 69.328451 },
  hours: { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "10:00", closes: "19:00" },
  // The prices on /pricing run from $35 (a presentation) to $5,900 (branding).
  priceRange: "$35–$5900",
} as const;

type Address = {
  street: string;
  city: string;
  country: string;
  /** The whole address as one line, in the local order, the place's name with it. */
  full: string;
};

// The address of C-Space Park as Google Maps gives it ("Durmon Road 1,
// Tashkent, Uzbekistan"); the listing has no postal code, so none is stated.
export const COMPANY_ADDRESS: Record<SiteLocale, Address> = {
  en: {
    street: "Durmon Road 1",
    city: "Tashkent",
    country: "Uzbekistan",
    full: "C-Space Park, Durmon Road 1, Tashkent, Uzbekistan",
  },
  ru: {
    street: "ул. Дурмон йули, 1",
    city: "Ташкент",
    country: "Узбекистан",
    full: "г. Ташкент, ул. Дурмон йули, 1, C-Space Park, Узбекистан",
  },
  uz: {
    street: "Durmon yoʻli koʻchasi, 1",
    city: "Toshkent",
    country: "Oʻzbekiston",
    full: "Toshkent sh., Durmon yoʻli koʻchasi, 1, C-Space Park, Oʻzbekiston",
  },
};

/** What a map is searched by: the place's name with its address. */
export const COMPANY_MAP_QUERY = `${COMPANY.place}, ${COMPANY_ADDRESS.en.street}, ${COMPANY_ADDRESS.en.city}`;

/** The office on Google Maps: C-Space Park's own listing (its place link). */
export const COMPANY_MAP_URL =
  "https://www.google.com/maps/place/C-Space+Park/@41.3452744,69.328451,17z/data=!4m6!3m5!1s0x38aef5002c4b8ff9:0xe2734b1a5c12289d!8m2!3d41.3452744!4d69.328451!16s%2Fg%2F11p1k6wjr1";

export type SocialKind = "instagram" | "telegram" | "behance" | "linkedin";

/** The chat a visitor writes to (the tracker adds their contact code to it). */
export const TELEGRAM_CONTACT_URL = "https://t.me/Onebranding_contact";
export const WHATSAPP_CONTACT_URL = `https://wa.me/${COMPANY.whatsapp.e164.replace(/\D/g, "")}`;

/** Profiles known to be the company's own (the Telegram one is the CMS's OneGuarantee call to action). */
const KNOWN_PROFILES: Partial<Record<SocialKind, string>> = {
  instagram: "https://www.instagram.com/onebranding.uz/",
  telegram: TELEGRAM_CONTACT_URL,
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
