import { open } from 'node:fs/promises';
import { extname } from 'node:path';
import {
  CONTACT_UPLOAD_CAPTION,
  clientKey,
  isUploadUrl,
  rememberUpload,
  takeUpload,
} from '../utils/contact-uploads';
import { routePath } from '../utils/route-path';

const UPLOAD_PATH = '/api/upload';
const SUBMISSION_PATH = '/api/contacts-requests';
const WINDOW_MS = 15 * 60 * 1000;
const MAX_CONTACT_FILE_BYTES = 10 * 1024 * 1024;
const MAX_BUCKETS = 10_000;
const attempts = new Map<string, number[]>();

const fileMimes: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.heic': ['image/heic', 'image/heif'],
  '.heif': ['image/heif', 'image/heic'],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const own = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key);

const isAllowedFileType = (name: string, mime: string): boolean => {
  const expected = fileMimes[extname(name).toLowerCase()];
  return Boolean(expected && expected.includes(mime.toLowerCase()));
};

// Magic-number check on the first bytes of the upload. Compared as hex strings
// so it type-checks with both the project's TypeScript and Strapi's (5.9) build.
const validSignature = (name: string, header: string): boolean => {
  const extension = extname(name).toLowerCase();
  const ascii = (from: number, to: number) => Buffer.from(header.slice(from * 2, to * 2), 'hex').toString('latin1');
  if (extension === '.pdf') return ascii(0, 5) === '%PDF-';
  if (extension === '.jpg' || extension === '.jpeg') return header.startsWith('ffd8ff');
  if (extension === '.png') return header.startsWith('89504e470d0a1a0a');
  if (extension === '.webp') return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
  if (extension === '.doc') return header.startsWith('d0cf11e0a1b11ae1');
  if (extension === '.docx') return header.startsWith('504b0304');
  if (extension === '.heic' || extension === '.heif')
    return ascii(4, 8) === 'ftyp' && /^(heic|heix|hevc|hevx|mif1|msf1)$/.test(ascii(8, 12));
  return false;
};

const reject = (ctx: any, message: string): never => ctx.throw(400, message) as never;

const limitRequests = (ctx: any, kind: 'upload' | 'submission') => {
  const now = Date.now();
  const key = `${kind}:${clientKey(ctx.ip)}`;
  if (!attempts.has(key) && attempts.size >= MAX_BUCKETS) {
    for (const [entry, timestamps] of attempts) {
      if (timestamps[timestamps.length - 1] <= now - WINDOW_MS) attempts.delete(entry);
    }
    // Still full: forget the clients seen longest ago rather than refusing
    // everyone (Map iteration follows insertion order, and each request
    // re-inserts its key, so the first keys are the least recently active).
    for (const entry of attempts.keys()) {
      if (attempts.size < MAX_BUCKETS) break;
      attempts.delete(entry);
    }
  }

  const recent = (attempts.get(key) || []).filter((timestamp) => timestamp > now - WINDOW_MS);
  const max = kind === 'upload' ? 10 : 5;
  if (recent.length >= max) {
    ctx.set('Retry-After', String(Math.ceil((recent[0] + WINDOW_MS - now) / 1000)));
    ctx.throw(429, 'Please try again later');
  }
  recent.push(now);
  attempts.delete(key);
  attempts.set(key, recent);
};

// Single-line fields refuse every control character, line breaks included, so
// a value cannot fake extra lines in the Telegram notification; the message
// may keep its line breaks.
// The website's quick request (a name, what the visitor wants, a phone number)
// sends only TopicInput, FullName and PhoneNumber; the long form also sends the
// rest, so those stay accepted but are optional.
const fields: Record<string, { max: number; multiline?: boolean; optional?: boolean }> = {
  TopicInput: { max: 200 },
  requestedServicesMessageInput: { max: 5000, multiline: true, optional: true },
  FullName: { max: 150 },
  JobTitle: { max: 150, optional: true },
  Company: { max: 150, optional: true },
  PhoneNumber: { max: 32 },
  email: { max: 254, optional: true },
  // Where the visitor came from (referrer, landing page, utm_* tags), filled
  // in by the website, not typed by the visitor. Older pages do not send it.
  Source: { max: 500, optional: true },
};
// Control characters plus the Unicode line and paragraph separators.
const SINGLE_LINE_FORBIDDEN = /[\p{Cc}\p{Zl}\p{Zp}]/u;
const MULTILINE_FORBIDDEN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

