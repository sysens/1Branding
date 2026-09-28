import { describe, expect, test } from "bun:test";
import { parse as parseVue } from "@vue/compiler-sfc";
import { parse as parseGraphql } from "graphql";

const routeFiles = [
  "app/pages/NewsSlug/[id].vue",
  "app/pages/ProjectSlug/[id].vue",
  "app/pages/ProductSlug/[id].vue",
];

const scriptOf = async (file: string) => {
  const { descriptor, errors } = parseVue(await Bun.file(file).text());
  expect(errors).toHaveLength(0);
  return descriptor.scriptSetup?.content || "";
};

describe("dynamic route metadata", () => {
  test("news uses exactly one SSR content request shared with its hero and emits article metadata", async () => {
    const page = await scriptOf(routeFiles[0]!);
    const hero = await scriptOf("app/components/Newsslug/NewsHero.vue");
    const template = (await Bun.file(routeFiles[0]!).text());
    expect((page.match(/await useFetch</g) || [])).toHaveLength(1);
    expect(hero).not.toContain("useFetch");
    expect(hero).not.toContain("$fetch");
    expect(template).toContain('<NewsHero :news="news" />');
    expect(page).toContain('"@type": "NewsArticle"');
    expect(page).toContain("datePublished");
    expect(page).toContain("dateModified");
    expect(page).toContain("resolveStrapiMediaUrl");
    expect(page).toContain('type: "article"');
    expect(page).toContain("!!data.value?.data?.newsPage");
    expect(page).toContain("statusCode: 404");
    expect(page).toContain("statusCode: 502");
    expect(parseGraphql(page.match(/const query = `([\s\S]*?)`;/)?.[1] || "").definitions).toHaveLength(1);
  });

  test("project/category share computed CMS images with SEO, protect previews and distinguish 404 from CMS outage", async () => {
    for (const file of routeFiles.slice(1)) {
      const script = await scriptOf(file);
      expect(script).toContain("usePageSeo({");
      expect(script).toContain("image: seoImage");
      expect(script).toContain("resolveStrapiMediaUrl");
      expect(script).toContain('"preview" in route.query');
      expect(script).toContain('"draft" in route.query');
      expect(script).toMatch(/!!(?:data|gqlData)\.value\?\.data\?\.(?:projectsPage|category)/);
      expect(script).toContain("statusCode: 404");
      expect(script).toContain("statusCode: 502");
      expect(parseGraphql(script.match(/const query = `([\s\S]*?)`;/)?.[1] || "").definitions).toHaveLength(1);
    }
  });
});
