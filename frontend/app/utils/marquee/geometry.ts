import { Shape, ShapeGeometry, Vector2 } from "three";
import { ATLAS_HEIGHT, ATLAS_WIDTH, MARQUEE_TILT, type MarqueePoint } from "./layout";

export function toPlane([x, y]: MarqueePoint): Vector2 {
  const dx = x - ATLAS_WIDTH / 2;
  const dy = (y - ATLAS_HEIGHT / 2) / Math.cos(MARQUEE_TILT);
  return new Vector2((dx - dy) / Math.SQRT2, (-dx - dy) / Math.SQRT2);
}

export function createTileShape(points: readonly MarqueePoint[]): Shape {
  const vertices = points.map(toPlane);
  const shape = new Shape();
  vertices.forEach((corner, index) => {
    const previous = vertices[(index + vertices.length - 1) % vertices.length]!;
    const next = vertices[(index + 1) % vertices.length]!;
    const radius = Math.min(7, previous.distanceTo(corner) / 3, next.distanceTo(corner) / 3);
    const before = corner.clone().add(previous.clone().sub(corner).setLength(radius));
    const after = corner.clone().add(next.clone().sub(corner).setLength(radius));
    if (index === 0) shape.moveTo(before.x, before.y);
    else shape.lineTo(before.x, before.y);
    shape.quadraticCurveTo(corner.x, corner.y, after.x, after.y);
  });
  shape.closePath();
  return shape;
}

export function createTileFace(shape: Shape, atlas: boolean): ShapeGeometry {
  const geometry = new ShapeGeometry(shape, 8);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const position = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const u = atlas ? ((x - y) / Math.SQRT2 + ATLAS_WIDTH / 2) / ATLAS_WIDTH : (x - box.min.x) / (box.max.x - box.min.x);
    const v = atlas ? 1 - (-Math.cos(MARQUEE_TILT) * (x + y) / Math.SQRT2 + ATLAS_HEIGHT / 2) / ATLAS_HEIGHT : (y - box.min.y) / (box.max.y - box.min.y);
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  return geometry;
}
