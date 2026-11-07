/**
 * The track the intro ribbon on /projects runs along (components/projects/
 * ProjectsStage.vue), after the reference video: one turn of a rising spiral
 * round an upright axis in the middle of the screen. The pictures come in
 * from the bottom left on its far side, small, going right; round its right
 * end they turn towards the camera and come back along its near side, large,
 * right to left; round its left end they turn away again and go right along
 * its far side, higher up, out through the top right. Before and after the
 * turn the track runs straight on (in from the left, out to the right).
 *
 * The pictures follow each other along it like the cars of a train, each
 * turned along the track (so the strip looks bent round the spiral) and
 * leaning with its rise. Distances are in U, the screen's width, but no more
 * than 16:9 of its height (on an ultrawide screen the spiral keeps the video's
 * proportions in the middle); heights in screen heights. Measured on the
 * video: a picture on the near side looks about 3.7 times as big as on the
 * far side (so the spiral's half-depth is 0.58 of the camera's distance), the
 * near side reaches out to about 6% of the screen from either edge, and the
 * eight pictures keep the same spacing all the way round, which needs a
 * deep spiral: the camera 1.4 U away, the spiral 1.6 U deep and 0.72 U wide,
 * so round its ends the pictures run mostly towards or away from the camera
 * and are seen edge on.
 */

export const TRACK_PERSPECTIVE = 1.4;

// The spiral is an ellipse seen from the front: its half-width and its
// half-depth (in U).
const RADIUS_X = 0.36;
const RADIUS_Z = 0.58 * TRACK_PERSPECTIVE;
const TURN = 2 * Math.PI;

// Its height (before perspective, in screen heights; down is +) at the
// start of the turn, a quarter, half, three quarters and the end of it:
// low on the first far side, a little below the middle at the right end,
// about the middle on the near side, higher at the left end, high on the
// second far side (measured on the video).
const HEIGHTS = [0.43, 0.1, -0.01, -0.12, -0.49];

// Catmull-Rom through HEIGHTS (knots a quarter turn apart).
const height = (u: number) => {
  const k = (u / TURN) * 4;
  const i = Math.min(3, Math.max(0, Math.floor(k)));
  const f = k - i;
  const p0 = HEIGHTS[Math.max(0, i - 1)]!;
  const p1 = HEIGHTS[i]!;
  const p2 = HEIGHTS[i + 1]!;
  const p3 = HEIGHTS[Math.min(4, i + 2)]!;
  return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
};

export type TrackPlace = { x: number; y: number; z: number; turn: number; lean: number };

/**
 * The track for a screen: `place(s)` gives the point s (in px along the
 * track, 0 being the start of the turn; negative is the straight way in)
 * as px from the middle of the screen, with the turn about the upright axis
 * and the lean in the picture's own plane, both in radians.
 */
export const createTrack = (vw: number, vh: number) => {
  const unit = Math.min(vw, (16 / 9) * vh);
  // Arc length along the turn, tabulated (px).
  const STEPS = 720;
  const lengths = new Float64Array(STEPS + 1);
  const pointAt = (u: number) => ({ x: RADIUS_X * Math.sin(u) * unit, y: height(u) * vh, z: -RADIUS_Z * Math.cos(u) * unit });
  let previous = pointAt(0);
  for (let i = 1; i <= STEPS; i++) {
    const next = pointAt((i / STEPS) * TURN);
    lengths[i] = lengths[i - 1]! + Math.hypot(next.x - previous.x, next.y - previous.y, next.z - previous.z);
    previous = next;
  }
  const loop = lengths[STEPS]!;
  const start = pointAt(0);
  const end = pointAt(TURN);
  // The straight ways in and out keep the turn's rise at its ends.
  const rise = (u: number) => {
    const a = pointAt(Math.max(0, u - 0.005));
    const b = pointAt(Math.min(TURN, u + 0.005));
    return (b.y - a.y) / Math.hypot(b.x - a.x, b.z - a.z);
  };
  const riseIn = rise(0);
  const riseOut = rise(TURN);

  const place = (s: number): TrackPlace => {
    if (s <= 0) {
      return { x: start.x + s, y: start.y + riseIn * s, z: start.z, turn: 0, lean: Math.atan(riseIn) };
    }
    if (s >= loop) {
      const d = s - loop;
      return { x: end.x + d, y: end.y + riseOut * d, z: end.z, turn: 0, lean: Math.atan(riseOut) };
    }
    // The turn: find u for s in the table.
    let lo = 0;
    let hi = STEPS;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (lengths[mid]! < s) lo = mid;
      else hi = mid;
    }
    const f = (s - lengths[lo]!) / (lengths[hi]! - lengths[lo]! || 1);
    const u = ((lo + f) / STEPS) * TURN;
    const p = pointAt(u);
    return { ...p, turn: -u, lean: Math.atan(rise(u)) };
  };

  return { unit, loop, place };
};

