/**
 * Contact-form attachments: where they may live, who may attach them, and the
 * clean-up of the ones never attached to a submission.
 *
 * The public form uploads its file first (POST /api/upload) and then posts the
 * submission with that file's id. An upload is remembered for the client that
 * sent it, so a submission can only attach its own, fresh, unused upload; the
 * uploads are tagged with CONTACT_UPLOAD_CAPTION so the hourly clean-up can
 * delete those that were never attached (and only those: media uploaded in the
 * admin panel never carry the tag).
 */

export const CONTACT_UPLOAD_CAPTION = 'contact-form-attachment';

const UPLOAD_TTL_MS = 30 * 60 * 1000;
const MAX_REMEMBERED = 5_000;
const ORPHAN_AGE_MS = 2 * 60 * 60 * 1000;
const FILE_NAME = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/;

/**
 * The client a rate-limit / ownership record belongs to. IPv6 clients are keyed
 * by their /64, since one connection can rotate through a whole /64.
 */
export const clientKey = (ip: string | undefined): string => {
  const address = String(ip || '').replace(/^::ffff:/, '');
  if (!address.includes(':')) return address;
  const [head] = address.split('%');
  const groups = head.split('::');
  const left = groups[0] ? groups[0].split(':') : [];
  const right = groups.length > 1 && groups[1] ? groups[1].split(':') : [];
  const full = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return `${full.slice(0, 4).map((part) => part.toLowerCase() || '0').join(':')}::/64`;
};

const uploads = new Map<number, { client: string; at: number }>();

export const rememberUpload = (id: number, client: string): void => {
  const now = Date.now();
  for (const [key, entry] of uploads) {
    if (entry.at > now - UPLOAD_TTL_MS && uploads.size < MAX_REMEMBERED) break;
    uploads.delete(key); // Map keeps insertion order: the oldest go first.
  }
  uploads.set(id, { client, at: now });
};

/** True once for an upload this client made in the last 30 minutes. */
export const takeUpload = (id: number, client: string): boolean => {
  const entry = uploads.get(id);
  if (!entry || entry.client !== client || entry.at < Date.now() - UPLOAD_TTL_MS) return false;
  uploads.delete(id);
  return true;
};

/**
 * Where uploaded files are served from, per the upload provider in use:
 * `/uploads` on this server for the local provider, the R2 public URL (plus
 * its root path) for aws-s3. Read from the merged plugin config, so it always
 * matches what the upload plugin actually does.
 */
export const uploadLocation = (strapi: any): { provider: string; origin: string | null; prefix: string } => {
  const config = strapi.config.get('plugin::upload') ?? {};
  if (config.provider === 'aws-s3') {
    const base = String(config.providerOptions?.baseUrl ?? '');
    const root = String(config.providerOptions?.rootPath ?? '').replace(/^\/+|\/+$/g, '');
    try {
      const url = new URL(base);
      return { provider: 'aws-s3', origin: url.origin, prefix: `${url.pathname.replace(/\/+$/, '')}${root ? `/${root}` : ''}` };
    } catch {
      return { provider: 'aws-s3', origin: null, prefix: '' };
    }
  }
  return { provider: 'local', origin: null, prefix: '/uploads' };
};

/** Whether a stored file URL is an upload of the provider in use (not some other URL). */
export const isUploadUrl = (strapi: any, provider: unknown, fileUrl: unknown): boolean => {
  if (typeof fileUrl !== 'string') return false;
  const location = uploadLocation(strapi);
  if (provider !== location.provider) return false;
  if (location.provider === 'local') {
    return fileUrl.startsWith('/uploads/') && FILE_NAME.test(fileUrl.slice('/uploads/'.length));
  }
  if (!location.origin) return false;
  try {
    const url = new URL(fileUrl);
    const name = url.pathname.slice(location.prefix.length + 1);
    return url.origin === location.origin && !url.search && !url.hash && !url.username && !url.password &&
      url.pathname.startsWith(`${location.prefix}/`) && FILE_NAME.test(name);
  } catch {
    return false;
  }
};

/** Deletes contact attachments older than two hours that no submission refers to. */
export const removeOrphanContactUploads = async (strapi: any): Promise<number> => {
  const cutoff = new Date(Date.now() - ORPHAN_AGE_MS).toISOString();
  const candidates = await strapi.db.query('plugin::upload.file').findMany({
    where: { caption: CONTACT_UPLOAD_CAPTION, createdAt: { $lt: cutoff } },
    populate: ['related'],
    limit: 200,
  });
  let removed = 0;
  for (const file of candidates) {
    if (Array.isArray(file.related) && file.related.length) continue;
    await strapi.plugin('upload').service('upload').remove(file);
    removed += 1;
  }
  return removed;
};
