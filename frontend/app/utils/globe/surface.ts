import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments, Points, Vector3, type Uniform } from "three";
import { globePoint } from "./geography";
import { dotMaterial } from "./materials";

export function createWorldSurface(land: Float32Array, outlines: Float32Array, pixelRatio: Uniform<number>): Group {
  const surface = new Group();
  const landGeometry = new BufferGeometry();
  landGeometry.setAttribute("position", new Float32BufferAttribute(land, 3));
  surface.add(new Points(landGeometry, dotMaterial(pixelRatio)));
  surface.add(createLandLights(land, pixelRatio));

  const ocean: number[] = [];
  for (let latitude = -85; latitude < 86; latitude += 3) {
    const step = 3 / Math.cos(latitude * Math.PI / 180);
    for (let longitude = -180; longitude < 180; longitude += step)
      ocean.push(...globePoint([latitude, longitude], 1.002));
  }
  const oceanGeometry = new BufferGeometry();
  oceanGeometry.setAttribute("position", new Float32BufferAttribute(ocean, 3));
  surface.add(new Points(oceanGeometry, dotMaterial(pixelRatio, { color: 0x80ffa0, size: 1.7, opacity: .85 })));

  const outlineGeometry = new BufferGeometry();
  outlineGeometry.setAttribute("position", new Float32BufferAttribute(outlines, 3));
  surface.add(new LineSegments(outlineGeometry, new LineBasicMaterial({
    color: 0xa4ffb3, transparent: true, opacity: .75, depthWrite: false, blending: AdditiveBlending,
  })));
  return surface;
}

function createLandLights(land: Float32Array, pixelRatio: Uniform<number>): Points {
  const positions: number[] = [];
  const normal = new Vector3(), tangent = new Vector3(), bitangent = new Vector3(), point = new Vector3();
  let seed = 701;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  // Sub-pixel surface detail stays attached to the existing land samples during rotation.
  for (let i = 0; i < land.length; i += 3) {
    normal.set(land[i]!, land[i + 1]!, land[i + 2]!).normalize();
    tangent.set(0, Math.abs(normal.y) > .95 ? 0 : 1, Math.abs(normal.y) > .95 ? 1 : 0).cross(normal).normalize();
    bitangent.crossVectors(normal, tangent);
    for (let light = 0; light < 3; light++) {
      point.copy(normal).addScaledVector(tangent, (random() - .5) * .018).addScaledVector(bitangent, (random() - .5) * .018).normalize().multiplyScalar(1.0035);
      positions.push(point.x, point.y, point.z);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return new Points(geometry, dotMaterial(pixelRatio, { color: 0xaaffbd, size: 1.3, opacity: .9 }));
}
