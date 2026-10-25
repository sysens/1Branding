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
// Content Security Policy in report-only mode: the browser reports what it
// would block (in the console) without blocking anything, so it can be
// tightened safely before it is enforced. It lists the hosts the site uses:
// the CMS and its R2 media, Spline scenes, Cloudflare's analytics beacon, and
// GA4 / Yandex Metrika for when their IDs are set (plugins/analytics.client.ts).
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com https://www.googletagmanager.com https://mc.yandex.ru https://prod.spline.design",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://onebrandingbackend.up.railway.app https://*.r2.dev https://prod.spline.design https://cloudflareinsights.com https://*.google-analytics.com https://www.googletagmanager.com https://mc.yandex.ru https://mc.yandex.com",
  "media-src 'self' blob: https://*.r2.dev",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");
const securityHeaders = {
  // Every subdomain (www included) is served over HTTPS by Cloudflare.
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "content-security-policy-report-only": contentSecurityPolicy,
  "x-frame-options": "SAMEORIGIN",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-opener-policy": "same-origin",
  // The site needs none of the device features; nothing on it (or embedded in it) may ask.
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
};
const cachedPages = ["/", "/about", "/contact", "/pricing", "/one-guarantee", "/projects", "/news", "/services", "/privacy"];
// Every language but the default one lives under its own prefix.
const localePrefixes = ["", "/ru", "/uz"];
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
        // No site-wide description here: every route sets its own in its
        // language (usePageSeo). A Russian one here replaced the page's in the
        // browser after hydration, and Google, which renders pages, showed it
        // under the English home page's title.
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
        // Faces drawn above the fold (~40 KB each): body copy, and the bold
        // display face of the home slogan, the page's largest paint (LCP).
        { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/v2/SF-Pro-Text-Regular.woff2", crossorigin: "" },
        { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/v2/SF-Pro-Display-Bold.woff2", crossorigin: "" },
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
      // _SAME_AS as a comma-separated list of profile URLs, e.g. the Google
      // Business Profile, 2GIS and Yandex Maps pages once they exist).
      orgPhone: "+998935608000",
      orgEmail: "",
      orgSameAs: "",
      // Analytics, off until an ID is set: NUXT_PUBLIC_GA4_ID ("G-...") and
      // NUXT_PUBLIC_YANDEX_METRIKA_ID (digits). See plugins/analytics.client.ts.
      ga4Id: "",
      yandexMetrikaId: "",
      // Ownership checks: NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      // NUXT_PUBLIC_YANDEX_VERIFICATION, NUXT_PUBLIC_BING_SITE_VERIFICATION.
      googleSiteVerification: "",
      yandexVerification: "",
      bingSiteVerification: "",
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
    // English is the default language and lives at "/"; Russian is under "/ru"
    // and Uzbek under "/uz". The English pages used to be under "/en": those
    // links get one 301 to the final URL in server/middleware/legacy-urls.ts.
    ...Object.fromEntries(localePrefixes.flatMap((prefix) => [
      ...cachedPages.map((path) => [path === "/" ? prefix || "/" : `${prefix}${path}`, pageCache]),
      ...["/services/**", "/projects/**", "/news/**"].map((path) => [`${prefix}${path}`, pageCache]),
    ])),
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
      { code: "en", language: "en", name: "English", file: "en.json" },
      { code: "ru", language: "ru", name: "Русский", file: "ru.json" },
      { code: "uz", language: "uz", name: "Oʻzbekcha", file: "uz.json" },
    ],
    defaultLocale: "en",
    strategy: "prefix_except_default",

    // No Accept-Language redirect: "/" always serves English, "/ru" Russian
    // and "/uz" Uzbek.
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
