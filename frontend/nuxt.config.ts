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

export default defineNuxtConfig({
  // Keep the generated project references identical in dev, prepare and build.
  buildDir: ".nuxt",
  modules: [
    "@nuxt/fonts",
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
      link: [
        { rel: "icon", type: "image/png", href: "/General/favicon.svg" },
        { rel: "apple-touch-icon", href: "/General/apple-touch-icon.png" },
      ],
    },
  },

  runtimeConfig: {
    public: {
      graphqlUrl: process.env.NUXT_PUBLIC_GRAPHQL_URL,
    },
  },

  image: {
    provider: "ipx",
    domains: imageDomains,
    format: ["webp"],
  },

  routeRules: {
    "/": {
      isr: 300,
    },
    "/en": {
      isr: 300,
    },
    "/Costs": {
      isr: 300,
    },
    "/en/Costs": {
      isr: 300,
    },
    "/Projects": {
      isr: 300,
    },
    "/en/Projects": {
      isr: 300,
    },
    "/News": {
      isr: 300,
    },
    "/en/News": {
      isr: 300,
    },
    "/ProductSlug/**": {
      isr: 300,
    },
    "/en/ProductSlug/**": {
      isr: 300,
    },
    "/ProjectSlug/**": {
      isr: 300,
    },
    "/en/ProjectSlug/**": {
      isr: 300,
    },
    "/NewsSlug/**": {
      isr: 300,
    },
    "/en/NewsSlug/**": {
      isr: 300,
    },
    "/_ipx/**": {
      headers: longTermImageCacheHeaders,
    },
    "/home/threeLayerLocal/**": {
      headers: longTermImageCacheHeaders,
    },
  },

  nitro: {
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
      { code: "ru", name: "Русский", file: "ru.json" },
      { code: "en", name: "English", file: "en.json" },
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
