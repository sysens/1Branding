import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("page descriptions", () => {
  test("no site-wide meta description in app.head (it replaced each page's after hydration)", () => {
    const config = read("nuxt.config.ts");
    const head = config.slice(config.indexOf("head: {"), config.indexOf("link: ["));
    expect(head).not.toMatch(/name:\s*"description"/);
  });

  test("the browser keeps each page's own description", () => {
    const seo = read("app/composables/usePageSeo.ts");
    const client = seo.slice(seo.indexOf("if (import.meta.client)"), seo.indexOf("return;", seo.indexOf("if (import.meta.client)")));
    expect(client).toContain("useSeoMeta({ description:");
  });

  test("FAQ answers stay in the server HTML", () => {
    const faq = read("app/components/home/FaqAccordion.vue");
    expect(faq).toContain('v-show="open === index"');
    expect(faq).not.toContain('v-if="open === index"');
  });
});
