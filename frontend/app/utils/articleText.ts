// The text of a CMS article (NewsPage.text) in its small format: paragraphs
// separated by blank lines, a line starting with "## " is a heading, lines
// starting with "- " are a list, and [text](/path) links to a page of the site.
// It is turned into blocks rendered as plain elements (no v-html), so nothing
// in the CMS text can inject markup; links outside the site stay plain text.

export type ArticlePart = { text: string; href?: string };
export type ArticleBlock =
  | { type: "p" | "h2"; parts: ArticlePart[] }
  | { type: "ul"; items: ArticlePart[][] };

const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

export const articleInline = (line: string): ArticlePart[] => {
  const parts: ArticlePart[] = [];
  let last = 0;
  for (const match of line.matchAll(LINK)) {
    if (match.index > last) parts.push({ text: line.slice(last, match.index) });
    parts.push({ text: match[1]!, href: match[2]! });
    last = match.index + match[0].length;
  }
  if (last < line.length) parts.push({ text: line.slice(last) });
  return parts;
};

export const articleBlocks = (text: string): ArticleBlock[] =>
  text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): ArticleBlock => {
      const lines = chunk.split("\n").map((line) => line.trim());
      if (lines.length === 1 && lines[0]!.startsWith("## ")) return { type: "h2", parts: articleInline(lines[0]!.slice(3)) };
      if (lines.every((line) => line.startsWith("- "))) return { type: "ul", items: lines.map((line) => articleInline(line.slice(2))) };
      return { type: "p", parts: articleInline(lines.join(" ")) };
    });

/** An article written with headings: read as one column, not two. */
export const isStructuredArticle = (text: string) => /^## /m.test(text);

/** The words alone (list excerpts, meta descriptions). */
export const articlePlainText = (text: string) =>
  text.replace(LINK, "$1").replace(/^\s*(?:## |- )/gm, "").replace(/\s*\n\s*/g, " ").trim();
