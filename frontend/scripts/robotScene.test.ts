import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { decodeScene, findNode, list, record } from "./splineDocument";
import { BRANDED_ROBOT_SCENE, resolveBrandedRobotScene } from "../app/utils/robotScene";

const root = new URL("../", import.meta.url);
const bytes = await readFile(new URL("public" + BRANDED_ROBOT_SCENE, root));
const document = record(decodeScene(bytes));

describe("branded robot asset", () => {
  test("embeds the original WebP without modifying its pixels", async () => {
    const images = record(record(document.shared).images);
    const image = record(images["one-branding-chest-original"]);
    const original = await readFile(new URL("public/General/logorobo.webp", root));
    expect(image.data).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(image.data as Uint8Array).equals(original)).toBe(true);
  });

  test("parents the textured emblem to the animated chest", () => {
    const objects = list(record(document.scene).objects);
    const body = findNode(objects, "46b3f563-3b31-473b-b869-9612a8f77343");
    expect(body).toBeDefined();
    if (!body) throw new Error("Missing robot chest");
    const emblem = list(body.children).map(record).find(
      node => node.id === "a483e754-278b-4fd7-96dd-51bdd45ee215",
    );
    expect(emblem).toBeDefined();
    if (!emblem) throw new Error("Missing chest emblem");
    const data = record(emblem.data);
    expect(data.name).toBe("One chest emblem");
    const layers = list(record(data.material).layers).map(node => record(record(node).data));
    const texture = layers.find(layer => layer.type === "texture");
    expect(record(texture?.texture).image).toBe("one-branding-chest-original");
  });

  test("uses the bundled default while preserving custom CMS scenes", () => {
    const original = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";
    expect(resolveBrandedRobotScene(original)).toBe(BRANDED_ROBOT_SCENE);
    expect(resolveBrandedRobotScene(original + "?v=2")).toBe(BRANDED_ROBOT_SCENE);
    expect(resolveBrandedRobotScene("/custom/robot.splinecode")).toBe("/custom/robot.splinecode");
  });
});
