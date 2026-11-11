// Checks the language files against the English one (i18n/locales/en.json):
// the same keys, the same {placeholders}, nothing left in English except the
// brand's own lines (KEEP_ENGLISH), and vue-i18n's special characters escaped.
// The service pages' copy (app/content/services/<key>.<locale>.json) is
// checked the same way. `node scripts/check-i18n.mjs`; exits 1 on a problem.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const LOCALES = ["ru", "uz"];

// Keys whose text is the brand's English wording on every page (slogans,
// wordmarks, package names), plus short labels that are the same word in
// every language. Everything else must be translated.
const KEEP_ENGLISH = [
  /^brand\./,
  /^home\.services\.(one|partner|every|solution|closingFirst|closingLead|closingAccent)$/,
  /^home\.parts\.(headlineFirst|headlineSecond)$/,
  /^home\.stats\.(closing\w+|\w+Value)$/,
  /^home\.awards\.(title|year)$/,
  /^footerNew\.tagline$/,
  /^oneGuarantee\.section2\.title$/,
  /^privacy\.updated$/,
];

const flatten = (value, prefix = "", out = {}) => {
  if (Array.isArray(value)) value.forEach((item, index) => flatten(item, `${prefix}${index}.`, out));
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) flatten(item, `${prefix}${key}.`, out);
  else out[prefix.slice(0, -1)] = value;
  return out;
};

const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",");
// vue-i18n reads "|" as a plural separator and "@" as a linked message: they
// must be written {'|'} and {'@'}.
const unescaped = (text) => /(?<!\{')[|@](?!'\})/.test(String(text).replace(/\{'[|@]'\}/g, ""));

const problems = [];
const compare = (name, source, target, { keep = [], escapes = true } = {}) => {
  const en = flatten(source);
  const other = flatten(target);
  for (const key of Object.keys(en)) {
    if (!(key in other)) problems.push(`${name}: missing ${key}`);
  }
  for (const [key, value] of Object.entries(other)) {
    if (!(key in en)) {
      problems.push(`${name}: extra ${key}`);
      continue;
    }
    if (typeof value !== "string") continue;
    if (placeholders(value) !== placeholders(en[key])) problems.push(`${name}: placeholders differ in ${key}`);
    if (escapes && unescaped(value)) problems.push(`${name}: unescaped | or @ in ${key}`);
    const english = String(en[key]);
    const isLong = english.replace(/\{[^}]*\}/g, "").trim().split(/\s+/).length >= 3;
    if (isLong && value === english && !keep.some((pattern) => pattern.test(key))) {
      problems.push(`${name}: untranslated ${key}`);
    }
  }
};

const en = read("i18n/locales/en.json");
for (const locale of LOCALES) compare(`${locale}.json`, en, read(`i18n/locales/${locale}.json`), { keep: KEEP_ENGLISH });

const servicesDir = "app/content/services";
const files = readdirSync(path.join(root, servicesDir));
for (const file of files.filter((name) => name.endsWith(".en.json"))) {
  const key = file.replace(/\.en\.json$/, "");
  for (const locale of LOCALES) {
    const target = `${key}.${locale}.json`;
    if (!files.includes(target)) problems.push(`${servicesDir}/${target}: missing`);
    // Service copy is plain text, not vue-i18n messages: no escaping rules.
    else compare(`${servicesDir}/${target}`, read(`${servicesDir}/${file}`), read(`${servicesDir}/${target}`), { escapes: false });
  }
}

// The /pricing cards' lists (app/content/pricing/<locale>.json): the same
// services and the same number of items in every language.
const pricingDir = "app/content/pricing";
for (const locale of LOCALES) {
  const target = `${pricingDir}/${locale}.json`;
  try {
    compare(target, read(`${pricingDir}/en.json`), read(target), { escapes: false });
  } catch {
    problems.push(`${target}: missing`);
  }
}

if (problems.length) {
  console.log(problems.join("\n"));
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log("i18n: all languages complete");
