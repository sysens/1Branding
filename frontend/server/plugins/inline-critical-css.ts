// Nuxt inlines component styles but still links the entry stylesheet and the
// shared Header/Footer chunks (~12 KB compressed). Those three links blocked the
// first paint for an extra round trip, which Lighthouse measured at ~1.3 s on a
// mobile connection, so their CSS is inlined into the HTML instead.
//
// Each link stays in place with a non-CSS `type`, which browsers never fetch
// (`disabled` alone is still fetched by Chrome's preload scanner). Vite's preload
// helper matches links by href + rel, so it still sees the CSS as loaded and does
// not append it again when a client-side navigation imports a chunk using it.
const STYLESHEET_LINK = /<link rel="stylesheet" href="(\/_nuxt\/[^"]+\.css)"([^>]*)>/g;
const RELATIVE_URL = /url\((["']?)(\.{1,2}\/[^"')]+)\1\)/g;

const cssCache = new Map<string, Promise<string>>();

// The files are content-hashed, so each one is read once per server process.
const loadCss = (href: string) => {
  let css = cssCache.get(href);
  if (!css) {
    css = $fetch<string>(href, { responseType: "text" })
      .then((text) => text
        // url(../fonts/x.woff2) is relative to /_nuxt/; inline it would resolve
        // against the page URL instead (/en/ProjectSlug/... breaks), so make it
        // absolute.
        .replace(RELATIVE_URL, (_, quote: string, path: string) => `url(${quote}${new URL(path, `http://x${href}`).pathname}${quote})`)
        // Keep an embedded "</style" from closing the tag early.
        .replace(/<\/style/gi, "<\\/style"))
      .catch(() => {
        cssCache.delete(href);
        return "";
      });
    cssCache.set(href, css);
  }
  return css;
};

export default defineNitroPlugin((nitroApp) => {
  if (import.meta.dev) return;

  nitroApp.hooks.hook("render:html", async (html) => {
    const hrefs = new Set<string>();
    for (const chunk of html.head) {
      for (const match of chunk.matchAll(STYLESHEET_LINK)) hrefs.add(match[1]!);
    }
    if (!hrefs.size) return;

    const styles = new Map(await Promise.all([...hrefs].map(async (href) => [href, await loadCss(href)] as const)));
    html.head = html.head.map((chunk) =>
      chunk.replace(STYLESHEET_LINK, (tag, href: string, attrs: string) => {
        const css = styles.get(href);
        return css ? `<style>${css}</style><link rel="stylesheet" href="${href}"${attrs} type="text/x-inlined">` : tag;
      })
    );
  });
});
