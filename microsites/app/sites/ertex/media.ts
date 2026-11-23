// Every picture of the site, imported through Vite: each gets a content hash
// in its file name, so it can be cached for good and never collides with
// another site's files.
const files = import.meta.glob<string>("./assets/**/*.{png,jpg,webp,svg}", {
  eager: true,
  import: "default",
});

/** URL of an image by its path under ./assets, e.g. media("gallery/01.webp"). */
export function media(path: string): string {
  const url = files[`./assets/${path}`];
  if (!url) throw new Error(`ERTEX: no image at assets/${path}`);
  return url;
}
