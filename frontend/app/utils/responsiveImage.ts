// 2560px /home images that also have a 1280px copy in public/home/w1280
// (scripts/prepare-responsive-images.ts), so phones do not download the
// desktop originals.
export const W1280_IMAGES = [
  "/home/Quaker.webp",
  "/home/quaker-2.webp",
  "/home/quaker-3.webp",
  "/home/quaker-4.webp",
  "/home/quaker-5.webp",
  "/home/quaker-6.webp",
  "/home/quaker-7.webp",
  "/home/quaker-8.webp",
  "/home/macbook-linear.webp",
] as const;

const W1280_SET = new Set<string>(W1280_IMAGES);

/** srcset for an image with a w1280 copy; encodeURI because spaces would split a srcset entry. */
export const w1280Srcset = (src: string | null | undefined) =>
  src && W1280_SET.has(src)
    ? `${encodeURI(src.replace("/home/", "/home/w1280/"))} 1280w, ${encodeURI(src)} 2560w`
    : undefined;
