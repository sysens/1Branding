/**
 * The visitor tracker's pure parts (plugins/ob-tracker.client.ts runs them):
 * where a visit came from (a "touch"), which touch counts as the last click,
 * the third-party ids read from cookies and the visitor's device. No storage,
 * no globals: scripts/obTracker.test.ts runs them as they are.
 */

/**
 * Where one page load came from: utm_* tags, ad click ids, the external
 * referrer, the landing page (pathname + search) and when (ms epoch).
 */
export type Touch = {
  src?: string;
  med?: string;
  cmp?: string;
  cnt?: string;
  trm?: string;
  gclid?: string;
  yclid?: string;
  fbclid?: string;
  ref?: string;
  land: string;
  at: number;
};

export type Touches = { first: Touch | null; last: Touch | null };

/** What the dashboard knows the visitor by in the other tools. */
export type ExternalIds = { ga: string; ym: string; fbp: string; fbc: string };

export type Device = "mobile" | "tablet" | "desktop";

export type TrackParams = Record<string, unknown>;
/** `$track` (plugins/analytics.client.ts): one call, every tool. */
export type TrackFn = (name: string, params?: TrackParams) => void;

/** `$ob` (plugins/ob-tracker.client.ts): the tracker's state for the form and links. */
export type ObApi = {
  vid: () => string;
  sid: () => string;
  /** The visitor's contact code ("OB-1042"), once the dashboard or a messenger click has given one. */
  code: () => string | null;
  /** The stored code, or a new fallback one (stored and returned). */
  ensureCode: () => string;
  touches: () => Touches;
  ids: () => ExternalIds;
  device: () => Device;
  /** Records an event for the dashboard only (`$track` fans out to every tool, this one included). */
  track: TrackFn;
  /** A Telegram or WhatsApp link with the prefilled text and the visitor's code (the link as it is while there is no code). */
  messengerHref: (base: string) => string;
};

type TagKey = "src" | "med" | "cmp" | "cnt" | "trm" | "gclid" | "yclid" | "fbclid";
const TAGS: ReadonlyArray<[TagKey, string]> = [
  ["src", "utm_source"],
  ["med", "utm_medium"],
  ["cmp", "utm_campaign"],
  ["cnt", "utm_content"],
  ["trm", "utm_term"],
  ["gclid", "gclid"],
  ["yclid", "yclid"],
  ["fbclid", "fbclid"],
];
const MAX = 500;

/** A visit ends after this long without activity. */
export const SESSION_MS = 30 * 60 * 1000;

/** The site's own domains: a cookie set on one of them covers its subdomains (www, the project microsites). */
export const SITE_DOMAINS = ["onebrandingworld.com", "onebranding.uz"];

const bare = (host: string) => host.toLowerCase().replace(/^www\./, "");

/** ".onebrandingworld.com" on that domain and its subdomains, "" (host-only) anywhere else. */
export const cookieDomain = (host: string) => {
  const name = host.toLowerCase();
  const site = SITE_DOMAINS.find((domain) => name === domain || name.endsWith(`.${domain}`));
  return site ? `.${site}` : "";
};

/** A referrer from the site itself (or one of its subdomains) is not a source. */
export const isInternalHost = (from: string, host: string) => {
  const a = bare(from);
  const b = bare(host);
  if (a === b) return true;
  const domain = cookieDomain(b);
  return !!domain && `.${a}`.endsWith(domain);
};

export const readTouch = (href: string, referrer: string, now: number): Touch => {
  const url = new URL(href);
  const touch: Touch = { land: `${url.pathname}${url.search}`.slice(0, MAX), at: now };
  for (const [key, param] of TAGS) {
    const value = url.searchParams.get(param)?.trim();
    if (value) touch[key] = value.slice(0, MAX);
  }
  try {
    const from = new URL(referrer);
    if (/^https?:$/.test(from.protocol) && !isInternalHost(from.hostname, url.hostname)) touch.ref = referrer.slice(0, MAX);
  } catch {
    // No referrer (a typed address, a bookmark, an app): a direct visit.
  }
  return touch;
};

/** Tags, a click id or an external referrer: a click worth remembering. */
export const isSignificant = (touch: Touch) => !!touch.ref || TAGS.some(([key]) => !!touch[key]);

