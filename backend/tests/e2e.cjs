// End-to-end checks of the hardened API: `bun run build && bun run test:e2e`.
// Boots the built Strapi on a throwaway SQLite database, grants the Public role
// the two contact-form permissions and exercises uploads, submissions, the API
// guard, GraphQL limits, CORS and the orphan clean-up. E2E_PROVIDER=r2 (with
// dummy R2_* variables) checks the R2 URL rules instead.
const path = require('node:path');
const fs = require('node:fs');

const appDir = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const dbFile = '.tmp/e2e-' + Date.now() + '.db';
Object.assign(process.env, {
  NODE_ENV: 'production',
  HOST: '127.0.0.1',
  PORT: '1399',
  DATABASE_CLIENT: 'sqlite',
  DATABASE_FILENAME: dbFile,
  APP_KEYS: 'tobemodified1,tobemodified2',
  ADMIN_JWT_SECRET: 'e2e-admin-secret-0123456789abcdef',
  API_TOKEN_SALT: 'e2e-api-token-salt-0123456789abcdef',
  TRANSFER_TOKEN_SALT: 'e2e-transfer-salt-0123456789abcdef',
  JWT_SECRET: 'e2e-jwt-secret-0123456789abcdef',
  ENCRYPTION_KEY: 'e2e-encryption-key-0123456789abcdef',
  PUBLIC_BASE_URL: 'http://127.0.0.1:1399',
  CORS_ORIGINS: 'https://onebrandingworld.com',
  IS_PROXIED: 'true',
  UPLOAD_PROVIDER: process.env.E2E_PROVIDER || 'local',
});

const BASE = 'http://127.0.0.1:1399';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

let PNG;

const multipart = (filename, mime, bytes) => {
  const boundary = '----e2eboundary' + Math.random().toString(16).slice(2);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, bytes, tail]);
  return { body, headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': String(body.length) } };
};

const upload = async (ip, { filename = 'brief.png', mime = 'image/png', bytes = PNG, urlPath = '/api/upload' } = {}) => {
  const { body, headers } = multipart(filename, mime, bytes);
  const res = await fetch(BASE + urlPath, { method: 'POST', body, headers: { ...headers, 'X-Forwarded-For': ip } });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
};

const submission = (fileId, overrides = {}, meta = { website: '', elapsedMs: 5000 }) => ({
  data: {
    TopicInput: 'Branding',
    requestedServicesMessageInput: 'Hello,\nwe need a logo.',
    FullName: 'Test Person',
    JobTitle: 'CEO',
    Company: 'Acme',
    PhoneNumber: '+998 90 123 45 67',
    email: 'test@example.com',
    requestedServicesMessageFile: fileId,
    ...overrides,
  },
  ...(meta ? { meta } : {}),
});

const submit = async (ip, payload) => {
  const body = JSON.stringify(payload);
  const res = await fetch(BASE + '/api/contacts-requests', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)), 'X-Forwarded-For': ip },
  });
  const text = await res.text();
  return { status: res.status, text: text.slice(0, 200) };
};

