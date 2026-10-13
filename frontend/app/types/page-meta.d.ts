// Page meta read by layouts/default.vue.
declare module "#app" {
  interface PageMeta {
    /** false hides the site footer on this page. */
    footer?: boolean;
  }
}

export {};
