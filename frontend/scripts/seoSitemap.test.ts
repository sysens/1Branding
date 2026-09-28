import { describe, expect, test } from "bun:test";
import { buildSitemap, siteOrigin } from "../server/utils/seoSitemap";

const capture = (xml: string) => Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);

describe("CMS sitemap", () => {
  test("uses only configured HTTP(S) origin", () => {
    expect(siteOrigin("https://example.test/ ")).toBe("https://example.test");
    expect(() => siteOrigin("")).toThrow();
    expect(() => siteOrigin("https://example.test/subpath")).toThrow();
    expect(() => siteOrigin("javascript:alert(1)")).toThrow();
  });

  test("paginates each locale, de-duplicates IDs and links only real translations", async () => {
    const requests: Array<{ locale: string; page: number; pageSize: number; query: string }> = [];
    const xml = await buildSitemap("https://example.test", "https://cms.test/graphql", async (_url, options) => {
      const { page, pageSize, locale } = options.body.variables;
      requests.push({ locale, page, pageSize, query: options.body.query });
      const nodes = (collection: string) => {
        if (collection !== "news") return [{ documentId: collection, updatedAt: "2026-06-02T00:00:00.000Z" }];
        if (page === 2) return locale === "ru" ? [{ documentId: "ru-only" }] : [{ documentId: "en-only" }];
        return [{ documentId: "shared & one", updatedAt: "2026-06-01T00:00:00.000Z" }];
      };
      const connection = (collection: string) => ({ nodes: nodes(collection), pageInfo: { pageCount: collection === "news" ? 2 : 1 } });
      return { data: {
        newsPages_connection: connection("news"),
        projectsPages_connection: connection("project"),
        categories_connection: connection("category"),
      } };
    });
    expect(requests).toHaveLength(4);
    expect(requests.map(({ locale, page }) => `${locale}:${page}`)).toEqual(["ru:1", "ru:2", "en:1", "en:2"]);
    expect(requests.every(({ pageSize, query }) => pageSize === 100 && query.includes("updatedAt") && query.includes("pageCount"))).toBe(true);
    const urls = capture(xml);
    expect(urls).toContain("https://example.test/");
    expect(urls).toContain("https://example.test/en");
    expect(urls).toContain("https://example.test/NewsSlug/shared%20%26%20one");
    expect(urls).toContain("https://example.test/en/NewsSlug/shared%20%26%20one");
    expect(urls).toContain("https://example.test/NewsSlug/ru-only");
    expect(urls).not.toContain("https://example.test/en/NewsSlug/ru-only");
    expect(urls).toContain("https://example.test/en/NewsSlug/en-only");
    expect(urls).not.toContain("https://example.test/NewsSlug/en-only");
    expect(urls).toContain("https://example.test/ProjectSlug/project");
    expect(urls).toContain("https://example.test/ProductSlug/category");
    expect(urls.length).toBe(new Set(urls).size);
    expect(xml).toContain('hreflang="ru"');
    expect(xml).toContain('hreflang="en"');
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).toContain("<lastmod>2026-06-02T00:00:00.000Z</lastmod>");
  });

  test("keeps lastmod on the matching locale and escapes XML special characters", async () => {
    const xml = await buildSitemap("https://example.test", "https://cms.test/graphql", async (_url, options) => {
      const locale = options.body.variables.locale;
      return { data: {
        newsPages_connection: { nodes: [{ documentId: '"article"', updatedAt: locale === "ru" ? "2026-01-01" : "2026-02-02" }], pageInfo: { pageCount: 1 } },
        projectsPages_connection: { nodes: [], pageInfo: { pageCount: 1 } },
        categories_connection: { nodes: [], pageInfo: { pageCount: 1 } },
      } };
    });
    expect(xml).toMatch(/<loc>https:\/\/example\.test\/NewsSlug\/%22article%22<\/loc><lastmod>2026-01-01T00:00:00\.000Z<\/lastmod>/);
    expect(xml).toMatch(/<loc>https:\/\/example\.test\/en\/NewsSlug\/%22article%22<\/loc><lastmod>2026-02-02T00:00:00\.000Z<\/lastmod>/);
    expect(xml).not.toContain('<loc>https://example.test/NewsSlug/"article"</loc>');
  });

  test("rejects incomplete CMS pages rather than publishing a partial sitemap", async () => {
    await expect(buildSitemap("https://example.test", "https://cms.test/graphql", async () => ({
      data: { newsPages_connection: { nodes: [], pageInfo: { pageCount: 1 } } },
    }))).rejects.toThrow("complete sitemap");
    await expect(buildSitemap("https://example.test", "https://cms.test/graphql", async () => ({
      errors: [{ message: "backend unavailable" }],
    }))).rejects.toThrow("complete sitemap");
    await expect(buildSitemap("https://example.test", "https://cms.test/graphql", async () => ({
      data: {
        newsPages_connection: { nodes: [], pageInfo: null },
        projectsPages_connection: { nodes: [], pageInfo: { pageCount: 1 } },
        categories_connection: { nodes: [], pageInfo: { pageCount: 1 } },
      },
    }))).rejects.toThrow("pagination");
  });
});
