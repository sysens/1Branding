import { expect, test } from "bun:test";
import { cmsSeoText, isPlaceholderCopy } from "../app/utils/seo";

test("dummy CMS copy is detected, real copy is not", () => {
  expect(isPlaceholderCopy("Sed sodales risus sed nisi tempor laoreet. Suspendisse potenti.")).toBe(true);
  expect(isPlaceholderCopy("Lorem ipsum dolor sit amet, consectetur adipiscing elit.")).toBe(true);
  expect(isPlaceholderCopy("Pellentesque vitae velit ex, vel interdum nisi. Nulla facilisi.")).toBe(true);
  expect(isPlaceholderCopy("Makva — branding case study")).toBe(false);
  expect(isPlaceholderCopy("Отличная команда, сделали логотип и упаковку в срок.")).toBe(false);
  expect(isPlaceholderCopy("")).toBe(false);
});

test("scaffolded CMS SEO values fall back to curated copy", () => {
  expect(cmsSeoText("HomePage", 15)).toBe("");
  expect(cmsSeoText("About Page  title", 15)).toBe("");
  expect(cmsSeoText("Contacts page  Description", 50)).toBe("");
  expect(cmsSeoText("Брендинговое агентство в Ташкенте", 15)).toBe("Брендинговое агентство в Ташкенте");
});
