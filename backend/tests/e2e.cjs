// End-to-end checks of the hardened API: `bun run build && bun run test:e2e`.
// Boots the built Strapi on a throwaway SQLite database, grants the Public role
// the two contact-form permissions and exercises uploads, submissions, the API
// guard, GraphQL limits, CORS and the orphan clean-up. E2E_PROVIDER=r2 (with
// dummy R2_* variables) checks the R2 URL rules instead.
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

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

const multipart = (filename, mime, bytes, field = 'files') => {
  const boundary = '----e2eboundary' + Math.random().toString(16).slice(2);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
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

  // Production refuses an implicit fallback to the container's disk; this run
  // chose SQLite and its upload provider explicitly, so it started.
  const { durableStorageProblems } = require(path.join(appDir, 'dist/src/utils/storage-guard.js'));
  const prod = { NODE_ENV: 'production' };
  check('storage guard: implicit SQLite refused in production', durableStorageProblems(prod, 'sqlite', undefined).length === 1);
  check('storage guard: explicit SQLite and Postgres allowed', durableStorageProblems({ ...prod, DATABASE_CLIENT: 'sqlite' }, 'sqlite', undefined).length === 0 && durableStorageProblems(prod, 'postgres', undefined).length === 0);
  check('storage guard: incomplete R2 refused in production', durableStorageProblems({ ...prod, UPLOAD_PROVIDER: 'r2' }, 'postgres', undefined).length === 1 && durableStorageProblems({ ...prod, UPLOAD_PROVIDER: 'r2' }, 'postgres', 'aws-s3').length === 0);
  check('storage guard: development never refused', durableStorageProblems({ NODE_ENV: 'development', UPLOAD_PROVIDER: 'r2' }, 'sqlite', undefined).length === 0);

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

  // The website's quick request: a name, what the visitor wants and a phone
  // number only; no message, job title, company, email or file.
  const quick = (overrides = {}) => ({
    data: { TopicInput: 'Logo design', FullName: 'Quick Person', PhoneNumber: '+998 90 123 45 67', ...overrides },
    meta: { website: '', elapsedMs: 5000 },
  });
  r = await submit('203.0.113.20', quick());
  check('quick request (name, topic, phone) accepted', r.status === 200 || r.status === 201, `status ${r.status} ${r.text}`);
  r = await submit('203.0.113.21', quick({ PhoneNumber: 'abc' }));
  check('quick request with a bad phone refused', r.status === 400, `status ${r.status}`);
  r = await submit('203.0.113.22', quick({ FullName: '' }));
  check('quick request without a name refused', r.status === 400, `status ${r.status}`);
  r = await submit('203.0.113.23', quick({ email: 'not-an-email' }));
  check('a given email must still be valid', r.status === 400, `status ${r.status}`);
  r = await submit('203.0.113.24', quick({ requestedServicesMessageFile: 99999 }));
  check('a given file must still be a valid upload', r.status === 400, `status ${r.status}`);

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

  // Multipart temp files: an anonymous body is only read on POST /api/upload,
  // and a refused request leaves nothing in the OS temp dir, whatever the
  // field name. The payload has an odd size so its temp file can be told apart.
  const PAYLOAD_SIZE = 300_007;
  const payload = Buffer.alloc(PAYLOAD_SIZE, 7);
  const leftovers = () => fs.readdirSync(os.tmpdir()).filter((name) => {
    try {
      const stat = fs.statSync(path.join(os.tmpdir(), name));
      return stat.isFile() && stat.size === PAYLOAD_SIZE;
    } catch {
      return false;
    }
  }).length;
  const sendMultipart = (urlPath, field, extraHeaders = {}) => {
    const { body, headers } = multipart('brief.png', 'image/png', payload, field);
    return fetch(BASE + urlPath, { method: 'POST', body, headers: { ...headers, 'X-Forwarded-For': '203.0.113.30', ...extraHeaders } });
  };
  res = await sendMultipart('/api/news-pages', 'files');
  check('anonymous multipart to another route refused before parsing', res.status === 415 && leftovers() === 0, `status ${res.status}, ${leftovers()} left`);
  res = await sendMultipart('/upload', 'other', { Authorization: 'Bearer not-a-token' });
  check('temp file of a refused bearer upload deleted (any field name)', res.status === 401 && leftovers() === 0, `status ${res.status}, ${leftovers()} left`);
  res = await sendMultipart('/api/upload', 'files');
  check('temp file of a refused contact upload deleted', res.status === 400 && leftovers() === 0, `status ${res.status}, ${leftovers()} left`);

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
  const studies = [{ documentId: study.documentId, colors: ['#111111', '#222222'], slug: 'e2e-brand-logo', en: copy('Brand: logo'), ru: copy('Бренд: логотип'), uz: copy('Brend: logotip') }];
  const populate = { section1: { populate: ['images'] }, section2: { populate: ['image'] }, section3: { populate: ['colorCard'] } };
  await applyProjectCopy(strapi, studies);
  let enStudy = await projects.findOne({ documentId: study.documentId, locale: 'en', populate });
  let ruStudy = await projects.findOne({ documentId: study.documentId, locale: 'ru', populate });
  check('case study: copy, palette and pictures', enStudy?.section1?.projectTitle === 'Brand: logo' && enStudy?.section1?.images?.length === 1 && enStudy?.section2?.image?.id === fileId && enStudy?.section3?.colorCard?.map((c) => c.HexColorCode).join() === '#111111,#222222', JSON.stringify({ t: enStudy?.section1?.projectTitle, i: enStudy?.section1?.images?.length, c: enStudy?.section3?.colorCard?.length }));
  check('case study: ru version with the pictures', ruStudy?.section1?.projectTitle === 'Бренд: логотип' && ruStudy?.section1?.images?.length === 1 && ruStudy?.section2?.image?.id === fileId, ruStudy?.section1?.projectTitle);
  const uzStudy = await projects.findOne({ documentId: study.documentId, locale: 'uz', populate });
  check('case study: uz version and one slug for every language', uzStudy?.section1?.projectTitle === 'Brend: logotip' && enStudy?.slug === 'e2e-brand-logo' && ruStudy?.slug === 'e2e-brand-logo', `${uzStudy?.section1?.projectTitle} / ${enStudy?.slug} / ${ruStudy?.slug}`);
  await projects.update({ documentId: study.documentId, locale: 'en', data: { section1: { projectTitle: 'Owner title', text: 'Owner text.', images: [fileId] } } });
  await projects.update({ documentId: study.documentId, locale: 'ru', data: { section1: { projectTitle: 'Свой заголовок', text: 'Свой текст.', images: [fileId] } } });
  await applyProjectCopy(strapi, studies);
  enStudy = await projects.findOne({ documentId: study.documentId, locale: 'en', populate });
  ruStudy = await projects.findOne({ documentId: study.documentId, locale: 'ru', populate });
  check('case study: edited entries are not overwritten', enStudy?.section1?.projectTitle === 'Owner title' && ruStudy?.section1?.projectTitle === 'Свой заголовок', `${enStudy?.section1?.projectTitle} / ${ruStudy?.section1?.projectTitle}`);
  // The brand-system block under the cover: its copy and picture, as the site reads them.
  await projects.update({ documentId: study.documentId, locale: 'en', data: { brandSystem: { statement: '**One** brand.\nOne standard.', title: 'The system', text: 'A brandbook.', image: fileId } } });
  res = await fetch(BASE + '/graphql', { method: 'POST', body: JSON.stringify({ query: `{ projectsPage(documentId: "${study.documentId}", locale: "en") { section1 { projectTitle } brandSystem { statement title text image { url } } } }` }), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token.accessKey } });
  const studyGql = (await res.json().catch(() => ({}))).data?.projectsPage;
  check('case study: brand system block over GraphQL, other sections kept', studyGql?.brandSystem?.statement === '**One** brand.\nOne standard.' && studyGql?.brandSystem?.title === 'The system' && Boolean(studyGql?.brandSystem?.image?.url) && studyGql?.section1?.projectTitle === 'Owner title', JSON.stringify(studyGql).slice(0, 200));

  // Blog articles: the uz locale exists, an article is published once in en, ru
  // and uz with its pictures, and is not created again on the next boot.
  const { applyBlogArticles } = require(path.join(appDir, 'dist/src/utils/blog-articles.js'));
  const uzLocale = await strapi.plugin('i18n').service('locales').findByCode('uz');
  check('blog: uz locale added on boot', Boolean(uzLocale), uzLocale?.name);
  const fileHash = (await strapi.db.query('plugin::upload.file').findOne({ where: { id: fileId } }))?.hash || '';
  const v = (title) => ({ title, text: 'Intro.\n\n## Heading\n\n- item' });
  const testArticle = { key: 'e2e-article', slug: 'e2e-article', image: fileHash.replace(/_[^_]+$/, ''), images: [], en: v('E2E article'), ru: v('Статья E2E'), uz: v('E2E maqola') };
  await applyBlogArticles(strapi, [testArticle]);
  await applyBlogArticles(strapi, [testArticle]);
  const posts = await news.findMany({ locale: 'en', filters: { title: 'E2E article' }, populate: ['image'] });
  const postUz = posts[0] && await news.findOne({ documentId: posts[0].documentId, locale: 'uz' });
  check('blog: article published once in en, ru and uz with its picture', posts.length === 1 && posts[0].image?.id === fileId && postUz?.title === 'E2E maqola' && postUz?.slug === 'e2e-article', JSON.stringify({ n: posts.length, image: posts[0]?.image?.id, uz: postUz?.title }));

  // Package prices: a package still at its old price gets the new one and the
  // price it is crossed out from, once; an edited price and the other packages
  // are left alone; the site reads oldPrice over GraphQL.
  const { applyPriceChanges } = require(path.join(appDir, 'dist/src/utils/plan-prices.js'));
  const priceList = strapi.documents('api::price-category.price-category');
  const branding = await priceList.create({ locale: 'en', data: { title: 'Branding', pricing: [
    { title: 'Launch Base', price: '$1900.00' },
    { title: 'One Pro', price: '$2900.00', description: 'Kept.' },
    { title: 'Global ultimate', price: '$7000.00' },
  ] } });
  const priceChanges = [
    { category: 'branding', plan: 'one pro', from: 2900, price: '$5400.00', oldPrice: '$12750.00' },
    { category: 'Branding', plan: 'Global ultimate', from: 5900, price: '$25000.00' },
  ];
  const changedFirst = await applyPriceChanges(strapi, priceChanges);
  const changedAgain = await applyPriceChanges(strapi, priceChanges);
  const priced = await priceList.findOne({ documentId: branding.documentId, locale: 'en', populate: ['pricing'] });
  const packages = Object.fromEntries((priced?.pricing ?? []).map((item) => [item.title, item]));
  check('prices: a package at its old price gets the new one and the crossed-out price, once', changedFirst === 1 && changedAgain === 0 && packages['One Pro']?.price === '$5400.00' && packages['One Pro']?.oldPrice === '$12750.00' && packages['One Pro']?.description === 'Kept.' && priced?.pricing?.length === 3, JSON.stringify({ changedFirst, changedAgain, pro: packages['One Pro'] }));
  check('prices: an edited price and the other packages are left alone', packages['Global ultimate']?.price === '$7000.00' && !packages['Global ultimate']?.oldPrice && packages['Launch Base']?.price === '$1900.00', JSON.stringify({ top: packages['Global ultimate']?.price, base: packages['Launch Base']?.price }));
  res = await fetch(BASE + '/graphql', { method: 'POST', body: JSON.stringify({ query: '{ priceCategories(locale: "en") { title pricing { title price oldPrice } } }' }), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token.accessKey } });
  const priceGql = (await res.json().catch(() => ({}))).data?.priceCategories?.find((item) => item.title === 'Branding');
  check('prices: oldPrice over GraphQL', priceGql?.pricing?.find((item) => item.title === 'One Pro')?.oldPrice === '$12750.00', JSON.stringify(priceGql).slice(0, 200));

  // A renamed package with a companion: the logo's "Individual" becomes
  // "Standard" and "One Pro" is added with its texts, once; a package an editor
  // removed afterwards is not added back.
  const logoList = await priceList.create({ locale: 'en', data: { title: 'Logo', pricing: [{ title: 'Individual', price: '$900.00', priceText: 'Logo text.', description: 'Logo description.' }] } });
  const logoChanges = [{ category: 'Logo', plan: 'Individual', from: 900, price: '$560.00', title: 'Standard', add: [{ title: 'One Pro', price: '$1500.00' }] }];
  const logoFirst = await applyPriceChanges(strapi, logoChanges);
  const logoAgain = await applyPriceChanges(strapi, logoChanges);
  let logoPriced = await priceList.findOne({ documentId: logoList.documentId, locale: 'en', populate: ['pricing'] });
  const logoPlans = (logoPriced?.pricing ?? []).map((item) => `${item.title} ${item.price}`);
  const logoPro = (logoPriced?.pricing ?? []).find((item) => item.title === 'One Pro');
  check('prices: a package is renamed and its companion added with its texts, once', logoFirst === 2 && logoAgain === 0 && logoPlans.join() === 'Standard $560.00,One Pro $1500.00' && logoPro?.description === 'Logo description.' && logoPro?.priceText === 'Logo text.', JSON.stringify({ logoFirst, logoAgain, logoPlans }));
  await priceList.update({ documentId: logoList.documentId, locale: 'en', data: { pricing: (logoPriced?.pricing ?? []).filter((item) => item.title !== 'One Pro').map((item) => ({ id: item.id, title: item.title, price: item.price })) } });
  await applyPriceChanges(strapi, logoChanges);
  logoPriced = await priceList.findOne({ documentId: logoList.documentId, locale: 'en', populate: ['pricing'] });
  check('prices: a package removed by an editor is not added back', (logoPriced?.pricing ?? []).map((item) => item.title).join() === 'Standard', JSON.stringify((logoPriced?.pricing ?? []).map((item) => item.title)));

  // The real list of changes, on a packaging entry as it was: "Advanced" becomes
  // "Leader product" and "All in one" "One Pro", each with its new price.
  const CHANGES = require(path.join(appDir, 'dist/src/utils/plan-prices.js')).CHANGES.filter((change) => change.category === 'Packaging');
  const packagingList = await priceList.create({ locale: 'en', data: { title: 'Packaging', pricing: [{ title: 'Advanced', price: '$500.00', description: 'Pack.' }, { title: 'All in one', price: '$1900.00', description: 'Pack.' }] } });
  const packagingFirst = await applyPriceChanges(strapi, CHANGES);
  const packagingAgain = await applyPriceChanges(strapi, CHANGES);
  const packagingPriced = await priceList.findOne({ documentId: packagingList.documentId, locale: 'en', populate: ['pricing'] });
  const packagingPlans = (packagingPriced?.pricing ?? []).map((item) => `${item.title} ${item.price}`).join();
  check('prices: packaging gets "Leader product" and "One Pro" at their new prices, once', packagingFirst === 2 && packagingAgain === 0 && packagingPlans === 'Leader product $17200.00,One Pro $1650.00', JSON.stringify({ packagingFirst, packagingAgain, packagingPlans }));

  // A service new to the price list: created on boot, in English, with its
  // packages, once; applying again changes nothing; one an editor removes is
  // not created again.
  const { applyCategoryAdditions, ADDED_CATEGORIES } = require(path.join(appDir, 'dist/src/utils/plan-prices.js'));
  const addedAgain = await applyCategoryAdditions(strapi, ADDED_CATEGORIES);
  const addedServices = [];
  for (const added of ADDED_CATEGORIES) {
    const found = await priceList.findMany({ locale: 'en', filters: { title: added.category }, populate: ['pricing'] });
    addedServices.push(`${added.category}: ${found.length} / ${(found[0]?.pricing ?? []).map((item) => `${item.title} ${item.price}`).join()}`);
  }
  const expectedServices = ADDED_CATEGORIES.map((added) => `${added.category}: 1 / ${added.plans.map((plan) => `${plan.title} ${plan.price}`).join()}`);
  check('prices: the new services are created on boot with their packages, once', addedAgain === 0 && ADDED_CATEGORIES.length === 3 && addedServices.join('|') === expectedServices.join('|'), JSON.stringify({ addedAgain, addedServices }));
  const namingEntries = await priceList.findMany({ locale: 'en', filters: { title: 'Naming' }, populate: ['pricing'] });
  res = await fetch(BASE + '/graphql', { method: 'POST', body: JSON.stringify({ query: '{ priceCategories(locale: "en") { title pricing { title price } } }' }), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token.accessKey } });
  const namingGql = (await res.json().catch(() => ({}))).data?.priceCategories?.find((item) => item.title === 'Naming');
  check('prices: the added service over GraphQL', namingGql?.pricing?.length === 3, JSON.stringify(namingGql));
  await priceList.delete({ documentId: namingEntries[0].documentId });
  const addedAfterRemoval = await applyCategoryAdditions(strapi, ADDED_CATEGORIES);
  check('prices: a service an editor removed is not added back', addedAfterRemoval === 0 && (await priceList.findMany({ locale: 'en', filters: { title: 'Naming' } })).length === 0, String(addedAfterRemoval));

  await app.destroy();
  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  fs.rmSync(path.join(appDir, dbFile), { force: true });
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(2);
});
