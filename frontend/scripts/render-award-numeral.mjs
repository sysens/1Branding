// Renders the Awwwards "1" of the landing (AwardVision.vue) to a transparent
// picture, public/home/award/numeral.webp, from its three.js model
// (app/utils/award/numeralModel.js) in headless Chrome.
//
// The numeral never moves, so the page shows this picture instead of building
// the model in the visitor's browser: that took the main thread for about a
// second (shader compiling, the studio's environment map) right as the
// sections above it animated, and showed nothing where WebGL is off.
//
// Usage: node scripts/render-award-numeral.mjs   (then scripts/optimize-images.mjs)
// Chrome: the CHROME environment variable, or the usual install path.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "public", "home", "award", "numeral.webp");
// The frame the model was fitted to (800 x 960), drawn at twice its size.
const WIDTH = 800;
const HEIGHT = 960;
const SCALE = 2;
// The look of the landing's numeral: chrome with satin brand-green bands.
const OPTIONS = {
  tone: "neutral",
  // The bands that were satin black are a satin brand-green metal (#0cc23a,
  // linear RGB), reflecting the chrome's studio; the recessed channel stays a
  // deep green.
  blackColor: [0.0037, 0.5395, 0.0423],
  blackMetal: 1,
  satinMix: 0,
  blackRough: 0.3,
  blackF90: 1,
  rimSheen: 0,
  bandOcclDiffuse: 0.8,
  preserveDrawingBuffer: true,
};

const CHROME = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((path) => path && existsSync(path));
if (!CHROME) throw new Error("Chrome not found: set CHROME to its path.");

const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
<canvas id="c" style="width:${WIDTH}px;height:${HEIGHT}px"></canvas>
<script type="module">
import * as THREE from "/node_modules/three/build/three.module.js";
import { createNumeral } from "/app/utils/award/numeralModel.js";
const canvas = document.getElementById("c");
const model = createNumeral(canvas, THREE, ${JSON.stringify(OPTIONS)});
model.resize(${WIDTH}, ${HEIGHT}, ${SCALE});
model.render();
window.picture = canvas.toDataURL("image/png");
</script>`;

const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".html": "text/html" };
const server = createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  if (path === "/") {
    response.writeHead(200, { "content-type": "text/html" }).end(PAGE);
    return;
  }
  try {
    const file = resolve(ROOT, `.${path}`);
    if (!file.startsWith(ROOT)) throw new Error("outside");
    const body = await readFile(file);
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const port = 9300 + Math.floor(Math.random() * 600);
const profile = mkdtempSync(join(tmpdir(), "numeral-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--no-first-run", "about:blank",
], { stdio: "ignore" });

try {
  let socketUrl;
  for (let i = 0; i < 150 && !socketUrl; i++) {
    await sleep(200);
    try {
      socketUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((target) => target.type === "page")?.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
  }
  if (!socketUrl) throw new Error("Chrome did not start.");
  const socket = new WebSocket(socketUrl);
  await new Promise((done) => socket.addEventListener("open", done, { once: true }));
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  });
  const send = (method, params = {}) => new Promise((done) => {
    pending.set(++id, done);
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send("Page.navigate", { url: origin });
  let picture;
  for (let i = 0; i < 120 && !picture; i++) {
    await sleep(500);
    picture = (await send("Runtime.evaluate", { expression: "window.picture", returnByValue: true })).result?.result?.value;
  }
  if (!picture) throw new Error("The numeral did not render.");
  await mkdir(join(ROOT, "public", "home", "award"), { recursive: true });
  const png = Buffer.from(picture.split(",")[1], "base64");
  await sharp(png).webp({ lossless: true, effort: 6 }).toFile(OUT);
  const { width, height } = await sharp(OUT).metadata();
  console.log(`Rendered ${OUT} (${width} x ${height}).`);
  socket.close();
} finally {
  chrome.kill();
  server.close();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* still locked */ }
}
