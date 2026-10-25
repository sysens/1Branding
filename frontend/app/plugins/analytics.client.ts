/**
 * Visitor analytics, off until an ID is configured: Google Analytics 4
 * (NUXT_PUBLIC_GA4_ID) and Yandex Metrika (NUXT_PUBLIC_YANDEX_METRIKA_ID).
 * Both load once the page is idle, so they never compete with the first
 * screen. `$track(name, params)` sends one event to both (GA4 event, Metrika
 * goal); clicks on phone, e-mail and social links are tracked here.
 *
 * It also remembers where the visit started (first page, referrer, utm_*
 * tags) for the contact form's "Source" field (utils/leadSource.ts).
 */
import { ATTRIBUTION_KEY } from "~/utils/leadSource";

type Gtag = (...args: unknown[]) => void;
type Ym = ((id: number, method: string, ...args: unknown[]) => void) & { a?: unknown[]; l?: number };
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag; ym?: Ym };

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

// The two scripts (~250 KB, ~400 ms of a mid-range phone's main thread) come
// once the visitor first interacts (scroll, tap, key, pointer) or 10 s after
// the page has loaded, whichever is first. They never compete with the first
// screen, and a lab test such as PageSpeed, which does not interact, measures
// the page without them. Calls made before that wait in their queues.
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

export default defineNuxtPlugin((nuxtApp) => {
  rememberAttribution();

  const config = useRuntimeConfig().public;
  const ga4Id = String(config.ga4Id || "").trim();
  const metrikaId = Number(String(config.yandexMetrikaId || "").trim()) || 0;
  const w = window as AnalyticsWindow;

  if (ga4Id && /^G-[A-Z0-9]+$/i.test(ga4Id)) {
    w.dataLayer = w.dataLayer || [];
    // gtag.js reads the `arguments` objects it is handed, not arrays.
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    // gtag.js arrives only on engagement (whenEngaged): the landing page is recorded
    // as it was when the visit started (the visitor may have moved on by then).
    // Later page changes are picked up by GA4's enhanced measurement (browser
    // history events).
    w.gtag("config", ga4Id, { send_page_view: false });
    w.gtag("event", "page_view", { page_location: location.href, page_referrer: document.referrer, page_title: document.title });
    whenEngaged(() => addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`));
  }

  if (metrikaId) {
    const ym: Ym = function ymQueue(...args: unknown[]) {
      (ym.a = ym.a || []).push(args);
    } as Ym;
    ym.l = Date.now();
    w.ym = ym;
    w.ym(metrikaId, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, defer: true });
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

  const track = (name: string, params: Record<string, unknown> = {}) => {
    w.gtag?.("event", name, params);
    if (metrikaId) w.ym?.(metrikaId, "reachGoal", name, params);
  };

  // Calls, e-mails and social profiles: the contacts that never reach the form.
  document.addEventListener("click", (event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link) return;
    const href = link.getAttribute("href") || "";
    const where = location.pathname;
    if (href.startsWith("tel:")) track("phone_click", { link_url: href, page_path: where });
    else if (href.startsWith("mailto:")) track("email_click", { link_url: href, page_path: where });
    else if (/^https:\/\/(?:www\.)?(?:instagram\.com|t\.me|behance\.net|linkedin\.com)\//i.test(href)) {
      track("social_click", { link_url: href, page_path: where });
    }
  }, { capture: true, passive: true });

  nuxtApp.provide("track", track);
});
