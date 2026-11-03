// A case study (/projects/<slug>) is one light column of sections, each a
// small component in components/case-study/: the heading, a paragraph, a
// picture in a rounded card, a statement beside an illustration, the
// palette. The CMS entry (ProjectsPage) is
// turned into that list here, so a new kind of section is one more type
// below and one more component in CaseSections.vue; the page only renders
// the list.

export type CaseTextPart = { text: string; strong?: boolean };

export type CaseSection =
  /** The page's heading: the project's name for search engines and screen
      readers, and on screen what was made ("Rebranding & Branding"): the
      first in light grey fading out, the second in bold green over it. */
  | { type: "hero"; id: string; name: string; title: string; accent: string }
  /** Running text, its key phrase in dark bold, the rest grey. */
  | { type: "text"; id: string; paragraphs: CaseTextPart[][] }
  /** A picture in a rounded card, the full width of the column. */
  | { type: "picture"; id: string; src: string; alt: string; width?: number; height?: number }
  /** An illustration beside a short statement, one line each and its first
      words in green ("One brand. / One standard. / Zero guesswork."), then a
      green heading beside its paragraph. */
  | {
      type: "statement";
      id: string;
      image: { src: string; alt: string; width?: number; height?: number };
      lines: CaseTextPart[][];
      title: string;
      paragraphs: CaseTextPart[][];
    }
  | { type: "palette"; id: string; label: string; colors: CaseColor[] };

export type CaseColor = { hex: string; ink: "light" | "dark" };

export type CaseMedia = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  alternativeText?: string | null;
};

/** The site's own copy and illustration for the statement block, where the
    CMS has none. */
export type CaseStatementCopy = {
  statement: string;
  title: string;
  text: string;
  alt: string;
  image: { src: string; width: number; height: number };
};

/** What the sections need besides the CMS entry: the site's own copy. */
export type CaseCopy = { palette: string; statement: CaseStatementCopy };

/** The fields of a ProjectsPage entry the sections are made of. */
export type CaseStudyEntry = {
  category?: { categoryName?: string | null } | null;
  tags?: Array<{ label?: string | null } | null> | null;
  section1?: {
    projectTitle?: string | null;
    text?: string | null;
    images?: Array<CaseMedia | null> | null;
  } | null;
  section2?: { title?: string | null; text?: string | null; image?: CaseMedia | null } | null;
  section3?: {
    title?: string | null;
    text?: string | null;
    colorCard?: Array<{ HexColorCode?: string | null } | null> | null;
  } | null;
  brandSystem?: {
    statement?: string | null;
    title?: string | null;
    text?: string | null;
    image?: CaseMedia | null;
  } | null;
};

const clean = (value?: string | null) => (value ?? "").replace(/\s+/g, " ").trim();

