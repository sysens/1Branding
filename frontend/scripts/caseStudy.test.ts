import { describe, expect, test } from "bun:test";
import { buildCaseSections, caseColor, caseHeading, casePlainText, caseStatementLines, caseTextParts } from "../app/utils/caseStudy";

const media = (url?: string | null) => (url ? `https://cdn.test/${url}` : "");

const COPY = {
  palette: "Palette",
  statement: {
    statement: "One brand.\nOne standard.\nZero guesswork.",
    title: "The system behind a consistent brand",
    text: "A brandbook is the working reference.",
    alt: "Logo, colour, type, imagery and voice",
    image: { src: "/case-study/brand-system.webp", width: 563, height: 446 },
  },
};

const STATEMENT_COPY = {
  type: "statement",
  id: "statement",
  image: { src: "/case-study/brand-system.webp", width: 563, height: 446, alt: "Logo, colour, type, imagery and voice" },
  lines: [
    [{ text: "One", strong: true }, { text: " brand." }],
    [{ text: "One", strong: true }, { text: " standard." }],
    [{ text: "Zero", strong: true }, { text: " guesswork." }],
  ],
  title: "The system behind a consistent brand",
  paragraphs: [[{ text: "A brandbook is the working reference." }]],
};

const ENTRY = {
  category: { categoryName: "Branding" },
  tags: [{ label: "Rebranding" }, { label: "branding" }, { label: "Packaging" }],
  section1: {
    projectTitle: "Brand: packaging for a fast-food chain",
    text: "Brand is a fast-food chain. Its packaging carries the founder's signature.",
    images: [{ url: "cover.webp", width: 1710, height: 962 }, { url: "box.webp" }],
  },
  section2: { title: "Signature", text: "The script runs across every box.", image: { url: "cover.webp" } },
  section3: { title: "Colour palette", text: "Red and white.", colorCard: [{ HexColorCode: "#E4002B" }, { HexColorCode: "fff" }, { HexColorCode: "nope" }] },
};

describe("case study heading", () => {
  test("two services: the grey line and the green one, each named once", () => {
    expect(caseHeading(ENTRY)).toEqual({ title: "Rebranding", accent: "branding" });
  });

  test("one service is the green line alone; none falls back to the project's name", () => {
    expect(caseHeading({ tags: [{ label: "Logo" }] })).toEqual({ title: "", accent: "Logo" });
    expect(caseHeading({ section1: { projectTitle: "RUSH: logo for a café" } })).toEqual({ title: "", accent: "RUSH" });
  });
});

describe("case study text", () => {
  test("the first sentence is the strong phrase", () => {
    expect(caseTextParts("Raviosta is a restaurant. Its logo joins R and a fork.")).toEqual([
      { text: "Raviosta is a restaurant.", strong: true },
      { text: " Its logo joins R and a fork." },
    ]);
  });

  test("closing quotes and brackets stay with the sentence", () => {
    expect(caseTextParts("A brand («a taste tested by years»). More.")[0]).toEqual({ text: "A brand («a taste tested by years»).", strong: true });
  });

  test("an editor's **marks** choose the phrase instead", () => {
    expect(caseTextParts("We create brands with a **distinct identity.** Our brandbooks help.")).toEqual([
      { text: "We create brands with a " },
      { text: "distinct identity.", strong: true },
      { text: " Our brandbooks help." },
    ]);
    expect(casePlainText("A **distinct** identity")).toBe("A distinct identity");
  });

  test("a single sentence stays plain; a lead gets its full stop", () => {
    expect(caseTextParts("Only one sentence here.")).toEqual([{ text: "Only one sentence here." }]);
    expect(caseTextParts("The script runs.", "Signature")).toEqual([{ text: "Signature.", strong: true }, { text: " The script runs." }]);
  });
});

describe("case study sections", () => {
  test("palette colours are normalised, with readable ink", () => {
    expect(caseColor("#e4002b")).toEqual({ hex: "#E4002B", ink: "light" });
    expect(caseColor("fff")).toEqual({ hex: "#FFFFFF", ink: "dark" });
    expect(caseColor("nope")).toBeNull();
  });

  test("the page is heading, text, cover, statement, story, pictures and palette, each picture once", () => {
    const sections = buildCaseSections(ENTRY, media, COPY);
    expect(sections.map((section) => section.id)).toEqual(["hero", "intro", "cover", "statement", "story", "picture-2", "palette-text", "palette"]);
    expect(sections[0]).toEqual({ type: "hero", id: "hero", name: "Brand: packaging for a fast-food chain", title: "Rebranding", accent: "branding" });
    expect(sections[2]).toEqual({ type: "picture", id: "cover", src: "https://cdn.test/cover.webp", alt: "Brand: packaging for a fast-food chain", width: 1710, height: 962 });
    expect(sections.at(-1)).toEqual({
      type: "palette",
      id: "palette",
      label: "Colour palette",
      colors: [{ hex: "#E4002B", ink: "light" }, { hex: "#FFFFFF", ink: "dark" }],
    });
  });

  test("an empty entry is its heading and the statement in the site's own copy", () => {
    expect(buildCaseSections({}, media, COPY)).toEqual([{ type: "hero", id: "hero", name: "", title: "", accent: "" }, STATEMENT_COPY]);
  });

  test("the statement block takes the editor's copy and picture, field by field", () => {
    const [, statement] = buildCaseSections(
      { brandSystem: { statement: "Built **to last**.\n\nOne voice.", title: "  ", text: "First.\n\nSecond **part**.", image: { url: "system.webp", width: 900, height: 800, alternativeText: "" } } },
      media,
      COPY
    );
    expect(statement).toEqual({
      type: "statement",
      id: "statement",
      image: { src: "https://cdn.test/system.webp", alt: "Logo, colour, type, imagery and voice", width: 900, height: 800 },
      lines: [
        [{ text: "Built " }, { text: "to last", strong: true }, { text: "." }],
        [{ text: "One", strong: true }, { text: " voice." }],
      ],
      title: "The system behind a consistent brand",
      paragraphs: [[{ text: "First." }], [{ text: "Second " }, { text: "part", strong: true }, { text: "." }]],
    });
  });
});

describe("case study statement", () => {
  test("each line's first word is green, without the punctuation after it", () => {
    expect(caseStatementLines("Zero.\r\n  One   standard. ")).toEqual([
      [{ text: "Zero", strong: true }, { text: "." }],
      [{ text: "One", strong: true }, { text: " standard." }],
    ]);
    expect(caseStatementLines("— a dash first")).toEqual([[{ text: "— a dash first" }]]);
    expect(caseStatementLines(null)).toEqual([]);
  });
});
