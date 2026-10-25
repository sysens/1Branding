import { describe, expect, test } from "bun:test";
import { withCmsSlug, type FetchSlugs } from "../server/utils/cmsSlugs";

const PROJECT = "whppp7vemlh9ra7ufsf3z0ky";
const ARTICLE = "zztkud74sbscajz3k646rykf";

describe("CMS slugs for old addresses", () => {
  // Runs first: a failed read is not kept, so the next test reads again.
  test("keeps the id address when the CMS does not answer", async () => {
    const failing: FetchSlugs = async () => { throw new Error("offline"); };
    expect(await withCmsSlug(`/projects/${PROJECT}`, "https://cms.test/graphql", failing)).toBe(`/projects/${PROJECT}`);
  });

  test("replaces a document id with its slug, in every language", async () => {
    let reads = 0;
    const fetchSlugs: FetchSlugs = async () => {
      reads++;
      return { data: {
        projectsPages_connection: { nodes: [{ documentId: PROJECT, slug: "raviosta-restaurant-identity" }, { documentId: "a".repeat(24), slug: null }] },
        newsPages_connection: { nodes: [{ documentId: ARTICLE, slug: "pepsi-brand-identity-2025" }] },
      } };
    };
    expect(await withCmsSlug(`/projects/${PROJECT}`, "https://cms.test/graphql", fetchSlugs)).toBe("/projects/raviosta-restaurant-identity");
    expect(await withCmsSlug(`/ru/news/${ARTICLE}`, "https://cms.test/graphql", fetchSlugs)).toBe("/ru/news/pepsi-brand-identity-2025");
    // No slug, or the id of the other section: the id address stays.
    expect(await withCmsSlug(`/projects/${"a".repeat(24)}`, "https://cms.test/graphql", fetchSlugs)).toBe(`/projects/${"a".repeat(24)}`);
    expect(await withCmsSlug(`/news/${PROJECT}`, "https://cms.test/graphql", fetchSlugs)).toBe(`/news/${PROJECT}`);
    // Other paths never ask the CMS.
    expect(await withCmsSlug("/projects/abc", "https://cms.test/graphql", fetchSlugs)).toBe("/projects/abc");
    expect(await withCmsSlug("/about", "https://cms.test/graphql", fetchSlugs)).toBe("/about");
    expect(reads).toBe(1);
  });
});
