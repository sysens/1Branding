// Where a visit started, kept for the contact form's "Source" field: the
// first page (with its utm_* tags) and the referrer, recorded by
// plugins/analytics.client.ts in sessionStorage.
export const ATTRIBUTION_KEY = "ob:attribution";

export type Attribution = { landing?: string; referrer?: string };

const MAX = 500;

const host = (url?: string) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
};

/** One line such as "google.com | landing /ru/services/brending?utm_source=x | form /ru/contact". */
export const describeLeadSource = (attribution: Attribution | null, formPath: string, siteHost: string) => {
  const from = host(attribution?.referrer);
  const referrer = !from ? "direct" : from === siteHost.replace(/^www\./, "") ? "internal" : from;
  return [referrer, attribution?.landing && `landing ${attribution.landing}`, `form ${formPath}`]
    .filter(Boolean)
    .join(" | ")
    .replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, " ")
    .slice(0, MAX);
};

export const readAttribution = (): Attribution | null => {
  try {
    const value = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || "null");
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
};
