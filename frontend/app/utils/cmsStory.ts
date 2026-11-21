// A CMS case study (ProjectsPage) laid out as a case story: the Art-Anor
// page's blocks (utils/caseStories.ts, drawn by CaseStory.vue), in its order,
// each from its field. The page is the template; an entry shows the parts it
// has filled, and leaves the rest out:
//
//   the heading        projectLogo, or in type: the project's name over what
//                      was made ("Raviosta" / "logo and identity for...")
//   a paragraph        section1.text
//   pictures           section1.images: the first in a row of its own, then
//                      rows (section2's picture with them, each upload once)
//   old logo, new one  story.logoBefore, story.logoAfter, story.logoText
//   a large heading    section2: its title over its text
//   pictures           story.gallery
//   the mark, lines    story.mark beside story.statement (one line each)
//   pictures           story.moreGallery
//   a large heading    story.detailsTitle over story.detailsText
//   the palette        section3: its colours as tiles, title and text
//   guideline pages    story.guidePages, three to a row
//   the closing line   story.closing, over a rule
//
// (story is "Project: Art-Anor template" in the CMS. Where it has no lines or
// heading of its own, those an editor wrote in brandSystem stand in.)
// The large lines are in the project's colour (projectColor; without one, the
// most vivid colour of its palette).

import { caseColor, casePlainText, caseProjectMade, caseProjectName, caseServices, type CaseMedia, type CaseStudyEntry } from "./caseStudy";
import type { StoryView, ViewBlock, ViewMark, ViewPicture } from "./caseStories";

/** The Art-Anor template's parts of an entry ("Project: Art-Anor template"). */
export type CmsStoryParts = {
  logoBefore?: CaseMedia | null;
  logoAfter?: CaseMedia | null;
  logoText?: string | null;
  gallery?: Array<CaseMedia | null> | null;
  mark?: CaseMedia | null;
  statement?: string | null;
  moreGallery?: Array<CaseMedia | null> | null;
  detailsTitle?: string | null;
  detailsText?: string | null;
  guidePages?: Array<CaseMedia | null> | null;
  closing?: string | null;
};

export type CmsStoryEntry = CaseStudyEntry & {
  projectColor?: string | null;
  projectLogo?: CaseMedia | null;
  story?: CmsStoryParts | null;
};

/** The site's own words: a project without a name, the palette's and the two logos' labels. */
export type CmsStoryCopy = { untitled: string; palette: string; before: string; after: string };

// ---------- colours ----------

type Rgb = [number, number, number];

const toRgb = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)) as Rgb;
const toHex = (rgb: Rgb) => `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("").toUpperCase()}`;

/** WCAG relative luminance: 0 for black, 1 for white. */
const luminance = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** A colour's contrast with white (WCAG): 21 for black, 1 for white. `hex` is #RRGGBB. */
export const contrastOnWhite = (hex: string) => 1.05 / (luminance(toRgb(hex)) + 0.05);

/** The colour, darkened a step at a time until it has that contrast with white. */
export const darkenTo = (hex: string, contrast: number) => {
  let rgb = toRgb(hex);
  for (let step = 0; step < 80 && 1.05 / (luminance(rgb) + 0.05) < contrast; step += 1) {
    rgb = rgb.map((channel) => channel * 0.96) as Rgb;
  }
  return toHex(rgb);
};

/** How far a colour is from grey: 0 for black, white and greys, 255 for a pure colour. */
const vividness = (hex: string) => {
  const rgb = toRgb(hex);
  return Math.max(...rgb) - Math.min(...rgb);
};

/**
 * The page's colours: `accent` for the large lines (3:1 on white, the measure
 * for large text) and `ink` for small ones (4.5:1). They are the colour chosen
 * for the project; without one, the most vivid palette colour that reads on
 * white; without that, near-black. A colour too light for the page is darkened.
 */
export const storyColours = (chosen: string | null | undefined, palette: string[]) => {
  const vivid = palette
    .filter((hex) => contrastOnWhite(hex) >= 3)
    .sort((a, b) => vividness(b) - vividness(a))[0];
  const base = caseColor(chosen)?.hex ?? vivid ?? "#111111";
  return { accent: darkenTo(base, 3), ink: darkenTo(base, 4.5) };
};

// ---------- words ----------

