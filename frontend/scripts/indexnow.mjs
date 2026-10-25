// Tells Bing, Yandex and the other IndexNow engines that the site's pages
// changed, so they recrawl them without waiting for their own schedule:
// `node scripts/indexnow.mjs [https://onebrandingworld.com]` after a deploy that
// changed copy. It submits every URL of the live sitemap. The key proves the
// site is ours: the engines fetch it from public/<key>.txt.
const ORIGIN = (process.argv[2] || process.env.SITE_URL || "https://onebrandingworld.com").replace(/\/+$/, "");
const KEY = "bb79c82870984511f35173ca867838d7";

const keyFile = await fetch(`${ORIGIN}/${KEY}.txt`);
if (!keyFile.ok || (await keyFile.text()).trim() !== KEY) {
  console.error(`The key file ${ORIGIN}/${KEY}.txt is not live yet (status ${keyFile.status}); deploy first.`);
  process.exit(1);
}

const sitemap = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!urls.length) {
  console.error("The sitemap has no URLs.");
  process.exit(1);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(ORIGIN).host, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList: urls }),
});
// 200 and 202 both mean accepted (202: the key is still being checked).
console.log(`IndexNow: ${response.status} for ${urls.length} URLs`);
process.exit(response.ok ? 0 : 1);