/**
 * Where the head of the train is (px along the track) at a time in the film
 * (s): solved from where the first and the last picture are in the video's
 * frames, every 0.1s (the train being 1.07 U long), and smoothed. It runs at
 * about 2.2-3 U/s: at the far middle at 1.5s, round the right end at about
 * 2.1s, across the near side to 2.5s, round the left end at 2.7s, out at the
 * top right from 3.0s; the last picture leaves at about 3.85s. Values in U,
 * eased between with a monotone cubic.
 */
const HEAD: Array<[number, number]> = [
  [1, -1.045], [1.1, -0.823], [1.2, -0.601], [1.3, -0.379], [1.4, -0.157], [1.5, 0.066], [1.6, 0.297], [1.7, 0.523], [1.8, 0.724],
  [1.9, 0.925], [2, 1.178], [2.1, 1.473], [2.2, 1.768], [2.3, 2.017], [2.4, 2.266], [2.5, 2.52], [2.6, 2.773], [2.7, 3.018],
  [2.8, 3.274], [2.9, 3.56], [3, 3.78], [3.1, 4.0], [3.2, 4.27], [3.3, 4.53], [3.4, 4.743], [3.5, 4.964], [3.6, 5.175],
  [3.7, 5.385], [3.8, 5.596], [3.9, 5.807], [4, 6.017],
];

// Fritsch-Carlson slopes, so the head never runs backwards between the marks.
const slopes = (() => {
  const n = HEAD.length;
  const d = HEAD.slice(1).map(([t, s], i) => (s - HEAD[i]![1]) / (t - HEAD[i]![0]));
  const m = HEAD.map((_, i) => (i === 0 ? d[0]! : i === n - 1 ? d[n - 2]! : d[i - 1]! * d[i]! <= 0 ? 0 : (d[i - 1]! + d[i]!) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i]! / d[i]!;
    const b = m[i + 1]! / d[i]!;
    const h = Math.hypot(a, b);
    if (h > 3) { m[i] = (3 * a * d[i]!) / h; m[i + 1] = (3 * b * d[i]!) / h; }
  }
  return m;
})();

export const headAt = (time: number, unit: number) => {
  const first = HEAD[0]!;
  const last = HEAD[HEAD.length - 1]!;
  if (time <= first[0]) return (first[1] + slopes[0]! * (time - first[0])) * unit;
  if (time >= last[0]) return (last[1] + slopes[slopes.length - 1]! * (time - last[0])) * unit;
  let i = 0;
  while (HEAD[i + 1]![0] < time) i++;
  const [t0, s0] = HEAD[i]!;
  const [t1, s1] = HEAD[i + 1]!;
  const h = t1 - t0;
  const f = (time - t0) / h;
  const f2 = f * f;
  const f3 = f2 * f;
  const s = (2 * f3 - 3 * f2 + 1) * s0 + (f3 - 2 * f2 + f) * h * slopes[i]! + (-2 * f3 + 3 * f2) * s1 + (f3 - f2) * h * slopes[i + 1]!;
  return s * unit;
};
