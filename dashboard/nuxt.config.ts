// The OneBranding dashboard (admin.onebrandingworld.com): traffic, leads, the
// CRM funnel and money in one place. A single-page app behind a login; its
// Nitro server holds the API, receives the site's tracker and form through
// the main site's proxy (/api/ob/* there, /api/public/* here), the Telegram
// and Instagram webhooks, and runs the scheduled jobs (ads spend, CBU rates,
// reminders). See README.md.
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Nuxt writes its config into an inline script.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "shadcn-nuxt"],
  ssr: false,
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ["fflate", "vue-draggable-plus", "@unovis/vue", "@unovis/ts", "@internationalized/date", "vue-sonner"] },
  },
  shadcn: { prefix: "", componentDir: "./app/components/ui" },
  // Our components are named by their file (AppSidebar, KpiCard ...), not by folder.
  components: { dirs: [{ path: "~/components", pathPrefix: false, ignore: ["ui/**"] }] },

  app: {
    head: {
      htmlAttrs: { lang: "ru" },
      title: "OneBranding · Дашборд",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "robots", content: "noindex, nofollow" },
        { name: "theme-color", content: "#ffffff" },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },

  runtimeConfig: {
    // NUXT_PROXY_SECRET: shared with the main site's proxy (NUXT_DASHBOARD_PROXY_SECRET there).
    proxySecret: "",
    // NUXT_SETUP_TOKEN: lets the first owner be created at /setup; unset it afterwards.
    setupToken: "",
    public: {
      // NUXT_PUBLIC_APP_URL: this dashboard's own address (links in Telegram messages).
      appUrl: "https://admin.onebrandingworld.com",
      // NUXT_PUBLIC_SITE_URL: the public site, for the UTM link builder.
      siteUrl: "https://onebrandingworld.com",
    },
  },

  routeRules: {
    "/**": { headers: { "content-security-policy": contentSecurityPolicy } },
  },

  nitro: {
    experimental: { tasks: true },
    // One tick a minute decides what is due (server/tasks/ob/tick.ts).
    scheduledTasks: { "* * * * *": ["ob:tick"] },
    serverAssets: [{ baseName: "migrations", dir: fileURLToPath(new URL("./server/db/migrations", import.meta.url)) }],
    compressPublicAssets: { gzip: true, brotli: true },
  },

  typescript: { strict: true },
  devtools: { enabled: false },
  sourcemap: { client: false, server: false },
  compatibilityDate: "2024-04-03",
});