(async () => {
  PNG = await require(path.join(appDir, 'node_modules/sharp'))({ create: { width: 8, height: 8, channels: 3, background: '#00ff00' } }).png().toBuffer();
  const { createStrapi } = require(path.join(appDir, 'node_modules/@strapi/strapi'));
  const app = createStrapi({ appDir, distDir: path.join(appDir, 'dist') });
  await app.start();
  const strapi = app;

  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  for (const action of ['plugin::upload.content-api.upload', 'api::contacts-request.contacts-request.create']) {
    await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
  }
  const uploadConfig = strapi.config.get('plugin::upload');
  if (process.env.E2E_PROVIDER === 'r2') {
    const { isUploadUrl, uploadLocation } = require(path.join(appDir, 'dist/src/utils/contact-uploads.js'));
    check('r2 provider active', uploadConfig.provider === 'aws-s3', uploadConfig.provider);
    check('r2 location', true, JSON.stringify(uploadLocation(strapi)));
    check('r2 url accepted', isUploadUrl(strapi, 'aws-s3', 'https://pub-test.r2.dev/uploads/brief_ab12cd.png'));
    check('other host refused', !isUploadUrl(strapi, 'aws-s3', 'https://evil.example/uploads/brief_ab12cd.png'));
    check('other prefix refused', !isUploadUrl(strapi, 'aws-s3', 'https://pub-test.r2.dev/other/brief_ab12cd.png'));
    check('local url refused under r2', !isUploadUrl(strapi, 'local', '/uploads/brief_ab12cd.png'));
    check('query string refused', !isUploadUrl(strapi, 'aws-s3', 'https://pub-test.r2.dev/uploads/brief_ab12cd.png?x=1'));
    await app.destroy();
    fs.rmSync(path.join(appDir, dbFile), { force: true });
    process.exit(results.some((x) => !x.ok) ? 1 : 0);
  }
  check('upload provider', true, `${uploadConfig.provider} / security=${Boolean(uploadConfig.security)}`);

  // Upload, owned by client A.
  const up = await upload('203.0.113.10');
  const fileId = up.json?.[0]?.id;
  check('upload accepted', up.status === 201 && Number.isInteger(fileId), `status ${up.status} ${JSON.stringify(up.json)}`);
  const stored = await strapi.db.query('plugin::upload.file').findOne({ where: { id: fileId } });
  check('upload tagged as contact attachment', stored?.caption === 'contact-form-attachment', stored?.caption);

  // Path variants and wrong file types.
  const html = await upload('203.0.113.11', { filename: 'x.html', mime: 'text/html', bytes: Buffer.from('<script>1</script>'), urlPath: '/API/Upload/' });
  check('upload via /API/Upload/ still validated', html.status === 400, `status ${html.status}`);
  const fakePng = await upload('203.0.113.11', { filename: 'x.png', mime: 'image/png', bytes: Buffer.from('<svg></svg>') });
  check('upload with wrong magic number refused', fakePng.status === 400, `status ${fakePng.status}`);

  // Submissions.
  let r = await submit('203.0.113.12', submission(fileId));
  check('other client cannot attach the upload', r.status === 400, `status ${r.status} ${r.text}`);
  r = await submit('203.0.113.13', submission(fileId, {}, null));
  check('submission without meta refused', r.status === 400, `status ${r.status}`);
  r = await submit('203.0.113.14', submission(fileId, { FullName: 'Name\nEmail: fake@x.com' }));
  check('line break in single-line field refused', r.status === 400, `status ${r.status}`);
  r = await submit('203.0.113.15', submission(fileId, { Extra: 'x' }));
  check('unknown field refused', r.status === 400, `status ${r.status}`);
  r = await submit('203.0.113.15', submission(fileId, { constructor: 'x' }));
  check('inherited name as a field refused', r.status === 400, `status ${r.status}`);
  r = await submit('203.0.113.15', submission(fileId, { Source: 'google.com\nPhone: +1' }));
  check('line break in Source refused', r.status === 400, `status ${r.status}`);
  r = await submit('203.0.113.10', submission(fileId));
  check('owner submission accepted', r.status === 200 || r.status === 201, `status ${r.status} ${r.text}`);
  r = await submit('203.0.113.10', submission(fileId));
  check('same upload cannot be attached twice', r.status === 400, `status ${r.status}`);

  // IPv6 clients share a /64 bucket for ownership.
  const up6 = await upload('2001:db8:1:2::abcd');
  r = await submit('2001:db8:1:2:ffff::1', submission(up6.json?.[0]?.id, { Source: 'google.com | landing /ru/services/brending | form /ru/contact' }));
  check('IPv6 /64 treated as one client (with a lead source)', r.status === 200 || r.status === 201, `status ${r.status} ${r.text}`);

  // Guard.
  let res = await fetch(BASE + '/api/upload/files', { headers: { Authorization: 'Basic abc' } });
  check('file listing closed for non-bearer Authorization', res.status === 403, `status ${res.status}`);
  res = await fetch(BASE + '/API/upload/FILES/');
  check('file listing closed for case/slash variant', res.status === 403, `status ${res.status}`);
  res = await fetch(BASE + '/api/upload/files', { headers: { Authorization: 'Bearer not-a-token' } });
  check('invalid bearer token rejected by Strapi', res.status === 401, `status ${res.status}`);

  // GraphQL size checks.
  const query = JSON.stringify({ query: '{ __typename }' });
  res = await fetch(BASE + '/graphql', { method: 'POST', body: query, headers: { 'Content-Type': 'application/json' } });
  check('graphql with Content-Length works', res.status === 200, `status ${res.status}`);
  const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(query)); c.close(); } });
  res = await fetch(BASE + '/graphql', { method: 'POST', body: stream, duplex: 'half', headers: { 'Content-Type': 'application/json' } });
  check('chunked graphql refused', res.status === 411, `status ${res.status}`);
  res = await fetch(BASE + '/graphql', { method: 'POST', body: JSON.stringify({ query: '{ uploadFiles { documentId } }' }), headers: { 'Content-Type': 'application/json' } });
  const gql = await res.json().catch(() => ({}));
  check('uploadFiles closed to public', Boolean(gql.errors?.length), JSON.stringify(gql.errors?.[0]?.message));

  // API tokens still pass the api-token-only policy.
  const token = await strapi.service('admin::api-token').create({ name: 'e2e', type: 'full-access', lifespan: null });
  res = await fetch(BASE + '/graphql', { method: 'POST', body: JSON.stringify({ query: '{ uploadFiles { documentId } }' }), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token.accessKey } });
  const tokenGql = await res.json().catch(() => ({}));
  check('uploadFiles open to an API token', !tokenGql.errors && Array.isArray(tokenGql.data?.uploadFiles), JSON.stringify(tokenGql).slice(0, 120));

  // Headers.
  res = await fetch(BASE + '/graphql', { method: 'OPTIONS', headers: { Origin: 'https://onebrandingworld.com', 'Access-Control-Request-Method': 'POST' } });
  check('CORS allows the site origin', res.headers.get('access-control-allow-origin') === 'https://onebrandingworld.com', res.headers.get('access-control-allow-origin'));
  res = await fetch(BASE + '/healthz');
  check('healthz returns 200', res.status === 200 && (await res.text()) === 'ok', String(res.status));
  res = await fetch(BASE + '/_health');
  check('no X-Powered-By', !res.headers.get('x-powered-by'), res.headers.get('x-powered-by'));

  // Orphan clean-up.
  const orphan = await upload('203.0.113.20');
  const orphanId = orphan.json?.[0]?.id;
  await strapi.db.query('plugin::upload.file').update({ where: { id: orphanId }, data: { createdAt: new Date(Date.now() - 3 * 3600e3) } });
  const { removeOrphanContactUploads } = require(path.join(appDir, 'dist/src/utils/contact-uploads.js'));
  const removed = await removeOrphanContactUploads(strapi);
  const gone = !(await strapi.db.query('plugin::upload.file').findOne({ where: { id: orphanId } }));
  const kept = Boolean(await strapi.db.query('plugin::upload.file').findOne({ where: { id: fileId } }));
  check('orphan upload removed, attached one kept', removed >= 1 && gone && kept, `removed ${removed}`);

  // News translations: a language version is created once, with the English
  // entry's pictures, and an edited one is never overwritten; a text fix applies once.
  const { applyNewsTranslations } = require(path.join(appDir, 'dist/src/utils/news-translations.js'));
  const news = strapi.documents('api::news-page.news-page');
  const article = await news.create({ locale: 'en', data: { title: 'English title', text: 'It is more contrasted, насыщенный and confident.', image: fileId, images: [fileId] } });
  const translations = [{ documentId: article.documentId, locale: 'ru', title: 'Русский заголовок', text: 'Русский текст.' }];
  const fixes = [{ documentId: article.documentId, locale: 'en', from: 'насыщенный', to: 'richer' }];
  await applyNewsTranslations(strapi, translations, fixes);
  let ru = await news.findOne({ documentId: article.documentId, locale: 'ru', populate: ['image', 'images'] });
  const en = await news.findOne({ documentId: article.documentId, locale: 'en', populate: ['image'] });
  check('news: ru version created with the pictures', ru?.title === 'Русский заголовок' && ru?.image?.id === fileId && ru?.images?.length === 1, JSON.stringify({ title: ru?.title, image: ru?.image?.id, images: ru?.images?.length }));
  check('news: English text fixed, its picture kept', en?.text === 'It is more contrasted, richer and confident.' && en?.image?.id === fileId, en?.text);
  await news.update({ documentId: article.documentId, locale: 'ru', data: { title: 'Edited' } });
  await applyNewsTranslations(strapi, translations, fixes);
  ru = await news.findOne({ documentId: article.documentId, locale: 'ru' });
  check('news: an edited version is not overwritten', ru?.title === 'Edited', ru?.title);

  // Case studies still in Lorem get their copy and palette with their own
  // pictures, a Russian version is added, and edited entries are left alone.
  const { applyProjectCopy } = require(path.join(appDir, 'dist/src/utils/project-copy.js'));
  const projects = strapi.documents('api::projects-page.projects-page');
  const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  const study = await projects.create({ locale: 'en', data: {
    section1: { projectTitle: lorem, text: lorem, images: [fileId] },
    section2: { title: 'Lorem ipsum dolor sit amet.', text: lorem, image: fileId },
    section3: { title: 'Color palette', text: lorem, colorCard: [{ HexColorCode: '#B9878A' }] },
  } });
  const copy = (title) => ({ title, intro: 'Intro.', detailTitle: 'Detail', detail: 'Detail text.', paletteTitle: 'Palette', palette: 'Palette text.' });
  const studies = [{ documentId: study.documentId, colors: ['#111111', '#222222'], en: copy('Brand: logo'), ru: copy('Бренд: логотип') }];
  const populate = { section1: { populate: ['images'] }, section2: { populate: ['image'] }, section3: { populate: ['colorCard'] } };
  await applyProjectCopy(strapi, studies);
  let enStudy = await projects.findOne({ documentId: study.documentId, locale: 'en', populate });
  let ruStudy = await projects.findOne({ documentId: study.documentId, locale: 'ru', populate });
  check('case study: copy, palette and pictures', enStudy?.section1?.projectTitle === 'Brand: logo' && enStudy?.section1?.images?.length === 1 && enStudy?.section2?.image?.id === fileId && enStudy?.section3?.colorCard?.map((c) => c.HexColorCode).join() === '#111111,#222222', JSON.stringify({ t: enStudy?.section1?.projectTitle, i: enStudy?.section1?.images?.length, c: enStudy?.section3?.colorCard?.length }));
  check('case study: ru version with the pictures', ruStudy?.section1?.projectTitle === 'Бренд: логотип' && ruStudy?.section1?.images?.length === 1 && ruStudy?.section2?.image?.id === fileId, ruStudy?.section1?.projectTitle);
  await projects.update({ documentId: study.documentId, locale: 'en', data: { section1: { projectTitle: 'Owner title', text: 'Owner text.', images: [fileId] } } });
  await projects.update({ documentId: study.documentId, locale: 'ru', data: { section1: { projectTitle: 'Свой заголовок', text: 'Свой текст.', images: [fileId] } } });
  await applyProjectCopy(strapi, studies);
  enStudy = await projects.findOne({ documentId: study.documentId, locale: 'en', populate });
  ruStudy = await projects.findOne({ documentId: study.documentId, locale: 'ru', populate });
  check('case study: edited entries are not overwritten', enStudy?.section1?.projectTitle === 'Owner title' && ruStudy?.section1?.projectTitle === 'Свой заголовок', `${enStudy?.section1?.projectTitle} / ${ruStudy?.section1?.projectTitle}`);

  await app.destroy();
  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  fs.rmSync(path.join(appDir, dbFile), { force: true });
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(2);
});
