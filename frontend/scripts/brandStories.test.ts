import { describe, expect, test } from "bun:test";
import { closestScrollPanel } from "../app/utils/stickyScroll";

interface CmsSchema { attributes: Record<string, { type: string; component?: string }> }
const home = Bun.file("app/pages/index.vue");
const backend = "../backend/";

describe("brand stories", () => {
  test("active content follows the nearest panel, including unequal heights and reverse scrolling", () => {
    expect(closestScrollPanel([400, 1200, 2000], 400)).toBe(0);
    expect(closestScrollPanel([-400, 400, 1200], 400)).toBe(1);
    expect(closestScrollPanel([-1200, -400, 400], 400)).toBe(2);
    expect(closestScrollPanel([-250, 470, 1390], 400)).toBe(1);
    expect(closestScrollPanel([300, 1100, 1900], 400)).toBe(0);
    expect(closestScrollPanel([0, 800], 400)).toBe(0);
    expect(closestScrollPanel([], 400)).toBe(0);
  });
  test("stories, airways scene and the preserved robot footer follow awards", async () => {
    const source = await home.text();
    const tail = source.slice(source.indexOf("<AwardsSection"));
    expect(tail.indexOf("<BrandStoriesSection")).toBeGreaterThan(0);
    expect(tail.indexOf("<AirwaysSceneSection")).toBeGreaterThan(tail.indexOf("<BrandStoriesSection"));
    expect(tail.indexOf("<Footer")).toBeGreaterThan(tail.indexOf("<AirwaysSceneSection"));
    expect(await Bun.file("public/home/scene.jpg").exists()).toBe(true);
    expect(await Bun.file("app/components/home/AirwaysSceneSection.vue").text()).toContain('url("/home/scene.jpg")');
    for (const removed of ["GridSection", "EarthDives", "ProjectTabletShowcase", "ThreeLayerSlug", "RowShorteners"]) expect(source).not.toContain(removed);
    expect(source).toContain("<WorldSection");
    expect(source).toContain("<FirstGlanceSections");
    expect(source).toContain(':landing-page="landingPage" :social-media="footerSocialMedia"');
  });
  test("landing request no longer fetches removed sections or shared guarantee content", async () => {
    const query = await Bun.file("app/composables/useLandingPayload.ts").text();
    for (const field of ["section7", "section11", "oneGuarantee"]) expect(query).not.toContain(field);
    for (const field of ["section2", "section3", "section10", "splineRobot", "footer", "seo"]) expect(query).toContain(field);
  });
  test("Strapi removes the retired admin/API fields without deleting shared APIs", async () => {
    const schema = await Bun.file(backend + "src/api/landing-page/content-types/landing-page/schema.json").json() as CmsSchema;
    expect(schema.attributes.section7).toBeUndefined();
    expect(schema.attributes.section11).toBeUndefined();
    expect(schema.attributes.splineRobot?.component).toBe("landing-page.spline-robot");
    for (const file of ["faq", "answer-question", "what-we-do"]) expect(await Bun.file(backend + "src/components/landing-page/" + file + ".json").exists()).toBe(false);
    expect(await Bun.file(backend + "src/api/one-guarantee/routes/one-guarantee.ts").exists()).toBe(true);
    expect(await Bun.file(backend + "src/api/footer/routes/footer.ts").exists()).toBe(true);
    const types = await Bun.file(backend + "types/generated/components.d.ts").text();
    for (const name of ["LandingPageFaq", "LandingPageAnswerQuestion", "LandingPageWhatWeDo"]) expect(types).not.toContain(name);
  });
  test("the Apex logo is a self-contained vector and placeholder artwork exists locally", async () => {
    const svg = await Bun.file("public/home/stories/apex-pizza.svg").text();
    expect(svg).toContain('viewBox="0 0 375 185"');
    expect(svg).toContain("<path");
    expect(svg).not.toMatch(/<script|<image|<foreignObject|onload=/i);
    expect(await Bun.file("public/logoss/perfectCandy2.webp").exists()).toBe(true);
    expect(await Bun.file("public/logoss/GreenGo.webp").exists()).toBe(true);
  });
});