/** Text as the story shows it: its paragraphs kept (a blank line between), an editor's ** marks dropped. */
const storyText = (value?: string | null) =>
  (value ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map(casePlainText)
    .filter(Boolean)
    .join("\n\n");

/** A statement written one line each ("One brand." / "One standard."), its lines kept. */
const storyLines = (value?: string | null) =>
  (value ?? "")
    .split(/\r?\n/)
    .map(casePlainText)
    .filter(Boolean)
    .join("\n");

// ---------- pictures ----------

// A row is full at about two wide pictures or three upright ones.
const ROW_FULL = 2.2;

/**
 * Pictures in rows, in their order: a row takes pictures until their
 * proportions (width over height) add up to ROW_FULL. An upright picture left
 * alone at the end joins the row before it, as a row of its own would be
 * taller than the screen.
 */
export const storyRows = (pictures: ViewPicture[]): ViewPicture[][] => {
  const rows: ViewPicture[][] = [];
  let row: ViewPicture[] = [];
  let across = 0;
  for (const picture of pictures) {
    row.push(picture);
    across += picture.ratio;
    if (across >= ROW_FULL) {
      rows.push(row);
      row = [];
      across = 0;
    }
  }
  const last = rows[rows.length - 1];
  if (row.length === 1 && row[0]!.ratio < 1.2 && last) last.push(row[0]!);
  else if (row.length) rows.push(row);
  return rows;
};

// ---------- the story ----------

const markOf = (src: string, alt: string, item?: CaseMedia | null): ViewMark => ({
  src,
  alt,
  ...(item?.width && item?.height ? { width: item.width, height: item.height } : {}),
});

/** The story of a CMS case study: see the head of this file for what goes where. */
export const buildCmsStory = (entry: CmsStoryEntry, media: (url?: string | null) => string, copy: CmsStoryCopy): StoryView => {
  const title = casePlainText(entry.section1?.projectTitle);
  const name = caseProjectName(title) || copy.untitled;
  // "Raviosta: logo and identity for an Italian restaurant" says what was made
  // after the name; a title that is the name alone leaves it to the tags.
  const made = caseProjectMade(title);
  const parts = entry.story ?? {};
  const blocks: ViewBlock[] = [];
  const text = (value?: string | null) => {
    const body = storyText(value);
    if (body) blocks.push({ type: "text", text: body });
  };
  const heading = (headline?: string | null, value?: string | null) => {
    const line = casePlainText(headline);
    if (line) blocks.push({ type: "heading", title: line, text: storyText(value) });
    else text(value);
  };

  // Every picture once, even where several fields point to the same upload.
  let count = 0;
  const shown = new Set<string>();
  const picturesOf = (items: Array<CaseMedia | null | undefined>, alt: (index: number) => string) =>
    items.flatMap((item, index): ViewPicture[] => {
      const src = media(item?.url);
      if (!src || shown.has(src)) return [];
      shown.add(src);
      count += 1;
      return [{
        id: `picture-${count}`,
        src,
        alt: casePlainText(item?.alternativeText) || alt(index),
        ratio: item?.width && item?.height ? item.width / item.height : 16 / 9,
        ...(item?.width ? { width: item.width } : {}),
      }];
    });
  const rows = (items: Array<CaseMedia | null> | null | undefined) => {
    const pictures = picturesOf(items ?? [], () => name);
    if (pictures.length) blocks.push({ type: "pictures", rows: storyRows(pictures) });
  };

  // ---- the heading, the paragraph ----
  const logo = media(entry.projectLogo?.url);
  blocks.push(
    logo
      ? { type: "logo", mark: markOf(logo, "", entry.projectLogo) }
      : { type: "title", name, label: made || caseServices(entry).join(" · ") }
  );
  text(entry.section1?.text);

  // ---- the first pictures: the cover alone, then rows ----
  const section2 = entry.section2;
  const [cover, ...rest] = picturesOf(
    [...(entry.section1?.images ?? []), section2?.image],
    (index) => (index === 0 ? title || name : name)
  );
  if (cover) blocks.push({ type: "pictures", rows: [[cover], ...storyRows(rest)] });

  // ---- the old logo and the new one ----
  const before = media(parts.logoBefore?.url);
  const after = media(parts.logoAfter?.url);
  if (before && after) {
    blocks.push({
      type: "compare",
      from: { ...markOf(before, `${name}: ${copy.before}`, parts.logoBefore), label: copy.before },
      to: { ...markOf(after, `${name}: ${copy.after}`, parts.logoAfter), label: copy.after },
      text: storyText(parts.logoText),
    });
  } else {
    text(parts.logoText);
  }

  // ---- the project's story, its pictures ----
  heading(section2?.title, section2?.text);
  rows(parts.gallery);

  // ---- the mark beside the large lines ----
  const system = entry.brandSystem;
  const ownLines = storyLines(parts.statement);
  const lines = ownLines || storyLines(system?.statement);
  const markItem = parts.mark ?? (ownLines ? null : system?.image);
  const mark = media(markItem?.url);
  if (lines) {
    blocks.push({
      type: "statement",
      ...(mark ? { mark: markOf(mark, casePlainText(markItem?.alternativeText) || name, markItem) } : {}),
      text: lines,
    });
  }
  rows(parts.moreGallery);

  // ---- the details, the palette, the guideline pages, the end ----
  if (casePlainText(parts.detailsTitle) || storyText(parts.detailsText)) heading(parts.detailsTitle, parts.detailsText);
  else heading(system?.title, system?.text);

  const palette = entry.section3;
  const colors = [...new Set((palette?.colorCard ?? []).map((card) => caseColor(card?.HexColorCode)?.hex).filter((hex): hex is string => !!hex))];
  const paletteTitle = casePlainText(palette?.title);
  if (colors.length) blocks.push({ type: "palette", label: paletteTitle || copy.palette, text: storyText(palette?.text), colors });
  else heading(paletteTitle, palette?.text);

  // The guideline pages share the first one's proportions, so the grid's rows line up.
  const pages = picturesOf(parts.guidePages ?? [], (index) => `${name} — ${index + 1}`);
  if (pages.length) blocks.push({ type: "grid", pictures: pages.map((page) => ({ ...page, ratio: pages[0]!.ratio })) });

  const closing = storyText(parts.closing);
  if (closing) blocks.push({ type: "closing", text: closing });

  return { title: title || name, ...storyColours(entry.projectColor, colors), soft: "#E6E6E6", blocks };
};