// Bot traps sent by the website form alongside `data`: a hidden "website"
// field real visitors never fill, and how long the form was open. Scripts that
// fill every input or post instantly are refused; `meta` never reaches Strapi.
const MIN_FILL_MS = 3_000;
const MAX_FILL_MS = 24 * 60 * 60 * 1000;

const checkBotTraps = (ctx: any, body: Record<string, unknown>) => {
  const meta = body.meta;
  if (!isRecord(meta) || Object.keys(meta).length !== 2) reject(ctx, 'Invalid contact submission');
  const { website, elapsedMs } = meta as Record<string, unknown>;
  if (website !== '' || typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs) ||
      elapsedMs < MIN_FILL_MS || elapsedMs > MAX_FILL_MS) {
    reject(ctx, 'Invalid contact submission');
  }
  delete body.meta;
};

/** Validates a submission and returns the id of the upload it attaches (null: it has none). */
const validateSubmission = async (ctx: any, strapi: any): Promise<number | null> => {
  const body = ctx.request.body;
  const data = body?.data;
  if (!isRecord(body) || !('data' in body) || !('meta' in body) ||
      Object.keys(body).some((key) => key !== 'data' && key !== 'meta')) {
    reject(ctx, 'Invalid contact submission');
  }
  checkBotTraps(ctx, body);
  // Own keys only: `in` would also accept inherited names such as "constructor".
  if (!isRecord(data) ||
      Object.keys(data).some((key) => key !== 'requestedServicesMessageFile' && !own(fields, key))) {
    reject(ctx, 'Invalid contact submission');
  }

  for (const [key, { max, multiline, optional }] of Object.entries(fields)) {
    const value = data[key];
    if (optional && (value === undefined || value === '')) {
      delete data[key];
      continue;
    }
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max ||
        (multiline ? MULTILINE_FORBIDDEN : SINGLE_LINE_FORBIDDEN).test(value)) {
      reject(ctx, `Invalid ${key}`);
    }
    data[key] = value.trim();
  }
  if ((data.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email as string)) ||
      !/^\+?[0-9\s().-]{7,32}$/.test(data.PhoneNumber as string) ||
      (data.PhoneNumber as string).replace(/\D/g, '').length < 7) {
    reject(ctx, 'Invalid email or phone number');
  }

  // The attachment is optional (the quick request has none); when the key is
  // there it must be a valid upload of this client, exactly as before.
  if (!own(data, 'requestedServicesMessageFile') || data.requestedServicesMessageFile === null) {
    delete data.requestedServicesMessageFile;
    return null;
  }
  const id = data.requestedServicesMessageFile;
  if (!Number.isSafeInteger(id) || (id as number) <= 0) reject(ctx, 'Invalid contact file');

  const file = await strapi.db.query('plugin::upload.file').findOne({
    where: { id },
    select: ['name', 'ext', 'mime', 'size', 'url', 'provider', 'caption', 'createdAt'],
    populate: { related: true },
  });
  const createdAt = file && new Date(file.createdAt).getTime();
  if (!file || !Number.isFinite(createdAt) || createdAt > Date.now() + 60_000 ||
      Date.now() - createdAt > 30 * 60 * 1000 ||
      file.caption !== CONTACT_UPLOAD_CAPTION ||
      (Array.isArray(file.related) && file.related.length > 0) ||
      !isUploadUrl(strapi, file.provider, file.url) ||
      typeof file.name !== 'string' || !isAllowedFileType(file.name, file.mime || '') ||
      file.ext?.toLowerCase() !== extname(file.name).toLowerCase() ||
      !(file.size > 0 && file.size <= 10 * 1024)) { // Strapi stores size in KB.
    reject(ctx, 'Invalid contact file');
  }
  // Last, so a submission refused above can be corrected and sent again: the
  // upload must be this client's own and not attached by an earlier submission.
  if (!takeUpload(id as number, clientKey(ctx.ip))) reject(ctx, 'Invalid contact file');
  return id as number;
};

