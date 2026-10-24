import { describe, expect, test } from "bun:test";
import { parse as parseVue } from "vue/compiler-sfc";
import { parse as parseGraphql } from "graphql";

const routeFiles = [
  "app/pages/news/[id].vue",
  "app/pages/projects/[id].vue",
];

const scriptOf = async (file: string) => {
  const { descriptor, errors } = parseVue(await Bun.file(file).text());
  expect(errors).toHaveLength(0);
  return descriptor.scriptSetup?.content || "";
};

describe("dynamic route metadata", () => {
  test("news uses exactly one SSR content request shared with its hero and emits article metadata", async () => {
    const page = await scriptOf(routeFiles[0]!);
    const hero = await scriptOf("app/components/news/NewsHero.vue");
    const template = (await Bun.file(routeFiles[0]!).text());
    expect((page.match(/await useCmsQuery</g) || [])).toHaveLength(1);
    expect(hero).not.toContain("useFetch");
    expect(hero).not.toContain("$fetch");
    expect(template).toContain('<NewsHero :news="news" />');
    expect(page).toContain('"@type": "BlogPosting"');
    expect(page).toContain("alternates: articleLocales");
    expect(await Bun.file("app/components/news/NewsHero.vue").text()).toContain("<time v-if=\"published\" :datetime=\"published.iso\">");
    expect(page).toContain("datePublished");
    expect(page).toContain("dateModified");
    expect(page).toContain("useCmsMedia()");
    expect(page).toContain('type: "article"');
    expect(page).toContain("!!data.value?.data?.newsPage");
    expect(page).toContain("statusCode: 404");
    expect(page).toContain("statusCode: 502");
    expect(parseGraphql(page.match(/const query = `([\s\S]*?)`;/)?.[1] || "").definitions).toHaveLength(1);
  });

  test("projects share computed CMS images with SEO, protect previews and distinguish 404 from CMS outage", async () => {
    for (const file of routeFiles.slice(1)) {
      const script = await scriptOf(file);
      expect(script).toContain("usePageSeo({");
      expect(script).toContain("image: seoImage");
      expect(script).toContain("useCmsMedia()");
      expect(script).toContain('"preview" in route.query');
      expect(script).toContain('"draft" in route.query');
      expect(script).toMatch(/!!(?:data|gqlData)\.value\?\.data\?\.projectsPage/);
      expect(script).toContain("statusCode: 404");
      expect(script).toContain("statusCode: 502");
      expect(parseGraphql(script.match(/const query = `([\s\S]*?)`;/)?.[1] || "").definitions).toHaveLength(1);
    }
  });

  test("service pages: copy for every service in every language, one slug each, crawlable links", async () => {
    const { SERVICE_PAGES } = await import("../app/utils/servicePages");
    const { SITE_LOCALES } = await import("../app/utils/locales");
    const slugs = new Map<string, string>();
    for (const page of SERVICE_PAGES) {
      for (const locale of SITE_LOCALES) {
        const slug = page.slugs[locale];
        expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        const owner = slugs.get(slug);
        // A slug may repeat across languages only for the same service.
        if (owner) expect(owner).toBe(page.key);
        slugs.set(slug, page.key);
        const copy = await Bun.file(`app/content/services/${page.key}.${locale}.json`).json();
        expect(copy.h1.length).toBeGreaterThan(5);
        expect(copy.title.length).toBeLessThanOrEqual(60);
        expect(copy.description.length).toBeGreaterThanOrEqual(110);
        expect(copy.description.length).toBeLessThanOrEqual(165);
        expect(copy.faq.items.length).toBeGreaterThanOrEqual(3);
        expect(copy.process.steps.length).toBeGreaterThanOrEqual(3);
      }
    }
    const page = await Bun.file("app/pages/services/[slug].vue").text();
    expect(page).toContain("useSetI18nParams");
    expect(page).toContain('"@type": "Service"');
    expect(page).toContain("<NuxtLink");
  });
});
