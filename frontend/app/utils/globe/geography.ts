export type Coordinate = readonly [latitude: number, longitude: number];
export type Point3 = readonly [x: number, y: number, z: number];

export function globePoint(
  [latitude, longitude]: Coordinate,
  radius = 1,
): Point3 {
  const lat = (latitude * Math.PI) / 180;
  const lon = (longitude * Math.PI) / 180;
  return [
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon),
  ];
}

export function arcPoint(
  from: Coordinate,
  to: Coordinate,
  progress: number,
): Point3 {
  const a = globePoint(from),
    b = globePoint(to);
  const angle = Math.acos(
    Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])),
  );
  const sin = Math.sin(angle);
  const t = Math.max(0, Math.min(1, progress));
  const start = sin > 0.0001 ? Math.sin((1 - t) * angle) / sin : 1 - t;
  const end = sin > 0.0001 ? Math.sin(t * angle) / sin : t;
  const radius = 1.008 + Math.sin(t * Math.PI) * Math.min(0.32, angle * 0.19);
  return [
    (a[0] * start + b[0] * end) * radius,
    (a[1] * start + b[1] * end) * radius,
    (a[2] * start + b[2] * end) * radius,
  ];
}
