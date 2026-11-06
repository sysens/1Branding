// Once the page has loaded and gone quiet, fetch the lazy images further down
// the page in the background, in page order and a few at a time, so they are
// ready by the time the visitor scrolls to them (as on slidor.agency, which
// loads its images up front) instead of starting to load as they come into
// view. Each one is fetched through a detached copy of it (of its <picture>
// when it has one) set to load eagerly: the copy picks the same file from
// srcset/sizes/<source> as the image will, so the image finds it in the cache
// when it loads. The page's own image is left as it was rendered: switching
// it to loading="eager" made the sections hydrated later (as they come into
// view) find an attribute the server did not render (Vue's hydration
// mismatch warning).
// Skipped on phones (mobile data: they keep loading as they scroll), when the
// visitor asked to save data, or when the connection is slow.

const BATCH = 4;
const BATCH_TIMEOUT = 8000;

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

// A copy of the image, outside the page, that loads now.
const eagerCopy = (img: HTMLImageElement) => {
  const picture = img.parentElement instanceof HTMLPictureElement ? img.parentElement : null;
  const copy = picture ? (picture.cloneNode(true) as HTMLPictureElement).querySelector("img")! : (img.cloneNode() as HTMLImageElement);
  copy.loading = "eager";
  return copy;
};

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
    const batch = queue.slice(i, i + BATCH).filter((img) => img.isConnected && !img.complete).map(eagerCopy);
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
