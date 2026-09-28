import { computed, toValue, type MaybeRefOrGetter } from "vue";
import {
  DEFAULT_OG_IMAGE,
  OG_LOCALES,
  breadcrumbSchema,
  toMetaDescription,
  withSiteName,
  type BreadcrumbItem,
  type SeoLocale,
} from "~/utils/seo";

type JsonLd = Record<string, unknown>;

export type PageSeoInput = {
  title: MaybeRefOrGetter<string>;
  description?: MaybeRefOrGetter<string | null | undefined>;
  type?: "website" | "article";
  /** Absolute or site-relative image; falls back to the branded OG card. */
  image?: MaybeRefOrGetter<string | null | undefined>;
  imageAlt?: MaybeRefOrGetter<string | null | undefined>;
  /** Extra JSON-LD nodes for this page (merged into one @graph with the breadcrumbs). */
  structuredData?: MaybeRefOrGetter<JsonLd | JsonLd[] | null | undefined>;
  /** Breadcrumb trail after "Home"; omit on the home page. */
  breadcrumbs?: MaybeRefOrGetter<BreadcrumbItem[] | null | undefined>;
  /** false => noindex (previews, fallback-language copies, utility pages). */
  indexable?: MaybeRefOrGetter<boolean>;
  /** Emit ru/en hreflang alternates (only when both language versions exist). */
  alternates?: MaybeRefOrGetter<boolean>;
};

const cleanPath = (path: string) => {
  const bare = path.split(/[?#]/)[0] || "/";
  return bare.length > 1 ? bare.replace(/\/+$/, "") : "/";
};

/**
 * One place for every page's search/social metadata: title, description,
 * canonical, hreflang, Open Graph/Twitter cards, robots and JSON-LD.
 */
export const usePageSeo = (input: PageSeoInput) => {
  const route = useRoute();
  const { locale, t } = useI18n();
  const switchLocalePath = useSwitchLocalePath();
  const localePath = useLocalePath();
  const origin = useSiteOrigin();

  const lang = computed<SeoLocale>(() => (locale.value === "en" ? "en" : "ru"));
  const title = computed(() => toValue(input.title)?.trim() || "");
  const fullTitle = computed(() => withSiteName(title.value));
  const description = computed(() => toMetaDescription(toValue(input.description)) || t("seo.description"));
  const canonical = computed(() => `${origin}${cleanPath(route.path)}`);
  const indexable = computed(() => toValue(input.indexable) ?? true);
  const withAlternates = computed(() => toValue(input.alternates) ?? true);

  const image = computed(() => {
    const value = toValue(input.image)?.trim();
    if (!value) return `${origin}${DEFAULT_OG_IMAGE.path}`;
    return /^https?:\/\//i.test(value) ? value : `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
  });
  const isDefaultImage = computed(() => image.value === `${origin}${DEFAULT_OG_IMAGE.path}`);

  const alternates = computed(() => {
    if (!withAlternates.value || !indexable.value) return [];
    const links = (["ru", "en"] as const).map((code) => {
      const path = switchLocalePath(code);
      return path ? { rel: "alternate", hreflang: code, href: `${origin}${cleanPath(path)}`, key: `hreflang-${code}` } : null;
    }).filter((link): link is NonNullable<typeof link> => !!link);
    const ruLink = links.find((link) => link.hreflang === "ru");
    if (ruLink) links.push({ ...ruLink, hreflang: "x-default", key: "hreflang-x-default" });
    return links;
  });

  const jsonLd = computed(() => {
    const nodes: JsonLd[] = [];
    const crumbs = toValue(input.breadcrumbs);
    if (crumbs?.length) {
      nodes.push(breadcrumbSchema(origin, [
        { name: t("nav.home"), path: cleanPath(localePath("/")) },
        ...crumbs.map((crumb) => ({ ...crumb, path: cleanPath(crumb.path) })),
      ]));
    }
    const extra = toValue(input.structuredData);
    if (extra) nodes.push(...(Array.isArray(extra) ? extra : [extra]));
    // "<" is escaped so CMS text can never close the <script> element.
    return nodes.length
      ? JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c")
      : "";
  });

  useSeoMeta({
    title: () => title.value,
    description: () => description.value,
    robots: () => indexable.value
      ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      : "noindex, follow",
    ogTitle: () => fullTitle.value,
    ogDescription: () => description.value,
    ogType: () => toValue(input.type) || "website",
    ogUrl: () => canonical.value,
    ogSiteName: "OneBranding",
    ogLocale: () => OG_LOCALES[lang.value],
    ogLocaleAlternate: () => [OG_LOCALES[lang.value === "ru" ? "en" : "ru"]],
    ogImage: () => image.value,
    ogImageWidth: () => (isDefaultImage.value ? DEFAULT_OG_IMAGE.width : undefined),
    ogImageHeight: () => (isDefaultImage.value ? DEFAULT_OG_IMAGE.height : undefined),
    ogImageAlt: () => toValue(input.imageAlt) || fullTitle.value,
    twitterCard: "summary_large_image",
    twitterTitle: () => fullTitle.value,
    twitterDescription: () => description.value,
    twitterImage: () => image.value,
  });

  useHead(() => ({
    link: [
      ...(indexable.value ? [{ rel: "canonical", href: canonical.value, key: "canonical" }] : []),
      ...alternates.value,
    ],
    script: jsonLd.value
      ? [{ type: "application/ld+json", key: "page-jsonld", innerHTML: jsonLd.value }]
      : [],
  }));

  return { canonical, fullTitle, description };
};
