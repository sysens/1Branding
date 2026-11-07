/**
 * Deletes every file the body parser wrote to the OS temp dir once the request
 * is over, whatever its field name and however the request ended.
 *
 * strapi::body only deletes the field named `files`, and only when the rest of
 * the chain does not throw. A multipart body that ends in a 400/401/403/404, or
 * that uses another field name, would otherwise stay on disk, up to
 * UPLOAD_MAX_FILE_SIZE_MB per request. Runs right after strapi::body, so the
 * upload controllers still read the files before they go.
 */
import { rm } from 'node:fs/promises';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';

/** Temp-file paths of a parsed multipart body (`ctx.request.files`). */
export const tempFilePaths = (files: unknown): string[] => {
  if (!isRecord(files)) return [];
  return Object.values(files)
    .flatMap((group) => (Array.isArray(group) ? group : [group]))
    .map((file) => (isRecord(file) ? file.filepath : undefined))
    .filter((filepath): filepath is string => typeof filepath === 'string' && filepath !== '');
};

export default () => async (ctx: any, next: () => Promise<void>) => {
  // Taken before the chain runs: strapi::body deletes `ctx.request.files` after it.
  const paths = tempFilePaths(ctx.request?.files);
  if (!paths.length) return next();
  try {
    await next();
  } finally {
    await Promise.all(paths.map((filepath) => rm(filepath, { force: true }).catch(() => {})));
  }
};