const refHost = (ref?: string) => {
  try {
    return ref ? bare(new URL(ref).hostname) : "";
  } catch {
    return "";
  }
};

/** A touch's source; a reload or a back/forward of the same landing has the same one. */
export const touchKey = (touch: Touch | null) =>
  touch ? JSON.stringify([...TAGS.map(([key]) => touch[key] || ""), refHost(touch.ref)]) : "";

export const isExpired = (session: { t: number } | null, now: number) => !session || now - session.t > SESSION_MS;

/**
 * This page load's touch against the stored ones. The first touch is kept
 * forever. The last one is the last significant click: replaced by a touch
 * with tags, a click id or an external referrer, never by a direct visit (it
 * only fills an empty slot). A visit starts over when the last one ended (30
 * minutes without activity) or a new source arrives; the same source again
 * within the visit (a reload, back/forward) changes nothing.
 */
export const applyTouch = (prev: Touches, touch: Touch, expired: boolean) => {
  const significant = isSignificant(touch);
  const newSource = significant && touchKey(touch) !== touchKey(prev.last);
  const newVisit = expired || newSource;
  return {
    first: prev.first ?? touch,
    last: significant && newVisit ? touch : prev.last ?? touch,
    newVisit,
  };
};

/** GA4's client id from its `_ga` cookie: "GA1.1.123.456" -> "123.456". */
export const gaClientId = (cookie: string) => /^GA\d+\.\d+\.(\d+\.\d+)$/.exec(cookie.trim())?.[1] ?? "";

/** Meta's click id cookie value, as the pixel would write it. */
export const buildFbc = (fbclid: string, at: number) => `fb.1.${at}.${fbclid}`;

export const deviceType = (ua: string, width: number, touchPoints = 0): Device => {
  // iPadOS reports itself as a Mac; only the touch screen gives it away.
  if (/iPad|Tablet|PlayBook|Silk|Kindle|Android(?!.*Mobile)/i.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)) return "tablet";
  if (/Mobi|iPhone|iPod|Opera Mini|IEMobile|Windows Phone/i.test(ua) || width < 768) return "mobile";
  return width < 1025 && touchPoints > 0 ? "tablet" : "desktop";
};

const BOT_UA = /bot|crawl|spider|slurp|archiver|headless|lighthouse|pagespeed|phantom|selenium|puppeteer|playwright|facebookexternalhit|bingpreview|yandex(?:metrika|images|direct)|google(?:other|-inspectiontool)/i;
export const isBot = (ua: string, webdriver = false) => webdriver || BOT_UA.test(ua);

const random = (bytes: number) => crypto.getRandomValues(new Uint8Array(bytes));

/** A v4 UUID; randomUUID needs a secure context, so a plain http host gets one built by hand. */
export const uuid = (): string => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = random(16);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const hex = Array.from(b, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/** A contact code made here while the dashboard has not given one: "OB-" and six digits. */
export const fallbackCode = () => `OB-${Array.from(random(6), (byte) => byte % 10).join("")}`;

export const isCode = (value: unknown): value is string => typeof value === "string" && /^OB-\d{3,10}$/.test(value);

/** The chat link with `text` prefilled (spaces as %20: WhatsApp would show a "+"). */
export const withText = (href: string, text: string) => `${href.split(/[?#]/)[0]}?text=${encodeURIComponent(text)}`;

export type Messenger = "telegram" | "whatsapp" | "instagram";
/** Which messenger a link opens; only the company's Telegram chat and WhatsApp get the code. */
export const messengerOf = (href: string): Messenger | null => {
  if (/^https?:\/\/(?:www\.)?t(?:elegram)?\.me\/onebranding_contact\/?(?:[?#]|$)/i.test(href)) return "telegram";
  if (/^https?:\/\/(?:api\.)?wa\.me\//i.test(href)) return "whatsapp";
  if (/^https?:\/\/(?:www\.)?instagram\.com\//i.test(href)) return "instagram";
  return null;
};

/** A case study's slug from its page's path (/projects/<slug>, any language). */
export const caseSlug = (pathname: string) => /^(?:\/(?:en|ru|uz))?\/projects\/([^/?#]+)\/?$/.exec(pathname)?.[1] ?? "";
