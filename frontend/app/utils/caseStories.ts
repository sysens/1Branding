// A case story is a project page designed block by block (the Art-Anor page):
// the project's logo, texts, rows of photographs, the old logo beside the new
// one, the brand-guideline pages. Every project page is one: a story written
// here, in the site (Art-Anor), or a CMS case study laid out the same way
// from its few fields (utils/cmsStory.ts, pages/projects/[id].vue).
//
// A story written here is its blocks, top to bottom. Its pictures are in
// public/case-study/<slug>/ (photographs, with build-time copies:
// scripts/optimize-images.mjs) and .../marks/ (logos, served as they are).
// Its words are in i18n under caseStories.<key>: a block names the text it
// shows by its path there ("intro", "details.title"), a picture's id names its
// alt text (alt.<id>). resolveStory() puts the words in place; the result (a
// StoryView, at the end of this file) is what CaseStory.vue draws.
//
// A new story: a constant like ART_ANOR, its texts in the three locale files,
// its page (pages/projects/<slug>.vue, as art-anor.vue), and a line in
// CASE_STORIES, which puts it in the /projects grid and the sitemap.

export type StoryPicture = {
  /** The picture's name: its file, and its alt text's key (alt.<id>). */
  id: string;
  src: string;
  /** Width over height, as drawn (rows are laid out by it). */
  ratio: number;
};

/** A logo or a mark: drawn at its own proportions, never cropped. */
export type StoryMark = StoryPicture & { width: number; height: number };

export type StoryBlock =
  /** The project's logo: the page's heading. */
  | { type: "logo"; mark: StoryMark }
  /** A centred paragraph. */
  | { type: "text"; text: string }
  /** Rows of photographs. A row's pictures share its height, each as wide as
      its own proportions make it. */
  | { type: "pictures"; rows: StoryPicture[][] }
  /** The logo before and after, an arrow between them, then a paragraph. */
  | { type: "compare"; from: StoryMark; to: StoryMark; text: string }
  /** A mark beside a few large lines in the brand's colour. */
  | { type: "statement"; mark: StoryMark; text: string }
  /** A large heading in the brand's colour over a centred paragraph. */
  | { type: "heading"; title: string; text: string }
  /** A grid of equal pictures, three to a row (the guideline pages). */
  | { type: "grid"; pictures: StoryPicture[] }
  /** The closing line, large, in the brand's colour, over a rule. */
  | { type: "closing"; text: string };

export type CaseStory = {
  /** The page's address: /projects/<slug>. */
  slug: string;
  /** Its texts: i18n caseStories.<key>. */
  key: string;
  /** The brand's colour (headings, labels) and its soft companion (the arrow). */
  accent: string;
  soft: string;
  /** The picture on its card in the /projects grid and in link previews. */
  cover: string;
  /** The card's second picture, over the cover while the pointer is on it. */
  hover?: string;
  /** The logo in the corner of its card (in the brand's colour, on transparent). */
  badge: { src: string; width: number; height: number };
  /** When the page last changed (the sitemap's lastmod). */
  updated: string;
  blocks: StoryBlock[];
};

const ART_ANOR_DIR = "/case-study/art-anor";
// Photographs: wide ones 1.415 : 1, upright ones 4 : 5.
const WIDE = 1.415;
const UPRIGHT = 0.8;
const photo = (id: string, file: string, ratio: number): StoryPicture => ({ id, src: `${ART_ANOR_DIR}/${file}.webp`, ratio });
const mark = (id: string, file: string, width: number, height: number): StoryMark =>
  ({ id, src: `${ART_ANOR_DIR}/marks/${file}.webp`, ratio: width / height, width, height });

