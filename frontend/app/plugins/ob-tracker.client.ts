/**
 * The site's own visitor tracker, for the CRM and analytics dashboard: who the
 * visitor is (a first-party id), where each visit came from (first touch and
 * last significant click, utils/obTracker.ts), the ids the other tools know
 * them by, and what they do (page views and time on page, scroll depth,
 * engagement, prices and cases seen, calls to action, messengers, language).
 *
 * Events are batched and sent to /api/ob/c, the site's own proxy to the
 * dashboard (server/routes/api/ob/[...path].ts), so the CSP's connect-src
 * 'self' covers it. The first batch of a page load goes by fetch and its
 * answer may carry the visitor's contact code ("OB-1042"), which the Telegram
 * and WhatsApp links then carry in their prefilled text; later batches go as
 * beacons. Failures are silent: a batch is tried twice, then dropped.
 *
 * The events themselves go out through `$track` (plugins/analytics.client.ts),
 * which sends each one to every tool (GA4, Metrika, GTM, Meta Pixel) and back
 * here through `$ob.track`. Obvious bots are not tracked.
 */
import {
  SESSION_MS, applyTouch, buildFbc, caseSlug, cookieDomain, deviceType, fallbackCode, gaClientId, isBot, isCode,
  isExpired, isUuid, messengerOf, readTouch, uuid, withText,
  type ObApi, type Touch, type TrackFn, type TrackParams,
} from "~/utils/obTracker";

type Visit = { id: string; t: number; a: number };
type TrackerEvent = { id: string; n: string; t: number; p: string; q?: TrackParams };

const ENDPOINT = "/api/ob/c";
const FLUSH_MS = 5_000;
const BATCH = 20;
// Active time: the page is visible and focused, and the visitor did something in the last 30 s.
const IDLE_MS = 30_000;
const ENGAGED = [30, 60, 180];
const SCROLL_MARKS = [25, 50, 75, 90];
const ACTIVITY = ["pointerdown", "pointermove", "keydown", "scroll", "wheel", "touchstart"];

