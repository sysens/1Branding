import { SERVICE_PAGES, type ServiceKey } from "./servicePages";

/**
 * The request form's lists and checks (components/contacts/LeadForm.vue,
 * composables/useLeadForm.ts), apart from Vue so scripts/leadForm.test.ts can
 * run them: industries, services, the phone masks of the countries offered,
 * the Telegram username rule, and the request sent to Strapi when the
 * dashboard cannot be reached.
 */

export const INDUSTRIES = [
  "retail", "horeca", "food", "construction", "it", "education",
  "health", "finance", "manufacturing", "logistics", "services", "other",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

/** The site's services, plus the whole package and "not sure yet". */
export type LeadServiceKey = ServiceKey | "package" | "unsure";
export const LEAD_SERVICES: readonly LeadServiceKey[] = [...SERVICE_PAGES.map((page) => page.key), "package", "unsure"];

export const CONTACT_METHODS = ["phone", "telegram", "whatsapp"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

/** A country of the phone field: its dialling code and the national number's mask (one # a digit). */
export type Country = { iso: string; dial: string; mask: string; min?: number };

export const COUNTRIES: readonly Country[] = [
  { iso: "UZ", dial: "998", mask: "## ### ## ##" },
  { iso: "KZ", dial: "7", mask: "### ### ## ##" },
  { iso: "KG", dial: "996", mask: "### ### ###" },
  { iso: "TJ", dial: "992", mask: "## ### ####" },
  { iso: "RU", dial: "7", mask: "### ### ## ##" },
  { iso: "TR", dial: "90", mask: "### ### ## ##" },
  { iso: "AE", dial: "971", mask: "## ### ####" },
  { iso: "US", dial: "1", mask: "### ### ####" },
  { iso: "GB", dial: "44", mask: "#### ######" },
  // German numbers run from 7 to 11 digits.
  { iso: "DE", dial: "49", mask: "#### #######", min: 7 },
];
export const DEFAULT_COUNTRY = "UZ";

export const countryOf = (iso: string): Country => COUNTRIES.find((country) => country.iso === iso) ?? COUNTRIES[0]!;

const maxDigits = (country: Country) => country.mask.replace(/[^#]/g, "").length;

/**
 * Digits only, laid out by the country's mask ("901234567" -> "90 123 45 67").
 * A number pasted with its country code (+998 90 ...) loses the code.
 */
export const formatPhone = (input: string, country: Country) => {
  let digits = input.replace(/\D/g, "");
  if (digits.length > maxDigits(country) && digits.startsWith(country.dial)) digits = digits.slice(country.dial.length);
  digits = digits.slice(0, maxDigits(country));
  let out = "";
  let next = 0;
  for (const char of country.mask) {
    if (next >= digits.length) break;
    out += char === "#" ? digits[next++] : char;
  }
  return out;
};

export const isValidPhone = (value: string, country: Country) => {
  const count = value.replace(/\D/g, "").length;
  return count >= (country.min ?? maxDigits(country)) && count <= maxDigits(country);
};

/** "+998901234567". */
export const toE164 = (value: string, country: Country) => `+${country.dial}${value.replace(/\D/g, "")}`;

/** "@name" from "name", "@name" or a t.me link. */
export const normalizeTelegram = (input: string) =>
  `@${input.trim().replace(/^(?:https?:\/\/)?(?:www\.)?t(?:elegram)?\.me\//i, "").replace(/^@/, "").replace(/\/+$/, "")}`;

export const isValidTelegram = (input: string) => /^@?[A-Za-z0-9_]{5,32}$/.test(normalizeTelegram(input));

/**
 * Strapi's contact request requires a phone number (seven digits at least).
 * A visitor who leaves only a Telegram username has none: this stands in for
 * it, and the username leads the topic line of the Telegram notification.
 */
export const NO_PHONE = "0000000";

const oneLine = (value: string) => value.replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, " ").replace(/\s+/g, " ").trim();
const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

/**
 * The request as the old quick form sent it to Strapi (POST
 * /api/contacts-requests, backend/src/middlewares/contact-protection.ts):
 * TopicInput (200 characters) carries how to reach the visitor, the company,
 * the industry and the services; FullName the name; PhoneNumber the phone.
 */
export const strapiLeadData = (
  lead: { name: string; company: string; method: ContactMethod; contact: string },
  industry: string,
  services: string[],
) => {
  const how = lead.method === "telegram" ? `Telegram ${lead.contact}` : lead.method === "whatsapp" ? "WhatsApp" : "";
  const topic = [how, lead.company, industry, services.join(", ")].map(oneLine).filter(Boolean).join(" · ");
  return {
    TopicInput: clip(topic, 200),
    FullName: clip(oneLine(lead.name), 150),
    PhoneNumber: lead.method === "telegram" ? NO_PHONE : lead.contact,
  };
};
