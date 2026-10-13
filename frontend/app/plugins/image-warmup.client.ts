// Once the page has loaded and gone quiet, fetch the lazy images further down
// the page in the background, in page order and a few at a time, so they are
// ready by the time the visitor scrolls to them (as on slidor.agency, which
// loads its images up front) instead of starting to load as they come into
// view. Switching an image from loading="lazy" to "eager" is what starts its
// download; it keeps choosing its own copy from srcset/<picture>.
// Skipped on phones (mobile data: they keep loading as they scroll), when the
// visitor asked to save data, or when the connection is slow.

const BATCH = 4;
const BATCH_TIMEOUT = 8000;

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

const settled = (img: HTMLImageElement) =>
  new Promise<void>((resolve) => {
    if (img.complete) return resolve();
    const done = () => resolve();
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });

const idle = () =>
  new Promise<void>((resolve) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => resolve(), { timeout: 2000 });
    else setTimeout(resolve, 300);
  });

async function warm() {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!window.matchMedia("(min-width: 768px)").matches) return;
  if (connection?.saveData || /(^|-)2g|3g/.test(connection?.effectiveType ?? "")) return;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const path = location.pathname;
  const queue = [...document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')]
    .map((img) => ({ img, top: img.getBoundingClientRect().top + window.scrollY }))
    // Not rendered (inside a closed menu, a hidden tab...): leave it lazy.
    .filter(({ img, top }) => !img.complete && top > window.scrollY && img.getClientRects().length > 0)
    .sort((a, b) => a.top - b.top)
    .map(({ img }) => img);
  for (let i = 0; i < queue.length; i += BATCH) {
    if (location.pathname !== path) return;
    await idle();
    const batch = queue.slice(i, i + BATCH).filter((img) => img.isConnected && !img.complete);
    batch.forEach((img) => { img.loading = "eager"; });
    await Promise.race([Promise.all(batch.map(settled)), new Promise((resolve) => setTimeout(resolve, BATCH_TIMEOUT))]);
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const start = () => { void warm(); };
  nuxtApp.hook("app:mounted", () => {
    if (document.readyState === "complete") setTimeout(start, 0);
    else window.addEventListener("load", start, { once: true });
  });
  nuxtApp.hook("page:finish", () => {
    if (document.readyState === "complete") setTimeout(start, 0);
  });
});