export const ART_ANOR: CaseStory = {
  slug: "art-anor",
  key: "artAnor",
  accent: "#AC0314",
  soft: "#E6D5C8",
  cover: `${ART_ANOR_DIR}/packaging.webp`,
  hover: `${ART_ANOR_DIR}/necklace-bust.webp`,
  badge: { src: `${ART_ANOR_DIR}/marks/logo.webp`, width: 2265, height: 788 },
  updated: "2026-11-21",
  blocks: [
    { type: "logo", mark: mark("logo", "logo", 2265, 788) },
    { type: "text", text: "intro" },
    {
      type: "pictures",
      rows: [
        [photo("hero", "hero", 2.404)],
        [photo("stationery", "stationery", UPRIGHT), photo("necklaceBust", "necklace-bust", UPRIGHT), photo("pendantCard", "pendant-card", UPRIGHT)],
      ],
    },
    { type: "compare", from: mark("logoOld", "logo-old", 961, 1172), to: mark("logoNew", "logo-new", 937, 1107), text: "compare.text" },
    {
      type: "pictures",
      rows: [
        [photo("packaging", "packaging", WIDE), photo("watchBox", "watch-box", UPRIGHT)],
        [photo("braceletBag", "bracelet-bag", UPRIGHT), photo("glovesNecklace", "gloves-necklace", WIDE)],
        [photo("giftBox", "gift-box", WIDE), photo("callaPendant", "calla-pendant", UPRIGHT)],
      ],
    },
    { type: "statement", mark: mark("markOutline", "mark-outline", 1004, 1186), text: "statement" },
    {
      type: "pictures",
      rows: [
        [photo("billboard", "billboard", WIDE), photo("storefront", "storefront", UPRIGHT)],
        [photo("lotusPendant", "lotus-pendant", UPRIGHT), photo("callaWide", "calla-wide", WIDE)],
      ],
    },
    { type: "heading", title: "details.title", text: "details.text" },
    { type: "grid", pictures: Array.from({ length: 9 }, (_, index) => photo(`guide${index + 1}`, `guide-${index + 1}`, 1.416)) },
    { type: "closing", text: "closing" },
  ],
};

/** Every story, newest first: the /projects grid and the sitemap list them. */
export const CASE_STORIES: readonly CaseStory[] = [ART_ANOR];

// ---------- a story ready to draw ----------
// The blocks with their words in place: what CaseStory.vue draws, whether the
// story is written in the site (resolveStory) or built from a CMS case study
// (buildCmsStory, utils/cmsStory.ts).

export type ViewPicture = {
  id: string;
  src: string;
  /** Width over height, as drawn in its row. */
  ratio: number;
  alt: string;
  /** Its own width in pixels, where known: a small upload is not drawn far past it. */
  width?: number;
};

/** A logo, a mark or an illustration: drawn whole, at its own proportions. */
export type ViewMark = { src: string; alt: string; width?: number; height?: number };

export type ViewBlock =
  /** The project's logo as the page's heading. */
  | { type: "logo"; mark: ViewMark }
  /** The heading in type, where there is no logo: the project's name, large, in
      the brand's colour, over a letter-spaced line saying what was made. */
  | { type: "title"; name: string; label: string }
  | { type: "text"; text: string }
  | { type: "pictures"; rows: ViewPicture[][] }
  | { type: "compare"; from: ViewMark & { label: string }; to: ViewMark & { label: string }; text: string }
  /** A few large lines, beside the brand's mark where there is one. */
  | { type: "statement"; mark?: ViewMark; text: string }
  | { type: "heading"; title: string; text: string }
  | { type: "grid"; pictures: ViewPicture[] }
  /** The brand's colours as a row of tiles, each over its hex code. */
  | { type: "palette"; label: string; text: string; colors: string[] }
  | { type: "closing"; text: string };

export type StoryView = {
  /** The page's heading in words: read out where a logo is the heading. */
  title: string;
  /** The brand's colour, for the large lines. */
  accent: string;
  /** The same colour, dark enough for small text on white. */
  ink: string;
  soft: string;
  blocks: ViewBlock[];
};

/** A story written in the site with its words in place (`text` reads a path under caseStories.<key>). */
export const resolveStory = (story: CaseStory, text: (path: string) => string): StoryView => {
  const alt = (item: StoryPicture) => text(`alt.${item.id}`);
  const picture = (item: StoryPicture): ViewPicture => ({ id: item.id, src: item.src, ratio: item.ratio, alt: alt(item) });
  const mark = (item: StoryMark): ViewMark => ({ src: item.src, alt: alt(item), width: item.width, height: item.height });
  return {
    title: text("title"),
    accent: story.accent,
    ink: story.accent,
    soft: story.soft,
    blocks: story.blocks.map((block): ViewBlock => {
      switch (block.type) {
        // The heading's words stand beside the logo (StoryView.title): the picture itself says nothing.
        case "logo": return { type: "logo", mark: { ...mark(block.mark), alt: "" } };
        case "text": return { type: "text", text: text(block.text) };
        case "pictures": return { type: "pictures", rows: block.rows.map((row) => row.map(picture)) };
        case "compare": return {
          type: "compare",
          from: { ...mark(block.from), label: text("compare.old") },
          to: { ...mark(block.to), label: text("compare.new") },
          text: text(block.text),
        };
        case "statement": return { type: "statement", mark: mark(block.mark), text: text(block.text) };
        case "heading": return { type: "heading", title: text(block.title), text: text(block.text) };
        case "grid": return { type: "grid", pictures: block.pictures.map(picture) };
        case "closing": return { type: "closing", text: text(block.text) };
      }
    }),
  };
};
