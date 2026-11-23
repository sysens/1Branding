// Project sites on their own subdomains (ertex.onebrandingworld.com, ...).
// One app serves them all and picks the site by the request's host: see
// shared/sites.ts and app/router.options.ts. The main site is ../frontend.

// Every site here is self-contained: its scripts, styles, images and fonts are
// served from this app's own origin.
const contentSecurityPolicy = [
  "default-src 'self'",
  // Nuxt writes its payload and config as inline scripts.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self' data: blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "content-security-policy": contentSecurityPolicy,
  "x-frame-options": "SAMEORIGIN",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
};

export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@nuxtjs/tailwindcss"],

  // The Tailwind layers, once for the whole app; each site adds its own small
  // stylesheet (fonts, focus ring) from its page.
  tailwindcss: {
    cssPath: ["~/assets/css/tailwind.css", { injectPosition: "first" }],
  },
  // The Tailwind module also adds tailwindcss/nesting, which Nuxt 4.6 cannot
  // load from Tailwind 3 (a build warning); no stylesheet here nests rules.
  postcss: {
    plugins: { "tailwindcss/nesting": false },
  },

  app: {
    head: {
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "format-detection", content: "telephone=no" },
      ],
    },
  },

  routeRules: {
    "/**": { headers: securityHeaders },
  },

  nitro: {
    compressPublicAssets: { gzip: true, brotli: true },
  },

  devtools: { enabled: false },

  sourcemap: { client: false, server: false },

  compatibilityDate: "2024-04-03",
});
