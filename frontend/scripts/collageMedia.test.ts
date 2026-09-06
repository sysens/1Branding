import { expect, test } from "bun:test";
import { selectCollageSource, isInitialCollageImage } from "../app/utils/collageMedia";
import { buildBrandCollageRowsConfig, getLocalBrandCollageRows } from "../app/utils/brandCollageRows";

test("gallery uses a CMS derivative instead of decoding the full-resolution original", () => {
  expect(selectCollageSource({ url: "/original.webp", formats: {
    small: { url: "/small.webp", width: 500, height: 281 },
    large: { url: "/large.webp", width: 1000, height: 563 },
    medium: { url: "/medium.webp", width: 750, height: 422 },
  } })).toBe("/large.webp");
  expect(selectCollageSource({ url: "/original.webp", formats: {
    small: { url: "/small.webp", width: 500, height: 281 },
  } })).toBe("/small.webp");
});

test("old and custom CMS media without formats remain usable", () => {
  expect(selectCollageSource({ url: "/custom.webp", formats: null })).toBe("/custom.webp");
  expect(selectCollageSource({ url: "/custom.webp", formats: {
    small: { url: "", width: 500, height: 281 },
  } })).toBe("/custom.webp");
  expect(selectCollageSource({})).toBeNull();
});

test("every row prioritizes its visible first set, including reverse duplicates", () => {
  for (const reverse of [true, false]) {
    for (let index = 0; index < 5; index++) {
      expect(isInitialCollageImage(index, 10, reverse)).toBe(true);
      expect(isInitialCollageImage(index + 10, 10, reverse)).toBe(true);
    }
  }
  expect(isInitialCollageImage(9, 10, true)).toBe(true);
  expect(isInitialCollageImage(19, 10, true)).toBe(true);
  expect(isInitialCollageImage(8, 10, false)).toBe(false);
  expect(isInitialCollageImage(0, 0, false)).toBe(false);
});

test("row order stays deterministic and both halves reuse the same URLs", () => {
  const params = { totalRows: 3, adminRowSets: [], fallbackRowSets: getLocalBrandCollageRows() };
  const rows = buildBrandCollageRowsConfig(params);
  expect(rows).toEqual(buildBrandCollageRowsConfig(params));
  for (const row of rows) {
    const middle = row.duplicatedImages.length / 2;
    expect(row.duplicatedImages.slice(0, middle)).toEqual(row.duplicatedImages.slice(middle));
  }
});