const validateUpload = async (ctx: any) => {
  if (Object.keys(ctx.request.body ?? {}).length) reject(ctx, 'Upload one contact file');
  const groups = Object.keys(ctx.request.files ?? {});
  const input = ctx.request.files?.files;
  if (groups.length !== 1 || !input || Array.isArray(input) || !isRecord(input)) reject(ctx, 'Upload one contact file');
  const { originalFilename, mimetype, size, filepath } = input;
  if (typeof originalFilename !== 'string' || originalFilename.length > 150 ||
      !/^[^/\\\u0000-\u001f]+$/.test(originalFilename) ||
      typeof mimetype !== 'string' || !isAllowedFileType(originalFilename, mimetype) ||
      typeof size !== 'number' || size <= 0 || size > MAX_CONTACT_FILE_BYTES ||
      typeof filepath !== 'string') {
    reject(ctx, 'Invalid contact file');
  }

  const handle = await open(filepath, 'r');
  try {
    const bytes = new Uint8Array(32);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    const header = Array.from(bytes.subarray(0, bytesRead), (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (!validSignature(originalFilename, header)) {
      reject(ctx, 'Invalid contact file');
    }
  } finally {
    await handle.close();
  }
};

// Marks the stored file as a contact attachment (see utils/contact-uploads) and
// remembers which client uploaded it.
const recordUpload = async (ctx: any, strapi: any) => {
  const uploaded = Array.isArray(ctx.body) ? ctx.body : [];
  for (const file of uploaded) {
    if (!Number.isSafeInteger(file?.id)) continue;
    await strapi.db.query('plugin::upload.file').update({
      where: { id: file.id },
      data: { caption: CONTACT_UPLOAD_CAPTION },
    });
    file.caption = CONTACT_UPLOAD_CAPTION;
    rememberUpload(file.id, clientKey(ctx.ip));
  }
};

const hasBodyLength = (ctx: any): boolean =>
  /^\d+$/.test(ctx.get('Content-Length')) && !ctx.get('Transfer-Encoding');

// Two passes: before body parsing (cheap rate/size checks) and after parsing
// (file/field checks). These endpoints keep Strapi's existing upload + create contract.
export default (config: { phase: 'pre' | 'validate' }, { strapi }: { strapi: any }) =>
  async (ctx: any, next: () => Promise<void>) => {
    const path = routePath(ctx.path);
    if (ctx.method !== 'POST' || (path !== UPLOAD_PATH && path !== SUBMISSION_PATH)) {
      return next();
    }
    const isUpload = path === UPLOAD_PATH;

    if (config.phase === 'pre') {
      // `POST /api/upload?id=<n>` makes Strapi replace (or re-describe) an
      // existing media file. The public contact flow never sends a query string.
      if (ctx.querystring) reject(ctx, 'Unexpected query parameters');
      const contentType = ctx.get('Content-Type').toLowerCase();
      if (!(isUpload ? contentType.startsWith('multipart/form-data;') :
        contentType.startsWith('application/json'))) {
        reject(ctx, 'Invalid request content type');
      }
      // A chunked body has no length to check up front, and the parser would
      // read all of it before any limit applied. Browsers always send one.
      if (!hasBodyLength(ctx)) ctx.throw(411, 'Content-Length required');
      const maxLength = isUpload ? MAX_CONTACT_FILE_BYTES + 64 * 1024 : 16 * 1024;
      if (Number(ctx.get('Content-Length')) > maxLength) ctx.throw(413, 'Request too large');
      limitRequests(ctx, isUpload ? 'upload' : 'submission');
      return next();
    }

    if (isUpload) {
      // Temp files of a refused upload are deleted by global::temp-files.
      await validateUpload(ctx);
      await next();
      if (ctx.status < 300) await recordUpload(ctx, strapi);
      return;
    }

    const fileId = await validateSubmission(ctx, strapi);
    try {
      await next();
    } catch (error) {
      // Not saved: the same upload may be attached again on a retry.
      if (fileId !== null) rememberUpload(fileId, clientKey(ctx.ip));
      throw error;
    }
  };
