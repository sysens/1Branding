import { open, rm } from 'node:fs/promises';
import { extname } from 'node:path';

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
  const key = `${kind}:${ctx.ip}`;
  if (attempts.size >= MAX_BUCKETS) {
    for (const [entry, timestamps] of attempts) {
      const recent = timestamps.filter((timestamp) => timestamp > now - WINDOW_MS);
      if (recent.length) attempts.set(entry, recent);
      else attempts.delete(entry);
    }
  }
  if (!attempts.has(key) && attempts.size >= MAX_BUCKETS) {
    ctx.throw(429, 'Please try again later');
  }

  const recent = (attempts.get(key) || []).filter((timestamp) => timestamp > now - WINDOW_MS);
  const max = kind === 'upload' ? 10 : 5;
  if (recent.length >= max) {
    ctx.set('Retry-After', String(Math.ceil((recent[0] + WINDOW_MS - now) / 1000)));
    ctx.throw(429, 'Please try again later');
  }
  recent.push(now);
  attempts.set(key, recent);
};

const fields: Record<string, number> = {
  TopicInput: 200,
  requestedServicesMessageInput: 5000,
  FullName: 150,
  JobTitle: 150,
  Company: 150,
  PhoneNumber: 32,
  email: 254,
};

// Bot traps sent by the website form alongside `data`: a hidden "website"
// field real visitors never fill, and how long the form was open. Scripts that
// fill every input or post instantly are refused; `meta` never reaches Strapi.
// `meta` is optional so a frontend deployed before this backend keeps working.
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

const validateSubmission = async (ctx: any, strapi: any) => {
  const body = ctx.request.body;
  const data = body?.data;
  if (!isRecord(body) || !('data' in body) ||
      Object.keys(body).some((key) => key !== 'data' && key !== 'meta')) {
    reject(ctx, 'Invalid contact submission');
  }
  if ('meta' in body) checkBotTraps(ctx, body);
  if (!isRecord(data) ||
      Object.keys(data).length !== Object.keys(fields).length + 1 ||
      Object.keys(data).some((key) => key !== 'requestedServicesMessageFile' && !(key in fields))) {
    reject(ctx, 'Invalid contact submission');
  }

  for (const [key, max] of Object.entries(fields)) {
    const value = data[key];
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
      reject(ctx, `Invalid ${key}`);
    }
    data[key] = value.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email as string) ||
      !/^\+?[0-9\s().-]{7,32}$/.test(data.PhoneNumber as string) ||
      (data.PhoneNumber as string).replace(/\D/g, '').length < 7) {
    reject(ctx, 'Invalid email or phone number');
  }

  const id = data.requestedServicesMessageFile;
  if (!Number.isSafeInteger(id) || (id as number) <= 0) reject(ctx, 'Invalid contact file');

  const file = await strapi.db.query('plugin::upload.file').findOne({
    where: { id },
    select: ['name', 'ext', 'mime', 'size', 'url', 'provider', 'createdAt'],
  });
  const createdAt = file && new Date(file.createdAt).getTime();
  if (!file || !Number.isFinite(createdAt) || createdAt > Date.now() + 60_000 ||
      Date.now() - createdAt > 30 * 60 * 1000 || file.provider !== 'local' ||
      typeof file.url !== 'string' || !/^\/uploads\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(file.url) ||
      typeof file.name !== 'string' || !isAllowedFileType(file.name, file.mime || '') ||
      file.ext?.toLowerCase() !== extname(file.name).toLowerCase() ||
      !(file.size > 0 && file.size <= 10 * 1024)) { // Strapi stores size in KB.
    reject(ctx, 'Invalid contact file');
  }
};

const validateUpload = async (ctx: any) => {
  const input = ctx.request.files?.files;
  if (!input || Array.isArray(input) || !isRecord(input)) reject(ctx, 'Upload one contact file');
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

// strapi::body only deletes formidable temp files when the downstream chain
// succeeds; on a thrown error they would stay in the OS temp dir forever.
const removeTempFiles = async (ctx: any) => {
  const groups = Object.values(ctx.request?.files ?? {});
  const paths = groups
    .flatMap((group) => (Array.isArray(group) ? group : [group]))
    .map((file: any) => file?.filepath)
    .filter((filepath): filepath is string => typeof filepath === 'string');
  await Promise.all(paths.map((filepath) => rm(filepath, { force: true }).catch(() => {})));
};

// Two passes: before body parsing (cheap rate/size checks) and after parsing
// (file/field checks). These endpoints keep Strapi's existing upload + create contract.
export default (config: { phase: 'pre' | 'validate' }, { strapi }: { strapi: any }) =>
  async (ctx: any, next: () => Promise<void>) => {
    if (ctx.method !== 'POST' || (ctx.path !== UPLOAD_PATH && ctx.path !== SUBMISSION_PATH)) {
      return next();
    }

    if (config.phase === 'pre') {
      const isUpload = ctx.path === UPLOAD_PATH;
      // `POST /api/upload?id=<n>` makes Strapi replace (or re-describe) an
      // existing media file. The public contact flow never sends a query string.
      if (ctx.querystring) reject(ctx, 'Unexpected query parameters');
      const contentType = ctx.get('Content-Type').toLowerCase();
      if (!(isUpload ? contentType.startsWith('multipart/form-data;') :
        contentType.startsWith('application/json'))) {
        reject(ctx, 'Invalid request content type');
      }
      const maxLength = isUpload ? MAX_CONTACT_FILE_BYTES + 64 * 1024 : 16 * 1024;
      if (Number(ctx.get('Content-Length')) > maxLength) ctx.throw(413, 'Request too large');
      limitRequests(ctx, isUpload ? 'upload' : 'submission');
    } else if (ctx.path === UPLOAD_PATH) {
      try {
        await validateUpload(ctx);
        return await next();
      } catch (error) {
        await removeTempFiles(ctx);
        throw error;
      }
    } else {
      await validateSubmission(ctx, strapi);
    }
    return next();
  };
