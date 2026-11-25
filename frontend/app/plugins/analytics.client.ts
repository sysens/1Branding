/**
 * The marketing tags, each off until its ID is configured: Google Analytics 4
 * (NUXT_PUBLIC_GA4_ID), Yandex Metrika with Webvisor
 * (NUXT_PUBLIC_YANDEX_METRIKA_ID), Google Tag Manager (NUXT_PUBLIC_GTM_ID),
 * Meta Pixel (NUXT_PUBLIC_META_PIXEL_ID) and Google Ads
 * (NUXT_PUBLIC_GOOGLE_ADS_ID, conversion label NUXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL).
 * Their scripts load once the visitor engages, so they never compete with the
 * first screen.
 *
 * `$track(name, params)` is the one call for an event: it goes, under the same
 * name, to GA4 (an event), Metrika (a goal), GTM's dataLayer and the site's
 * own tracker (plugins/ob-tracker.client.ts, `$ob`), and to the pixel and Ads
 * where they have a matching event (Lead and the conversion on form_submit,
 * Contact on messenger_click, PageView on page_view). Page views are the
 * exception for GA4 and Metrika, which count them their own way (see below).
 * Clicks on phone, e-mail and other social links are tracked here.
 *
 * It also remembers where the visit started (first page, referrer, utm_*
 * tags) for the contact form's "Source" field (utils/leadSource.ts).
 */
import { ATTRIBUTION_KEY } from "~/utils/leadSource";
import type { ObApi, TrackFn } from "~/utils/obTracker";

type Gtag = (...args: unknown[]) => void;
type Ym = ((id: number, method: string, ...args: unknown[]) => void) & { a?: unknown[]; l?: number };
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
  disablePushState?: boolean;
};
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag; ym?: Ym; fbq?: Fbq; _fbq?: Fbq };

const rememberAttribution = () => {
  try {
    if (sessionStorage.getItem(ATTRIBUTION_KEY)) return;
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({
      landing: `${location.pathname}${location.search}`,
      referrer: document.referrer,
    }));
  } catch {
    // Storage blocked (private mode, settings): the form just sends less.
  }
};

// The scripts (~250 KB for GA4 and Metrika alone, ~400 ms of a mid-range
// phone's main thread) come once the visitor first interacts (scroll, tap,
// key, pointer) or 10 s after the page has loaded, whichever is first. They
// never compete with the first screen, and a lab test such as PageSpeed,
// which does not interact, measures the page without them. Calls made before
// that wait in their queues.
const ENGAGE_EVENTS = ["pointerdown", "pointermove", "keydown", "touchstart", "scroll", "wheel"] as const;
const FALLBACK_MS = 10_000;

const whenEngaged = (task: () => void) => {
  let done = false;
  let timer = 0;
  const run = () => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    for (const name of ENGAGE_EVENTS) window.removeEventListener(name, run);
    task();
  };
  for (const name of ENGAGE_EVENTS) window.addEventListener(name, run, { once: true, passive: true });
  const startTimer = () => {
    timer = window.setTimeout(run, FALLBACK_MS);
  };
  if (document.readyState === "complete") startTimer();
  else window.addEventListener("load", startTimer, { once: true });
};

