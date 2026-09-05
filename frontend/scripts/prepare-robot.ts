import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { decodeScene, encodeScene, findNode, list, record, SplineList } from "./splineDocument";

const source = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";
const root = new URL("../", import.meta.url);
const response = await fetch(source);
if (!response.ok) throw new Error("Robot source returned HTTP " + response.status);
const scene = decodeScene(new Uint8Array(await response.arrayBuffer()));
const document = record(scene);
const objects = list(record(document.scene).objects);
const chest = findNode(objects, "46b3f563-3b31-473b-b869-9612a8f77343");
if (!chest) throw new Error("The source scene no longer has the expected robot chest.");
const logo = new Uint8Array(await readFile(new URL("public/General/logorobo.webp", root)));
const images = record(record(document.shared).images);
const imageId = "one-branding-chest-original";
images[imageId] = { name: "logorobo.webp", data: logo };
const children = list(chest.children);
children.push({
  id: "a483e754-278b-4fd7-96dd-51bdd45ee215",
  fi: Math.max(0, ...children.map((child) => Number(record(child).fi) || 0)) + 1,
  children: [],
  data: {
    name: "One chest emblem",
    type: "Mesh",
    states: new SplineList([]),
    events: new SplineList([]),
    visible: true,
    raycastLock: true,
    position: [-8, 212, 57],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    hiddenMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    side: 0,
    castShadow: false,
    receiveShadow: false,
    geometry: {
      type: "PlaneGeometry",
      width: 45,
      height: 45 * 493 / 222,
      widthSegments: 1,
      heightSegments: 1,
    },
    material: {
      layers: new SplineList([
        { id: "light", fi: 0, data: {
          type: "light", category: "physical", alpha: 0, alphaOverride: 1,
          visible: true, mode: 0, isMask: false,
          roughness: 0.6, metalness: 0, reflectivity: 0,
        } },
        { id: "original-logo", fi: 1, data: {
          type: "texture", alpha: 1, mode: 0, isMask: false, visible: true,
          size: [45, 45 * 493 / 222], blending: 0, axis: "x", side: 2,
          projection: 0, crop: false,
          texture: {
            image: imageId, wrapping: 1001, repeat: [1, 1], offset: [0, 0],
            rotation: 0, minFilter: 1008, magFilter: 1006,
          },
        } },
      ]),
    },
  },
});
const output = new URL("public/home/robot-one.v1.splinecode", root);
await mkdir(new URL("public/home/", root), { recursive: true });
const bytes = encodeScene(scene);
await writeFile(output, bytes);
console.log(fileURLToPath(output), bytes.byteLength + " bytes, original emblem embedded");
