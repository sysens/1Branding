import manifest from "./optImages.json";

// Build-time responsive copies of the landing's images (scripts/optimize-images.mjs):
// AVIF and WebP at a ladder of widths under /opt, named with the source's
// content hash. Sources that are not in the manifest are used as they are.

export type OptEntry = { w: number; h: number; v: string; widths: number[]; alpha?: boolean; lqip?: string };
export type OptSources = {
  avif: string;
  webp: string;
  /** A WebP copy for browsers without <picture>/srcset (and for CSS masks). */
  fallback: string;
  width: number;
  height: number;
  lqip?: string;
};

const entries = manifest as Record<string, OptEntry>;

export const optEntry = (src: string | null | undefined): OptEntry | null =>
  (src && entries[src.split(/[?#]/)[0]!]) || null;

/** URL of one copy: /opt/home/identity/mms.<hash>-<width>.<format>. */
export const optUrl = (src: string, entry: OptEntry, width: number, format: "avif" | "webp") => {
  const path = src.split(/[?#]/)[0]!;
  const dot = path.lastIndexOf(".");
  return `/opt${path.slice(0, dot)}.${entry.v}-${width}.${format}`;
};

/**
 * srcsets for a source. `maxWidth` drops the larger copies (for images that
 * are never drawn wide); `fallbackWidth` picks the WebP used as plain src.
 */
export function optSources(src: string | null | undefined, options: { maxWidth?: number; fallbackWidth?: number } = {}): OptSources | null {
  const entry = optEntry(src);
  if (!src || !entry) return null;
  const limit = options.maxWidth ?? Infinity;
  const widths = entry.widths.filter((w, i) => w <= limit || i === 0);
  const srcset = (format: "avif" | "webp") => widths.map((w) => `${optUrl(src, entry, w, format)} ${w}w`).join(", ");
  const target = options.fallbackWidth ?? 960;
  const fallbackWidth = widths.find((w) => w >= target) ?? widths[widths.length - 1]!;
  return {
    avif: srcset("avif"),
    webp: srcset("webp"),
    fallback: optUrl(src, entry, fallbackWidth, "webp"),
    width: entry.w,
    height: entry.h,
    lqip: entry.lqip,
  };
}

/** The largest AVIF copy: for a single-size use such as a CSS mask. */
export const optLargest = (src: string, format: "avif" | "webp" = "avif") => {
  const entry = optEntry(src);
  return entry ? optUrl(src, entry, entry.widths[entry.widths.length - 1]!, format) : src;
};

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * <picture> markup for code that builds HTML strings or DOM by hand (v-html
 * tiles, the CSS3D gallery). `imgAttrs` is the rest of the <img> tag.
 */
export function optPictureHtml(src: string, sizes: string, imgAttrs: string, options: { maxWidth?: number; fallbackWidth?: number } = {}) {
  const sources = optSources(src, options);
  if (!sources) return `<img src="${escapeAttr(src)}" ${imgAttrs}>`;
  const preview = sources.lqip ? ` style="background:url(${sources.lqip}) center/cover no-repeat"` : "";
  return `<picture class="opt-picture"><source type="image/avif" srcset="${escapeAttr(sources.avif)}" sizes="${escapeAttr(sizes)}"><source type="image/webp" srcset="${escapeAttr(sources.webp)}" sizes="${escapeAttr(sizes)}"><img src="${escapeAttr(sources.fallback)}" sizes="${escapeAttr(sizes)}"${preview} ${imgAttrs}></picture>`;
}