// Storage can be blocked (private mode, settings): then the tracker forgets between pages.
const read = (store: "localStorage" | "sessionStorage", key: string) => {
  try {
    return window[store].getItem(key);
  } catch {
    return null;
  }
};
const write = (store: "localStorage" | "sessionStorage", key: string, value: string) => {
  try {
    window[store].setItem(key, value);
  } catch {
    // Blocked or full.
  }
};
const parse = (value: string | null): unknown => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};
const asTouch = (value: unknown) => {
  const touch = value as Touch | null;
  return touch && typeof touch.land === "string" && typeof touch.at === "number" ? touch : null;
};
const asVisit = (value: unknown): Visit | null => {
  const visit = value as Visit | null;
  return visit && isUuid(visit.id) && Number.isFinite(visit.t) ? { id: visit.id, t: visit.t, a: Number(visit.a) || 0 } : null;
};
const cookie = (name: string) => {
  const row = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  try {
    return row ? decodeURIComponent(row.slice(name.length + 1)) : "";
  } catch {
    return "";
  }
};
const here = () => `${location.pathname}${location.search}`;

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n;
  const lang = () => String(i18n.locale.value);
  const bot = isBot(navigator.userAgent, navigator.webdriver);
  const now = Date.now();
  const device = deviceType(navigator.userAgent, window.innerWidth, navigator.maxTouchPoints);
  const save = (key: string, value: string) => {
    if (!bot) write("localStorage", key, value);
  };

  // ---------- the visitor: a cookie (shared with the subdomains) and localStorage ----------
  const vid = [cookie("ob_vid"), read("localStorage", "ob:vid")].find(isUuid) ?? uuid();
  if (!bot) {
    const domain = cookieDomain(location.hostname);
    document.cookie = `ob_vid=${vid}; max-age=${180 * 86_400}; path=/; SameSite=Lax${domain ? `; domain=${domain}` : ""}${location.protocol === "https:" ? "; Secure" : ""}`;
    save("ob:vid", vid);
  }

  // ---------- where this visit came from, and the visit ----------
  const touch = readTouch(location.href, document.referrer, now);
  const stored = asVisit(parse(read("sessionStorage", "ob:sid"))) ?? asVisit(parse(read("localStorage", "ob:sid")));
  const { first, last, newVisit } = applyTouch(
    { first: asTouch(parse(read("localStorage", "ob:ft"))), last: asTouch(parse(read("localStorage", "ob:lt"))) },
    touch,
    isExpired(stored, now),
  );
  let visit: Visit = newVisit || !stored ? { id: uuid(), t: now, a: 0 } : { ...stored, t: now };
  const saveVisit = () => {
    if (bot) return;
    write("sessionStorage", "ob:sid", JSON.stringify(visit));
    save("ob:sid", JSON.stringify(visit));
  };
  // A visit idle for 30 minutes is over: whatever comes next starts another.
  const renew = (t: number) => {
    if (t - visit.t <= SESSION_MS) return;
    visit = { id: uuid(), t, a: 0 };
    saveVisit();
  };
  save("ob:ft", JSON.stringify(first));
  save("ob:lt", JSON.stringify(last));
  saveVisit();

  // ---------- the ids the other tools know the visitor by ----------
  const metrikaId = Number(String(useRuntimeConfig().public.yandexMetrikaId || "").trim()) || 0;
  let ym = "";
  const w = window as Window & { ym?: (...args: unknown[]) => void };
  if (metrikaId && w.ym) w.ym(metrikaId, "getClientID", (id: unknown) => { ym = String(id || ""); });
  const ids = () => {
    // Meta's click id cookie, as its pixel would write it, while the pixel has not.
    const click = touch.fbclid ? touch : last?.fbclid ? last : null;
    return {
      ga: gaClientId(cookie("_ga")),
      ym: ym || cookie("_ym_uid"),
      fbp: cookie("_fbp"),
      fbc: cookie("_fbc") || (click ? buildFbc(click.fbclid!, click.at) : ""),
    };
  };

  // ---------- the contact code ----------
  const code = () => {
    const value = read("localStorage", "ob:code");
    return isCode(value) ? value : null;
  };
  const ensureCode = () => {
    let value = code();
    if (!value) {
      value = fallbackCode();
      save("ob:code", value);
    }
    return value;
  };
  const withCode = (base: string, value: string) => withText(base, i18n.t("messenger.text", { code: value }));

  // ---------- transport ----------
  let queue: TrackerEvent[] = [];
  const retried = new WeakSet<TrackerEvent>();
  // Batches go by fetch until one has been answered (it may bring the code), then as beacons.
  let answered = false;
  // The proxy said the dashboard is not there (503): nothing more is sent from this page.
  let down = false;
  const requeue = (events: TrackerEvent[]) => {
    const again = events.filter((event) => !retried.has(event));
    again.forEach((event) => retried.add(event));
    queue = [...again, ...queue];
  };
  const flush = () => {
    if (bot || down || !queue.length) return;
    const ev = queue.splice(0, 50);
    const body = JSON.stringify({ v: 1, vid, sid: visit.id, first, last, ids: ids(), ctx: { lang: lang(), device, sw: screen.width }, ev });
    const type = "text/plain;charset=UTF-8";
    try {
      if (answered && navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type }))) return;
    } catch {
      // A beacon refused: the fetch below.
    }
    fetch(ENDPOINT, { method: "POST", keepalive: true, headers: { "content-type": type }, body })
      .then(async (res) => {
        if (res.status === 503) {
          down = true;
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        answered = true;
        const data = (await res.json().catch(() => null)) as { code?: unknown } | null;
        if (isCode(data?.code)) save("ob:code", data.code);
      })
      .catch(() => requeue(ev));
  };

  // ---------- events ----------
  let pv = "";
  let path = "";
  const push = (name: string, params?: TrackParams, page = here()) => {
    if (bot || down) return;
    const t = Date.now();
    if (name !== "page_time") renew(t);
    const event: TrackerEvent = { id: name === "page_view" ? pv : uuid(), n: name, t, p: page };
    if (params && Object.keys(params).length) event.q = params;
    queue.push(event);
    if (queue.length >= BATCH) flush();
  };
  const record: TrackFn = (name, params) => push(name, params);
  // Through `$track`: GA4, Metrika, GTM and the pixel get the same event.
  const send = (name: string, params?: TrackParams) => {
    const track = nuxtApp.$track as TrackFn | undefined;
    if (track) track(name, params);
    else record(name, params);
  };

  const api: ObApi = {
    vid: () => vid,
    sid: () => visit.id,
    code,
    ensureCode,
    touches: () => ({ first, last }),
    ids,
    device: () => device,
    track: record,
    messengerHref: (base) => {
      const value = code();
      return value ? withCode(base, value) : base;
    },
  };
  nuxtApp.provide("ob", api);
  if (bot) return;

  // ---------- page views, time on page, scroll depth, prices seen ----------
  let pageActive = 0;
  let pageReported = 0;
  let marks = 0;
  let pricing: IntersectionObserver | null = null;
  // Active seconds on the page so far (the dashboard keeps the largest per page view).
  const pageTime = () => {
    if (!pv || pageActive <= pageReported) return;
    pageReported = pageActive;
    push("page_time", { pv, s: pageActive }, path);
  };
  const watchPricing = () => {
    pricing?.disconnect();
    const blocks = document.querySelectorAll("[data-ob-pricing]");
    if (!blocks.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      // Half of the block, or half of the screen for a block taller than two screens.
      const seen = entries.find((entry) => entry.isIntersecting && (entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= innerHeight / 2));
      if (!seen) return;
      observer.disconnect();
      send("view_pricing", { block: seen.target.getAttribute("data-ob-pricing") || "" });
    }, { threshold: [0.25, 0.5, 0.75, 1] });
    blocks.forEach((block) => observer.observe(block));
    pricing = observer;
  };
  const startPage = () => {
    pageTime();
    pricing?.disconnect();
    pv = uuid();
    path = here();
    pageActive = 0;
    pageReported = 0;
    marks = 0;
    send("page_view", { lang: lang() });
    const slug = caseSlug(location.pathname);
    if (slug) send("view_case", { case: decodeURIComponent(slug) });
    // Once the page has rendered (and hydrated, on the first one).
    setTimeout(watchPricing, 1_000);
  };
  startPage();
  nuxtApp.hook("page:finish", () => {
    requestAnimationFrame(() => {
      if (here() !== path) startPage();
    });
  });

  let lastActive = now;
  const onActivity = () => { lastActive = Date.now(); };
  for (const name of ACTIVITY) addEventListener(name, onActivity, { capture: true, passive: true });
  setInterval(() => {
    const t = Date.now();
    if (document.visibilityState !== "visible" || !document.hasFocus() || t - lastActive > IDLE_MS) return;
    renew(t);
    pageActive++;
    visit.a++;
    visit.t = t;
    saveVisit();
    if (ENGAGED.includes(visit.a)) send(`engaged_${visit.a}s`);
  }, 1_000);

  let scrollQueued = false;
  addEventListener("scroll", () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const height = document.documentElement.scrollHeight;
      if (height <= innerHeight) return;
      const depth = ((scrollY + innerHeight) / height) * 100;
      SCROLL_MARKS.forEach((mark, index) => {
        if (depth < mark || marks & (1 << index)) return;
        marks |= 1 << index;
        send(`scroll_${mark}`);
      });
    });
  }, { passive: true });

  // ---------- clicks: messengers (with the code), language, calls to action ----------
  const onClick = (event: MouseEvent) => {
    // A primary or middle click opens the link; a right click (the menu's "copy link") only gets the code.
    const opens = event.type === "click" || (event.type === "auxclick" && event.button === 1);
    const target = event.target as Element | null;
    const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (link) {
      const channel = messengerOf(link.href);
      if (channel && (opens || event.type === "contextmenu")) {
        const value = ensureCode();
        // Synchronously, before the browser follows the link.
        if (channel !== "instagram") link.href = withCode(link.href, value);
        if (opens) send("messenger_click", { channel, code: value });
      }
      const to = link.getAttribute("hreflang");
      if (opens && to && to !== lang()) send("lang_switch", { from: lang(), to });
    }
    if (!opens) return;
    const cta = target?.closest?.(".ob-button, [data-ob-cta], a[href*='contact#contact-request']") as HTMLElement | null;
    if (cta) {
      send("cta_click", {
        button: (cta.dataset.obCta || cta.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
        page: location.pathname,
      });
    }
  };
  for (const type of ["click", "auxclick", "contextmenu"] as const) document.addEventListener(type, onClick, { capture: true });

  // ---------- sending ----------
  const leave = () => {
    pageTime();
    flush();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") leave();
  });
  addEventListener("pagehide", leave);
  // The first batch soon, so the contact code is there before a messenger click.
  setTimeout(flush, 1_500);
  setInterval(flush, FLUSH_MS);
});
