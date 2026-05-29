export type BrandCollageImage = {
  src: string;
};

export type BrandCollageRowConfig = {
  key: string;
  animClass: "animate-marquee" | "animate-marquee-reverse";
  withLink: boolean;
  duplicatedImages: BrandCollageImage[];
};

export const LOCAL_BRAND_COLLAGE_ROWS: string[][] = [
  [
    "/home/threeLayerLocal/11.webp",
    "/home/threeLayerLocal/12.webp",
    "/home/threeLayerLocal/13.webp",
    "/home/threeLayerLocal/14.webp",
    "/home/threeLayerLocal/15.webp",
    "/home/threeLayerLocal/16.webp",
    "/home/threeLayerLocal/17.webp",
    "/home/threeLayerLocal/18.webp",
    "/home/threeLayerLocal/19.webp",
    "/home/threeLayerLocal/199.webp",
  ],
  [
    "/home/threeLayerLocal/21.webp",
    "/home/threeLayerLocal/22.webp",
    "/home/threeLayerLocal/23.webp",
    "/home/threeLayerLocal/24.webp",
    "/home/threeLayerLocal/25.webp",
    "/home/threeLayerLocal/26.webp",
    "/home/threeLayerLocal/27.webp",
    "/home/threeLayerLocal/28.webp",
    "/home/threeLayerLocal/29.webp",
    "/home/threeLayerLocal/299.webp",
  ],
  [
    "/home/threeLayerLocal/31.webp",
    "/home/threeLayerLocal/32.webp",
    "/home/threeLayerLocal/33.webp",
    "/home/threeLayerLocal/34.webp",
    "/home/threeLayerLocal/35.webp",
    "/home/threeLayerLocal/36.webp",
    "/home/threeLayerLocal/37.webp",
    "/home/threeLayerLocal/38.webp",
    "/home/threeLayerLocal/39.webp",
    "/home/threeLayerLocal/40.webp",
  ],
];

type BuildRowsParams = {
  totalRows: number;
  adminRowSets: string[][];
  fallbackRowSets: string[][];
  linkTo?: string;
};

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleArray = (arr: string[], seed: number): string[] => {
  const rand = mulberry32(seed);
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

const spreadDuplicates = (arr: string[], seed: number): string[] => {
  if (arr.length <= 1) {
    return arr;
  }

  const rand = mulberry32(seed);
  const result = [...arr];

  for (let pass = 0; pass < result.length * 3; pass++) {
    let changed = false;

    for (let i = 1; i < result.length; i++) {
      if (result[i] !== result[i - 1]) {
        continue;
      }

      let swapIndex = -1;

      for (let j = i + 1; j < result.length; j++) {
        const prevOk = result[j] !== result[i - 1];
        const nextOk = j === result.length - 1 || result[j + 1] !== result[i];

        if (prevOk && nextOk) {
          swapIndex = j;
          break;
        }
      }

      if (swapIndex === -1) {
        const candidates = result
          .map((value, index) => ({ value, index }))
          .filter((candidate) => candidate.index !== i && candidate.value !== result[i - 1]);

        if (candidates.length) {
          swapIndex = candidates[Math.floor(rand() * candidates.length)].index;
        }
      }

      if (swapIndex !== -1) {
        [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }

  return result;
};

const buildRowImages = (images: string[], rowIdx: number): string[] => {
  const seed = 12345 + rowIdx * 99991;
  const shuffled = shuffleArray(images, seed);
  return spreadDuplicates(shuffled, seed + 77);
};

const cleanRow = (row: string[] | undefined): string[] =>
  row?.map((src) => src.trim()).filter(Boolean) ?? [];

const getRow = (rowSets: string[][], rowIdx: number): string[] => {
  const directRow = cleanRow(rowSets[rowIdx]);

  if (directRow.length) {
    return directRow;
  }

  return cleanRow(rowSets[rowIdx % rowSets.length]);
};

export const getLocalBrandCollageRows = (): string[][] => LOCAL_BRAND_COLLAGE_ROWS;

export const buildBrandCollageRowsConfig = ({
  totalRows,
  adminRowSets,
  fallbackRowSets,
  linkTo,
}: BuildRowsParams): BrandCollageRowConfig[] => {
  const rowCount = Math.max(0, totalRows);

  return Array.from({ length: rowCount }, (_, rowIdx) => {
    const adminRow = getRow(adminRowSets, rowIdx);
    const fallbackRow = getRow(fallbackRowSets, rowIdx);
    const sourceRow = adminRow.length ? adminRow : fallbackRow;
    const preparedImages = buildRowImages(sourceRow, rowIdx);
    const images = preparedImages.map((src) => ({
      src,
    }));

    return {
      key: `row-${rowIdx}`,
      animClass: rowIdx % 2 === 1 ? "animate-marquee-reverse" : "animate-marquee",
      withLink: rowIdx === 0 && !!linkTo,
      duplicatedImages: [...images, ...images],
    };
  });
};
