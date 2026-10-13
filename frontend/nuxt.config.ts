const frontendHost = process.env.NUXT_HOST || "127.0.0.1";
const frontendPort = Number(process.env.NUXT_PORT || "3000");
// Dev server only: ngrok tunnels (a free tunnel gets a new subdomain each run;
// a leading dot lets Vite accept every subdomain) plus NUXT_VITE_ALLOWED_HOSTS.
const viteAllowedHosts = [
  ".ngrok-free.app",
  ".ngrok-free.dev",
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
// /public files are cached for a year like hashed assets (a day was flagged by
// Lighthouse and made repeat visits re-download ~1 MB). Their names are not
// hashed, so a changed image must be saved under a NEW file name.
const publicAssetCacheHeaders = {
  "cache-control": "public, max-age=31536000",
};
const securityHeaders = {
  "strict-transport-security": "max-age=31536000",
  "x-frame-options": "SAMEORIGIN",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-opener-policy": "same-origin",
};
const cachedPages = ["/", "/about", "/contact", "/pricing", "/one-guarantee", "/projects", "/news"];
// Rendered pages are kept in the server's memory for 5 minutes and refreshed in
// the background after that (stale-while-revalidate), so most visitors get the
// HTML without a render or a CMS round trip. (`isr` only works on Vercel and
// Netlify; on this Node server it did nothing.) The cached render sees only the
// headers listed in `varies`: the host ones keep each domain's canonical URLs.
const pageCache = {
  cache: { swr: true, maxAge: 300, varies: ["host", "x-forwarded-host", "x-forwarded-proto"] },
};

export default defineNuxtConfig({
  // Keep the generated project references identical in dev, prepare and build.
  buildDir: ".nuxt",
  // @nuxt/fonts was removed: it inlined ~30 unused Poppins/Inter/Oswald @font-face
  // rules into every page, while `body * { font-family: inherit !important }`
  // (tailwind.css) means only the self-hosted SF Pro WOFF2 files are rendered.
  modules: [
    // Generates the ESLint flat config (eslint.config.mjs extends it); dev only.
    "@nuxt/eslint",
    "@nuxt/image",
    "@nuxtjs/i18n",
    "@nuxtjs/tailwindcss",
    "nuxt-marquee",
    // nuxt-swiper was removed: nothing uses Swiper, yet its client plugin loaded
    // and registered swiper/element (~185 KB of JS) on every page.
    "nuxt-keen-slider",
  ],

  css: ["~/assets/css/tailwind.css"],

  app: {
    head: {
      htmlAttrs: { lang: "en" },
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
        { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/v2/SF-Pro-Text-Regular.woff2", crossorigin: "" },
        { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/v2/SF-Pro-Display-Regular.woff2", crossorigin: "" },
      ],
    },
  },

  runtimeConfig: {
    // Server-only: the backend's GraphQL URL on Railway's private network
    // (NUXT_GRAPHQL_URL_INTERNAL). See server/plugins/internal-graphql.ts.
    graphqlUrlInternal: "",
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
      // IPX writes its own cache-control (60s by default for local files),
      // which overrode the /_ipx route rule. CMS uploads carry a content hash and
      // /public images follow the rename-on-change rule, so a year is safe.
      maxAge: 31536000,
      fs: { maxAge: 31536000 },
      http: { maxAge: 31536000 },
    },
  },

  routeRules: {
    "/**": { headers: securityHeaders },
    // English is the default language and lives at "/"; Russian is under "/ru".
    // The English pages used to be under "/en": those links (indexed, shared)
    // keep working through a permanent redirect.
    "/en": { redirect: { to: "/", statusCode: 301 } },
    "/en/**": { redirect: { to: "/**", statusCode: 301 } },
    ...Object.fromEntries(cachedPages.flatMap((path) => [
      [path, pageCache],
      [path === "/" ? "/ru" : `/ru${path}`, pageCache],
    ])),
    "/services/**": pageCache,
    "/ru/services/**": pageCache,
    "/projects/**": pageCache,
    "/ru/projects/**": pageCache,
    "/news/**": pageCache,
    "/ru/news/**": pageCache,
    "/_ipx/**": {
      headers: longTermImageCacheHeaders,
    },
    "/fonts/**": { headers: publicAssetCacheHeaders },
    "/home/**": { headers: publicAssetCacheHeaders },
    "/logoss/**": { headers: publicAssetCacheHeaders },
    "/General/**": { headers: publicAssetCacheHeaders },
    "/Contacts/**": { headers: publicAssetCacheHeaders },
    // One segment only ("/Costs/*"): "/Costs/**" would also match the /Costs page.
    "/Costs/*": { headers: publicAssetCacheHeaders },
    "/News/*": { headers: publicAssetCacheHeaders },
    "/OneGuarantee/**": { headers: publicAssetCacheHeaders },
    "/header/**": { headers: publicAssetCacheHeaders },
    "/footer/**": { headers: publicAssetCacheHeaders },
    "/globe/**": { headers: publicAssetCacheHeaders },
    // Build-time image copies carry their content hash in the name.
    "/opt/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
    "/home/threeLayerLocal/**": {
      headers: longTermImageCacheHeaders,
    },
  },

  nitro: {
    // Ship .br/.gz siblings of text assets (JS, CSS, SVG, JSON, .bin) for the static server.
    compressPublicAssets: { gzip: true, brotli: true },
    // The page cache (pageCache) lives in memory; an LRU bound keeps URLs with
    // random query strings from growing it without limit.
    storage: {
      cache: {
        driver: "lru-cache",
        max: 300,
      },
    },
    devStorage: {
      cache: {
        driver: "memory",
      },
    },
  },

  // Dev tools only in `nuxt dev`; never part of a production build.
  devtools: {
    enabled: process.env.NODE_ENV !== "production",
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
    defaultLocale: "en",
    strategy: "prefix_except_default",

    // No Accept-Language redirect: "/" always serves English and "/ru" Russian.
    // The redirect cost every English-language visitor (and Lighthouse/PageSpeed,
    // which browse as en-US) an extra round trip of ~1s on mobile, and Google
    // advises against locale redirects; hreflang and the switcher cover it.
    detectBrowserLanguage: false,

    vueI18n: "../i18n.config.ts",
  },

  hooks: {
    // No <link rel="prefetch"> for lazily imported chunks: the browser fetched
    // them (~150 KB: GSAP, 3D scenes, sliders) while the first screen was still
    // loading. They are requested when a section actually needs them.
    "build:manifest": (manifest) => {
      for (const resource of Object.values(manifest)) resource.prefetch = false;
    },
  },

  compatibilityDate: "2024-04-03",
})
