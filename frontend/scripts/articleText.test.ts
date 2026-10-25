import { describe, expect, test } from "bun:test";
import { articleBlocks, articlePlainText, isStructuredArticle } from "../app/utils/articleText";

const TEXT = `Intro with a [link](/services/logo-design) inside.

## A heading

- first item
- second [item](/pricing)

A paragraph
over two lines, and [an outside link](https://example.com).`;

describe("article text", () => {
  test("splits paragraphs, headings, lists and site links", () => {
    expect(articleBlocks(TEXT)).toEqual([
      { type: "p", parts: [{ text: "Intro with a " }, { text: "link", href: "/services/logo-design" }, { text: " inside." }] },
      { type: "h2", parts: [{ text: "A heading" }] },
      { type: "ul", items: [[{ text: "first item" }], [{ text: "second " }, { text: "item", href: "/pricing" }]] },
      // Only paths inside the site become links.
      { type: "p", parts: [{ text: "A paragraph over two lines, and [an outside link](https://example.com)." }] },
    ]);
  });

  test("plain text and the one-column switch", () => {
    expect(articlePlainText(TEXT)).toBe("Intro with a link inside. A heading first item second item A paragraph over two lines, and [an outside link](https://example.com).");
    expect(isStructuredArticle(TEXT)).toBe(true);
    expect(isStructuredArticle("In 2025, Pepsi introduced...\n\nThe update also reflects...")).toBe(false);
  });
});