const addScript = (src: string) => {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

const setting = (value: unknown, pattern: RegExp) => {
  const text = String(value || "").trim();
  return pattern.test(text) ? text : "";
};

export default defineNuxtPlugin((nuxtApp) => {
  rememberAttribution();

  const config = useRuntimeConfig().public;
  const ga4Id = setting(config.ga4Id, /^G-[A-Z0-9]+$/i);
  const metrikaId = Number(setting(config.yandexMetrikaId, /^\d+$/)) || 0;
  const gtmId = setting(config.gtmId, /^GTM-[A-Z0-9]+$/i);
  const pixelId = setting(config.metaPixelId, /^\d{5,20}$/);
  const adsId = setting(config.googleAdsId, /^AW-\d+$/i);
  const adsLabel = setting(config.googleAdsLeadLabel, /^[\w-]+$/);
  const w = window as AnalyticsWindow;

  if (ga4Id || adsId || gtmId) w.dataLayer = w.dataLayer || [];

  // GA4 and Google Ads share one gtag.js.
  if (ga4Id || adsId) {
    // gtag.js reads the `arguments` objects it is handed, not arrays.
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    if (ga4Id) {
      // gtag.js arrives only on engagement (whenEngaged): the landing page is
      // recorded as it was when the visit started (the visitor may have moved
      // on by then). Later page changes are picked up by GA4's enhanced
      // measurement (browser history events), so `$track("page_view")` is not
      // sent to GA4 again.
      w.gtag("config", ga4Id, { send_page_view: false });
      w.gtag("event", "page_view", { page_location: location.href, page_referrer: document.referrer, page_title: document.title, send_to: ga4Id });
    }
    if (adsId) w.gtag("config", adsId);
    whenEngaged(() => addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id || adsId)}`));
  }

  if (gtmId) {
    w.dataLayer!.push({ "gtm.start": Date.now(), event: "gtm.js" });
    whenEngaged(() => addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`));
  }

  if (pixelId) {
    // Meta's standard snippet, its script loaded on engagement like the others.
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    }) as Fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    // The pixel would count the app's page changes itself (history.pushState);
    // PageView is sent on each page_view instead, so it is counted once.
    fbq.disablePushState = true;
    w.fbq = fbq;
    if (!w._fbq) w._fbq = fbq;
    fbq("init", pixelId);
    whenEngaged(() => addScript("https://connect.facebook.net/en_US/fbevents.js"));
  }

  if (metrikaId) {
    const ym: Ym = function ymQueue(...args: unknown[]) {
      (ym.a = ym.a || []).push(args);
    } as Ym;
    ym.l = Date.now();
    w.ym = ym;
    w.ym(metrikaId, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true, defer: true });
    // `defer` turns off Metrika's own first hit: the landing page is sent here,
    // and every page the app moves to once it has rendered (and set its title).
    w.ym(metrikaId, "hit", location.href, { title: document.title, referer: document.referrer });
    whenEngaged(() => addScript("https://mc.yandex.ru/metrika/tag.js"));
    let previous = location.href;
    nuxtApp.hook("page:finish", () => {
      requestAnimationFrame(() => {
        if (location.href === previous) return;
        w.ym?.(metrikaId, "hit", location.href, { title: document.title, referer: previous });
        previous = location.href;
      });
    });
  }

  const track: TrackFn = (name, params = {}) => {
    try {
      const pageView = name === "page_view";
      if (!pageView) {
        if (ga4Id) w.gtag?.("event", name, { ...params, send_to: ga4Id });
        if (metrikaId) w.ym?.(metrikaId, "reachGoal", name, params);
      }
      if (gtmId) w.dataLayer!.push({ event: name, ...params });
      if (pageView) w.fbq?.("track", "PageView");
      else if (name === "messenger_click") w.fbq?.("track", "Contact", { content_name: params.channel });
      else if (name === "form_submit") {
        const eventId = String(params.eventId || "");
        // The server sends the same Lead through the Conversions API with this
        // event id: Meta counts the two once.
        w.fbq?.("track", "Lead", { content_category: params.service, content_name: params.method }, eventId ? { eventID: eventId } : undefined);
        if (adsId && adsLabel) w.gtag?.("event", "conversion", { send_to: `${adsId}/${adsLabel}`, transaction_id: eventId });
        // The name the form's requests had before form_submit (GA4's recommended
        // lead event), so key events and goals set up on it keep counting.
        if (ga4Id) w.gtag?.("event", "generate_lead", { form: "contact", page_path: location.pathname, send_to: ga4Id });
        if (metrikaId) w.ym?.(metrikaId, "reachGoal", "generate_lead");
      }
      (nuxtApp.$ob as ObApi | undefined)?.track(name, params);
    } catch {
      // A tag's own error never reaches the page.
    }
  };

  // Calls, e-mails and the other social profiles: the contacts that never
  // reach the form. (Telegram, WhatsApp and Instagram are messenger_click, in
  // plugins/ob-tracker.client.ts.)
  document.addEventListener("click", (event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link) return;
    const href = link.getAttribute("href") || "";
    const where = location.pathname;
    if (href.startsWith("tel:")) track("phone_click", { link_url: href, page_path: where });
    else if (href.startsWith("mailto:")) track("email_click", { link_url: href, page_path: where });
    else if (/^https:\/\/(?:www\.)?(?:behance\.net|linkedin\.com)\//i.test(href)) {
      track("social_click", { link_url: href, page_path: where });
    }
  }, { capture: true, passive: true });

  nuxtApp.provide("track", track);
});
