import { describe, expect, test } from "bun:test";
import type { ViewBlock, ViewPicture } from "../app/utils/caseStories";
import { buildCmsStory, contrastOnWhite, darkenTo, storyColours, storyRows } from "../app/utils/cmsStory";

const media = (url?: string | null) => (url ? `https://cms.test${url}` : "");
const copy = { untitled: "OneBranding project", palette: "Colour palette", before: "Old logo", after: "New logo" };
const kinds = (blocks: ViewBlock[]) => blocks.map((block) => block.type);
const block = <T extends ViewBlock["type"]>(blocks: ViewBlock[], type: T) => blocks.find((item) => item.type === type) as Extract<ViewBlock, { type: T }>;
const pictureOf = (id: string, ratio: number): ViewPicture => ({ id, src: `/${id}.webp`, alt: id, ratio });
const file = (name: string, width = 1600, height = 1000) => ({ url: `/${name}.webp`, width, height });

describe("a CMS case study as a case story", () => {
  const entry = {
    tags: [{ label: "Branding" }, { label: "Logo" }],
    category: { categoryName: "Branding" },
    projectColor: "#c8102e",
    section1: {
      projectTitle: "Raviosta: logo and identity for an Italian restaurant",
      text: "First paragraph, with **a marked phrase**.\n\nSecond   paragraph.",
      images: [file("cover", 1710, 962), file("wide"), file("upright", 800, 1000), file("second-upright", 800, 1000)],
    },
    section2: { title: "Monogram", text: "The letter R.", image: file("cover", 1710, 962) },
    section3: { title: "Colour palette", text: "Tomato red.", colorCard: [{ HexColorCode: "#C22A2D" }, { HexColorCode: "fff" }, { HexColorCode: "#c22a2d" }, { HexColorCode: "nope" }] },
  };
  const story = buildCmsStory(entry, media, copy);

  test("an entry with only the old fields: heading, text, pictures, its story, palette; no site copy in place of the rest", () => {
    expect(kinds(story.blocks)).toEqual(["title", "text", "pictures", "heading", "palette"]);
    expect(story.title).toBe("Raviosta: logo and identity for an Italian restaurant");
  });

  test("the whole template, in the Art-Anor page's order", () => {
    const full = buildCmsStory({
      ...entry,
      projectLogo: file("logo", 900, 300),
      story: {
        logoBefore: file("before", 900, 1100),
        logoAfter: file("after", 900, 1100),
        logoText: "We kept the crown.",
        gallery: [file("g1"), file("g2", 800, 1000), { ...file("g3"), alternativeText: " A bag " }],
        mark: file("mark", 1000, 1200),
        statement: "Twelve seeds.\nOne **signature**.",
        moreGallery: [file("m1"), file("cover", 1710, 962)],
        detailsTitle: "Recognition is in the details.",
        detailsText: "A clear system.",
        guidePages: [file("p1", 1270, 896), file("p2", 1269, 897)],
        closing: "An identity shaped with care.",
      },
    }, media, copy);
    expect(kinds(full.blocks)).toEqual(["logo", "text", "pictures", "compare", "heading", "pictures", "statement", "pictures", "heading", "palette", "grid", "closing"]);
    expect(block(full.blocks, "compare")).toMatchObject({
      from: { src: "https://cms.test/before.webp", label: "Old logo", alt: "Raviosta: Old logo", width: 900, height: 1100 },
      to: { src: "https://cms.test/after.webp", label: "New logo" },
      text: "We kept the crown.",
    });
    expect(block(full.blocks, "statement")).toMatchObject({ mark: { src: "https://cms.test/mark.webp", alt: "Raviosta" }, text: "Twelve seeds.\nOne signature." });
    const galleries = full.blocks.filter((item) => item.type === "pictures");
    expect(galleries[1]!.rows.flat().map((picture) => picture.alt)).toEqual(["Raviosta", "Raviosta", "A bag"]);
    // The cover again in moreGallery: shown once, where it came first.
    expect(galleries[2]!.rows.flat().map((picture) => picture.src)).toEqual(["https://cms.test/m1.webp"]);
    expect(full.blocks[8]).toEqual({ type: "heading", title: "Recognition is in the details.", text: "A clear system." });
    const grid = block(full.blocks, "grid");
    expect(grid.pictures.map((page) => page.alt)).toEqual(["Raviosta — 1", "Raviosta — 2"]);
    expect(new Set(grid.pictures.map((page) => page.ratio)).size).toBe(1);
    expect(block(full.blocks, "closing").text).toBe("An identity shaped with care.");
    // Every picture has an id of its own (the gallery steps through them).
    const ids = full.blocks.flatMap((item) => (item.type === "pictures" ? item.rows.flat() : item.type === "grid" ? item.pictures : [])).map((picture) => picture.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("one logo is not a comparison: its paragraph stands alone", () => {
    const one = buildCmsStory({ ...entry, story: { logoAfter: file("after"), logoText: "The new mark." } }, media, copy);
    expect(kinds(one.blocks)).toEqual(["title", "text", "pictures", "text", "heading", "palette"]);
    expect(one.blocks[3]).toEqual({ type: "text", text: "The new mark." });
  });

  test("the lines and the heading an editor wrote in brandSystem stand in for the template's own", () => {
    const withSystem = { ...entry, brandSystem: { statement: "**One** mark.\r\n\r\nOne voice.", title: "The system", text: "A brandbook.", image: { url: "/system.webp", width: 800, height: 600, alternativeText: " Our system " } } };
    const own = buildCmsStory(withSystem, media, copy);
    expect(block(own.blocks, "statement")).toEqual({
      type: "statement",
      mark: { src: "https://cms.test/system.webp", alt: "Our system", width: 800, height: 600 },
      text: "One mark.\nOne voice.",
    });
    expect(own.blocks.filter((item) => item.type === "heading").map((item) => item.title)).toEqual(["Monogram", "The system"]);
    // The template's own lines win, without brandSystem's picture beside them.
    const both = buildCmsStory({ ...withSystem, story: { statement: "Twelve seeds.", detailsTitle: "Details" } }, media, copy);
    expect(block(both.blocks, "statement")).toEqual({ type: "statement", text: "Twelve seeds." });
    expect(both.blocks.filter((item) => item.type === "heading").map((item) => item.title)).toEqual(["Monogram", "Details"]);
  });

  test("the heading in type is the name over what was made", () => {
    expect(block(story.blocks, "title")).toEqual({ type: "title", name: "Raviosta", label: "logo and identity for an Italian restaurant" });
    // A title that is the name alone leaves "what was made" to the tags and the category, each once.
    const plain = buildCmsStory({ ...entry, section1: { projectTitle: "Raviosta" } }, media, copy);
    expect(block(plain.blocks, "title")).toEqual({ type: "title", name: "Raviosta", label: "Branding · Logo" });
    expect(block(buildCmsStory({}, media, copy).blocks, "title")).toEqual({ type: "title", name: "OneBranding project", label: "" });
  });

  test("a logo, where the entry has one, is the heading", () => {
    const withLogo = buildCmsStory({ ...entry, projectLogo: { url: "/logo.svg", width: 900, height: 300 } }, media, copy);
    expect(withLogo.blocks[0]).toEqual({ type: "logo", mark: { src: "https://cms.test/logo.svg", alt: "", width: 900, height: 300 } });
    expect(withLogo.title).toBe("Raviosta: logo and identity for an Italian restaurant");
  });

  test("texts keep their paragraphs and lose the editor's marks", () => {
    expect(block(story.blocks, "text").text).toBe("First paragraph, with a marked phrase.\n\nSecond paragraph.");
  });

  test("the cover has a row of its own; the other pictures follow in rows, each upload once", () => {
    const pictures = block(story.blocks, "pictures");
    expect(pictures.rows.map((row) => row.map((picture) => picture.src.split("/").pop()))).toEqual([["cover.webp"], ["wide.webp", "upright.webp", "second-upright.webp"]]);
    expect(pictures.rows[0]![0]).toMatchObject({ alt: "Raviosta: logo and identity for an Italian restaurant", width: 1710 });
    expect(pictures.rows[0]![0]!.ratio).toBeCloseTo(1710 / 962);
  });

  test("the palette's colours are normalised, each once", () => {
    expect(block(story.blocks, "palette")).toEqual({ type: "palette", label: "Colour palette", text: "Tomato red.", colors: ["#C22A2D", "#FFFFFF"] });
  });

  test("an empty entry is its heading alone", () => {
    expect(kinds(buildCmsStory({}, media, copy).blocks)).toEqual(["title"]);
  });
});

describe("a story's colours", () => {
  test("the project's own colour is the accent; small text gets it dark enough to read", () => {
    expect(storyColours("#c8102e", ["#000000"])).toEqual({ accent: "#C8102E", ink: "#C8102E" });
    const gold = storyColours("#B8860B", []);
    expect(gold.accent).toBe("#B8860B");
    expect(contrastOnWhite(gold.accent)).toBeGreaterThanOrEqual(3);
    expect(gold.ink).not.toBe("#B8860B");
    expect(contrastOnWhite(gold.ink)).toBeGreaterThanOrEqual(4.5);
  });

  test("without one, the most vivid palette colour that reads on white; else near-black", () => {
    expect(storyColours(null, ["#060100", "#270601", "#593525", "#C96A1B", "#FFFFFF"]).accent).toBe("#C96A1B");
    // The yellow is the most vivid, but too light for white: the gold is taken.
    expect(storyColours("", ["#080808", "#B8860B", "#F8E886"]).accent).toBe("#B8860B");
    expect(storyColours(undefined, ["#FFFFFF", "#F8E886"])).toEqual({ accent: "#111111", ink: "#111111" });
  });

  test("a colour too light for the page is darkened, keeping its hue", () => {
    expect(contrastOnWhite("#FFFFFF")).toBeCloseTo(1);
    expect(contrastOnWhite("#000000")).toBeCloseTo(21);
    const yellow = darkenTo("#F8E886", 3);
    expect(contrastOnWhite(yellow)).toBeGreaterThanOrEqual(3);
    const [r, g, b] = [1, 3, 5].map((at) => parseInt(yellow.slice(at, at + 2), 16));
    expect(r! > g! && g! > b!).toBe(true);
    expect(darkenTo("#00552A", 4.5)).toBe("#00552A");
  });
});

describe("a story's rows of pictures", () => {
  test("a row is full at about two wide pictures or three upright ones", () => {
    const wide = (id: string) => pictureOf(id, 1.6);
    const upright = (id: string) => pictureOf(id, 0.8);
    const ids = (rows: ViewPicture[][]) => rows.map((row) => row.map((picture) => picture.id).join("+"));
    expect(ids(storyRows([wide("a"), wide("b"), upright("c"), upright("d"), upright("e")]))).toEqual(["a+b", "c+d+e"]);
    expect(ids(storyRows([wide("a"), upright("b"), wide("c")]))).toEqual(["a+b", "c"]);
    expect(storyRows([])).toEqual([]);
  });

  test("an upright picture left alone joins the row before it; a wide one stands alone", () => {
    const ids = (rows: ViewPicture[][]) => rows.map((row) => row.map((picture) => picture.id).join("+"));
    expect(ids(storyRows([pictureOf("a", 1.6), pictureOf("b", 1.6), pictureOf("c", 0.8)]))).toEqual(["a+b+c"]);
    expect(ids(storyRows([pictureOf("a", 0.8)]))).toEqual(["a"]);
  });
});
