const frontendHost = process.env.NUXT_HOST || "127.0.0.1";
const frontendPort = Number(process.env.NUXT_PORT || "3000");
const viteAllowedHosts = [
  "tubercularly-oversevere-louie.ngrok-free.dev",
  ...(process.env.NUXT_VITE_ALLOWED_HOSTS || "")
    .split(",")
    .map((host) => host.trim())
    .filter((host) => host.length > 0),
];
const defaultImageDomains = [
  "pub-156bce602951490e82e2418f1402419f.r2.dev",
];
const imageDomains = [
  ...new Set([
    ...defaultImageDomains,
    ...(process.env.NUXT_IMAGE_DOMAINS || "")
      .split(",")
      .map((host) => host.trim())
      .filter((host) => host.length > 0),
  ]),
];
const longTermImageCacheHeaders = {
  "cache-control": "public, max-age=31536000, immutable",
};
// /public files keep stable (unhashed) names: cache for a day and revalidate in
// the background for a week, so a replaced image shows up within a day.
const publicAssetCacheHeaders = {
  "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
};
const noIndexHeaders = { "x-robots-tag": "noindex, nofollow" };
// Leftover prototype routes: reachable but must never compete with the real pages.
const prototypeRoutes = ["/testPage", "/Newsslug", "/Projectslug", "/idProductSlugSecondVersion", "/ProjectSlug/Products"];
const isrPages = ["/", "/About", "/ContactPage", "/Costs", "/Oneguarantee", "/Projects", "/News"];

export default defineNuxtConfig({
  // Keep the generated project references identical in dev, prepare and build.
  buildDir: ".nuxt",
  // @nuxt/fonts was removed: it inlined ~30 unused Poppins/Inter/Oswald @font-face
  // rules into every page, while `body * { font-family: inherit !important }`
  // (tailwind.css) means only the self-hosted SF Pro WOFF2 files are rendered.
  modules: [
    "@nuxt/image",
    "@nuxtjs/i18n",
    "@nuxtjs/tailwindcss",
    "nuxt-marquee",
    "nuxt-swiper",
    "nuxt-keen-slider",
  ],

  css: ["~/assets/css/tailwind.css"],

  app: {
    head: {
      htmlAttrs: { lang: "ru" },
      title: "OneBranding",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        {
          name: "description",
          content:
            "OneBranding — брендинговое агентство полного цикла в Ташкенте: стратегия и нейминг, разработка логотипа, фирменный стиль, брендбук и дизайн упаковки.",
        },
        { name: "theme-color", content: "#000000" },
        { name: "format-detection", content: "telephone=no" },
        { name: "application-name", content: "OneBranding" },
        { name: "apple-mobile-web-app-title", content: "OneBranding" },
        { property: "og:site_name", content: "OneBranding" },
        { property: "og:type", content: "website" },
      ],
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
        { rel: "icon", type: "image/svg+xml", href: "/General/favicon.svg" },
        { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/General/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        // Body copy and headline faces used above the fold (~40 KB each).
        { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/SF-Pro-Text-Regular.woff2", crossorigin: "" },
        { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/SF-Pro-Display-Regular.woff2", crossorigin: "" },
      ],
    },
  },

  runtimeConfig: {
    public: {
      graphqlUrl: process.env.NUXT_PUBLIC_GRAPHQL_URL,
      // Production origin for canonical/hreflang/sitemap, e.g. https://onebranding.uz
      // (NUXT_PUBLIC_SITE_URL). Empty => the request's own origin is used.
      siteUrl: "",
      // Optional Organization JSON-LD contacts (NUXT_PUBLIC_ORG_PHONE / _EMAIL /
      // _SAME_AS as a comma-separated list of profile URLs).
      orgPhone: "",
      orgEmail: "",
      orgSameAs: "",
    },
  },

  image: {
    provider: "ipx",
    domains: imageDomains,
    format: ["webp"],
    ipx: {
      // CMS uploads carry a content hash; match the existing public image policy.
      http: { maxAge: 31536000 },
    },
  },

  routeRules: {
    ...Object.fromEntries(isrPages.flatMap((path) => [
      [path, { isr: 300 }],
      [path === "/" ? "/en" : `/en${path}`, { isr: 300 }],
    ])),
    "/ProductSlug/**": { isr: 300 },
    "/en/ProductSlug/**": { isr: 300 },
    "/ProjectSlug/**": { isr: 300 },
    "/en/ProjectSlug/**": { isr: 300 },
    "/NewsSlug/**": { isr: 300 },
    "/en/NewsSlug/**": { isr: 300 },
    ...Object.fromEntries(prototypeRoutes.flatMap((path) => [
      [path, { headers: noIndexHeaders, isr: false }],
      [`/en${path}`, { headers: noIndexHeaders, isr: false }],
    ])),
    "/_ipx/**": {
      headers: longTermImageCacheHeaders,
    },
    "/fonts/**": { headers: publicAssetCacheHeaders },
    "/home/**": { headers: publicAssetCacheHeaders },
    "/logoss/**": { headers: publicAssetCacheHeaders },
    "/General/**": { headers: publicAssetCacheHeaders },
    "/Contacts/**": { headers: publicAssetCacheHeaders },
    "/OneGuarantee/**": { headers: publicAssetCacheHeaders },
    "/header/**": { headers: publicAssetCacheHeaders },
    "/footer/**": { headers: publicAssetCacheHeaders },
    "/globe/**": { headers: publicAssetCacheHeaders },
    "/home/threeLayerLocal/**": {
      headers: longTermImageCacheHeaders,
    },
  },

  nitro: {
    // Ship .br/.gz siblings of text assets (JS, CSS, SVG, JSON, .bin) for the static server.
    compressPublicAssets: { gzip: true, brotli: true },
    devStorage: {
      cache: {
        driver: "memory",
      },
    },
  },

  devtools: {
    enabled: true,
  },

  sourcemap: {
    client: false,
    server: false,
  },

  devServer: {
    host: frontendHost,
    port: frontendPort,
  },

  vite: {
    build: {
      sourcemap: false,
      modulePreload: {
        polyfill: false,
      },
    },
    server: {
      allowedHosts: viteAllowedHosts,
    },
  },

  i18n: {
    langDir: "locales/",
    locales: [
      { code: "ru", language: "ru-RU", name: "Русский", file: "ru.json" },
      { code: "en", language: "en-US", name: "English", file: "en.json" },
    ],
    defaultLocale: "ru",
    strategy: "prefix_except_default",

    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
      alwaysRedirect: false,
      fallbackLocale: "ru",
    },

    vueI18n: "../i18n.config.ts",
  },

  compatibilityDate: "2024-04-03",
})
