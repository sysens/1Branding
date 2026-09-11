import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments, Points, type Uniform } from "three";
import { globePoint } from "./geography";
import { dotMaterial } from "./materials";

export function createWorldSurface(land: Float32Array, outlines: Float32Array, pixelRatio: Uniform<number>): Group {
  const surface = new Group();
  const landGeometry = new BufferGeometry();
  landGeometry.setAttribute("position", new Float32BufferAttribute(land, 3));
  surface.add(new Points(landGeometry, dotMaterial(pixelRatio)));

  const ocean: number[] = [];
  for (let latitude = -85; latitude < 86; latitude += 3) {
    const step = 3 / Math.cos(latitude * Math.PI / 180);
    for (let longitude = -180; longitude < 180; longitude += step)
      ocean.push(...globePoint([latitude, longitude], 1.002));
  }
  const oceanGeometry = new BufferGeometry();
  oceanGeometry.setAttribute("position", new Float32BufferAttribute(ocean, 3));
  surface.add(new Points(oceanGeometry, dotMaterial(pixelRatio, { color: 0x37c557, size: 1.05, opacity: .5 })));

  const outlineGeometry = new BufferGeometry();
  outlineGeometry.setAttribute("position", new Float32BufferAttribute(outlines, 3));
  surface.add(new LineSegments(outlineGeometry, new LineBasicMaterial({
    color: 0x78ff91, transparent: true, opacity: .65, depthWrite: false, blending: AdditiveBlending,
  })));
  return surface;
}
