// Puts the partner logos of the landing's marquee (above "Awwward") into the
// CMS. It runs inside the Strapi app (on Railway: in the Backend container),
// because POST /api/upload only takes the contact form's single attachment
// (src/middlewares/contact-protection.ts). Each logo goes through Strapi's
// upload service with its brand name as alternative text, and the logos, in
// the manifest's order, become LandingPage > section3 > partnersLogo in every
// locale that has a landing page. Editors manage them in the admin afterwards
// (add, remove, replace, reorder); the old list's files stay in the media
// library until someone deletes them there.
//
// Usage, in the app directory:
//   node scripts/import-partner-logos.mjs --source=<folder or URL prefix> --manifest=<file.json> [--dry-run]
// e.g. from a computer with the Railway CLI:
//   railway ssh -s Backend -- "cd /app && node scripts/import-partner-logos.mjs --source=https://onebrandingworld.com/home/partners --manifest=partners.json"
//
// The manifest is a JSON object { "file.webp": "Brand name", ... }: its key
// order is the strip's order. It can also come base64-encoded in
// LOGO_MANIFEST_B64 (handy when the script is piped in over SSH).
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";

const UID = "api::landing-page.landing-page";
const LOCALES = ["en", "ru", "uz"];
const TYPES = { ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".avif": "image/avif" };

const args = process.argv.slice(2);
const option = name => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const dryRun = args.includes("--dry-run");
const source = option("source");
const manifestText = option("manifest")
  ? await readFile(option("manifest"), "utf8")
  : process.env.LOGO_MANIFEST_B64 && Buffer.from(process.env.LOGO_MANIFEST_B64, "base64").toString("utf8");
if (!source || !manifestText) {
  console.error("Usage: node scripts/import-partner-logos.mjs --source=<folder or URL prefix> --manifest=<file.json> [--dry-run]");
  process.exit(1);
}
const manifest = JSON.parse(manifestText);
const files = Object.keys(manifest);

const read = async name => {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(`${source.replace(/\/+$/, "")}/${encodeURIComponent(name)}`);
    if (!response.ok) throw new Error(`${name}: ${response.status} from ${source}`);
    return Buffer.from(await response.arrayBuffer());
  }
  return readFile(join(resolve(source), name));
};

// Fetch everything first, so a missing file stops the run before anything changes.
const logos = [];
for (const name of files) {
  const type = TYPES[extname(name).toLowerCase()];
  if (!type) throw new Error(`${name}: not an image type this script uploads`);
  logos.push({ name, type, alt: manifest[name], bytes: await read(name) });
}
console.log(`${logos.length} logos from ${source}:`);
logos.forEach((logo, i) => console.log(`  ${i + 1}. ${logo.name} (${logo.bytes.length} B, alt: ${logo.alt})`));

// Boot Strapi the way its own CLI commands do (strapi admin:list-users).
const require = createRequire(join(process.cwd(), "package.json"));
const core = require("@strapi/core");
const app = await core.createStrapi(await core.compileStrapi()).load();
const tmp = await mkdtemp(join(tmpdir(), "partner-logos-"));
try {
  const pages = [];
  for (const locale of LOCALES) {
    const page = await app.documents(UID).findFirst({ locale, populate: { section3: { populate: ["partnersLogo"] } } });
    if (!page) { console.log(`${locale}: no landing page, skipped.`); continue; }
    console.log(`${locale}: ${page.section3?.partnersLogo?.length ?? 0} logos now.`);
    pages.push({ locale, documentId: page.documentId });
  }
  if (dryRun) { console.log("Dry run: nothing uploaded or changed."); }
  else if (!pages.length) { console.error("No landing page to update."); process.exitCode = 1; }
  else {
    const ids = [];
    for (const logo of logos) {
      const filepath = join(tmp, logo.name);
      await writeFile(filepath, logo.bytes);
      const [uploaded] = await app.plugin("upload").service("upload").upload({
        data: { fileInfo: { name: logo.name, alternativeText: logo.alt } },
        files: { filepath, originalFilename: logo.name, mimetype: logo.type, size: (await stat(filepath)).size },
      });
      ids.push(uploaded.id);
      console.log(`uploaded ${logo.name} -> media #${uploaded.id}`);
    }
    for (const { locale, documentId } of pages) {
      await app.documents(UID).update({ documentId, locale, data: { section3: { partnersLogo: ids } } });
      const page = await app.documents(UID).findFirst({ locale, populate: { section3: { populate: ["partnersLogo"] } } });
      const now = page?.section3?.partnersLogo ?? [];
      console.log(`${locale}: section3.partnersLogo now has ${now.length} logos (${now.filter(file => file.alternativeText).length} with alt text).`);
    }
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
  await app.destroy();
}