// The first sentence: up to the first . ! ? or … (with any closing quotes or
// brackets after it) that is followed by more text.
const FIRST_SENTENCE = /^(.+?[.!?…]["'»”’)\]]*)\s+(?=\S)/;

// A line's first word, without the punctuation after it ("Zero." -> "Zero");
// none when the line opens with a dash or a quote.
const FIRST_WORD = /^[\p{L}\p{N}][\p{L}\p{N}'’-]*/u;

/** Text as parts, the phrases an editor wraps in **double asterisks** strong. */
export const caseMarkedParts = (text: string): CaseTextPart[] =>
  clean(text)
    .split(/\*\*(.+?)\*\*/)
    .map((part, index) => (index % 2 ? { text: part, strong: true } : { text: part }))
    .filter((part) => part.text);

/**
 * One paragraph as parts. Phrases the editor wraps in **double asterisks**
 * are the strong ones; without any, a given lead ("Emblem and wordmark.") or
 * else the first sentence is, as the design sets a key phrase in dark bold.
 */
export const caseTextParts = (text: string, lead = ""): CaseTextPart[] => {
  const body = clean(text);
  const head = clean(lead);
  if (head) {
    const strong = /[.!?…:]$/.test(head) ? head : `${head}.`;
    return body ? [{ text: strong, strong: true }, { text: ` ${body}` }] : [{ text: strong, strong: true }];
  }
  if (!body) return [];
  if (body.includes("**")) return caseMarkedParts(body);
  const first = body.match(FIRST_SENTENCE)?.[1];
  return first ? [{ text: first, strong: true }, { text: body.slice(first.length) }] : [{ text: body }];
};

/**
 * A statement written one line each, as lines of parts: the words an editor
 * wraps in **double asterisks** are the green ones, otherwise each line's
 * first word is ("One brand." -> "One" green, " brand." black).
 */
export const caseStatementLines = (text?: string | null): CaseTextPart[][] =>
  (text ?? "")
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean)
    .map((line) => {
      if (line.includes("**")) return caseMarkedParts(line);
      const first = line.match(FIRST_WORD)?.[0];
      return first ? [{ text: first, strong: true }, ...(line.length > first.length ? [{ text: line.slice(first.length) }] : [])] : [{ text: line }];
    });

/** Paragraphs (blank-line separated) as parts, strong only where marked. */
const markedParagraphs = (text?: string | null) =>
  (text ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map(caseMarkedParts)
    .filter((parts) => parts.length);

/** Plain text without the editor's ** marks, for meta descriptions. */
export const casePlainText = (text?: string | null) => clean(text).replace(/\*\*/g, "");

/** "Raviosta: logo and identity…" -> "Raviosta". */
export const caseProjectName = (title?: string | null) => clean(title).split(/:\s/)[0]!.trim();

/**
 * What was made, for the heading: the project's tags and category, each once
 * ("Branding", "Logo"). Two make the grey line and the green "& …" line; one
 * is the green line alone; with none the project's name is.
 */
export const caseHeading = (entry: CaseStudyEntry) => {
  const seen = new Set<string>();
  const services = [...(entry.tags ?? []).map((tag) => tag?.label), entry.category?.categoryName]
    .map(clean)
    .filter((label) => {
      const key = label.toLowerCase();
      if (!label || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (services.length > 1) return { title: services[0]!, accent: services[1]! };
  return { title: "", accent: services[0] || caseProjectName(entry.section1?.projectTitle) };
};

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A palette colour and the ink its label needs (WCAG relative luminance). */
export const caseColor = (value?: string | null): CaseColor | null => {
  const match = clean(value).match(HEX);
  if (!match) return null;
  const digits = match[1]!.length === 3 ? [...match[1]!].map((d) => d + d).join("") : match[1]!;
  const hex = `#${digits.toUpperCase()}`;
  const [r, g, b] = [0, 2, 4].map((at) => {
    const channel = parseInt(digits.slice(at, at + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Black text on colours lighter than ~#777, white on darker ones.
  return { hex, ink: luminance > 0.18 ? "dark" : "light" };
};

/**
 * The page's sections from its CMS entry, top to bottom: the heading, the
 * project's text, its first picture (the cover), the statement block, then
 * the story block with its picture, the remaining pictures and the palette.
 * A picture is shown once even when several fields point to the same upload;
 * the statement block takes the site's own copy for what the CMS leaves empty.
 */
export const buildCaseSections = (
  entry: CaseStudyEntry,
  media: (url?: string | null) => string,
  copy: CaseCopy
): CaseSection[] => {
  const sections: CaseSection[] = [];
  const name = clean(entry.section1?.projectTitle);
  const shown = new Set<string>();
  const picture = (item: CaseMedia | null | undefined, id: string, alt: string) => {
    const src = media(item?.url);
    if (!src || shown.has(src)) return;
    shown.add(src);
    sections.push({
      type: "picture",
      id,
      src,
      alt,
      ...(item?.width && item?.height ? { width: item.width, height: item.height } : {}),
    });
  };
  const text = (id: string, value?: string | null, lead?: string | null) => {
    const paragraphs = (value ?? "")
      .replace(/\r\n?/g, "\n")
      .split(/\n\s*\n/)
      .map((paragraph, index) => caseTextParts(paragraph, index === 0 ? lead ?? "" : ""))
      .filter((parts) => parts.length);
    if (!paragraphs.length && clean(lead)) paragraphs.push(caseTextParts("", lead ?? ""));
    if (paragraphs.length) sections.push({ type: "text", id, paragraphs });
  };

  sections.push({ type: "hero", id: "hero", name, ...caseHeading(entry) });

  const images = entry.section1?.images ?? [];
  text("intro", entry.section1?.text);
  picture(images[0], "cover", name);

  const system = entry.brandSystem;
  const illustration = media(system?.image?.url);
  const lines = caseStatementLines(system?.statement);
  const paragraphs = markedParagraphs(system?.text);
  sections.push({
    type: "statement",
    id: "statement",
    image: illustration
      ? {
          src: illustration,
          alt: clean(system?.image?.alternativeText) || copy.statement.alt,
          ...(system?.image?.width && system?.image?.height ? { width: system.image.width, height: system.image.height } : {}),
        }
      : { ...copy.statement.image, alt: copy.statement.alt },
    lines: lines.length ? lines : caseStatementLines(copy.statement.statement),
    title: clean(system?.title) || clean(copy.statement.title),
    paragraphs: paragraphs.length ? paragraphs : markedParagraphs(copy.statement.text),
  });

  const story = entry.section2;
  text("story", story?.text, story?.title);
  picture(story?.image, "story-picture", [name, clean(story?.title)].filter(Boolean).join(" — "));
  images.slice(1).forEach((item, index) => picture(item, `picture-${index + 2}`, name));

  const palette = entry.section3;
  const colors = (palette?.colorCard ?? []).map((card) => caseColor(card?.HexColorCode)).filter((color): color is CaseColor => color !== null);
  text("palette-text", palette?.text, palette?.title);
  if (colors.length) sections.push({ type: "palette", id: "palette", label: clean(palette?.title) || copy.palette, colors });

  return sections;
};
