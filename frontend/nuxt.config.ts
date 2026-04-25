const frontendHost = process.env.NUXT_HOST || "127.0.0.1";
const frontendPort = Number(process.env.NUXT_PORT || "3000");

export default defineNuxtConfig({
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
      allowedHosts: "all",
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

    vueI18n: "./i18n.config.ts",
  },

  compatibilityDate: "2024-04-03",
})
