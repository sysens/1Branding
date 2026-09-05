export interface WatchPose { hour: number; minute: number; second: number }
type Keyframe = readonly [time: number, angle: number];
export const LOOP_SECONDS = 8;

// Unwrapped rotations sampled from the reference, including both rapid sweeps.
const hour: readonly Keyframe[] = [
  [0,310], [0.5,314], [1,320], [1.125,336], [1.25,357], [1.375,393],
  [1.5,441], [1.625,514], [1.75,600], [1.875,725], [2,841],
  [2.125,980], [2.25,1049], [2.375,1107], [2.5,1122], [2.75,1135],
  [3,1138], [4,1141], [4.5,1143], [5,1149], [5.25,1160],
  [5.375,1186], [5.5,1211], [5.625,1252], [5.75,1300], [5.875,1364],
  [6,1516], [6.125,1788], [6.25,1987], [6.375,2098], [6.5,2104],
  [7,2108], [7.5,2109], [8,2110],
];
const minute: readonly Keyframe[] = [
  [0,106], [0.25,114], [0.5,129], [0.875,138], [1,159], [1.125,179],
  [1.25,233], [1.375,330], [1.5,463], [1.625,594], [1.75,721],
  [1.875,870], [2,1032], [2.125,1276], [2.25,1481], [2.375,1734],
  [2.5,1887], [2.625,2007], [2.75,2049], [3,2080], [3.375,2107],
  [4,2117], [4.5,2135], [4.75,2157], [5,2191], [5.25,2216],
  [5.375,2238], [5.5,2309], [5.625,2353], [5.75,2417], [5.875,2522],
  [6,2698], [6.125,2967], [6.25,3137], [6.375,3237], [6.5,3253],
  [7,3281], [7.375,3300], [7.625,3339], [7.75,3342], [8,3346],
];
const second: readonly Keyframe[] = [
  [0,152], [1,160], [2,168], [3,176], [4,184], [5,192],
  [5.75,204], [6,310], [6.25,470], [6.5,500], [7,504], [8,512],
];

function sample(keys: readonly Keyframe[], time: number): number {
  const last = keys[keys.length - 1]!;
  const first = keys[0]!;
  const cycle = Math.floor(time / LOOP_SECONDS);
  const local = ((time % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
  let index = keys.findIndex(key => key[0] > local) - 1;
  if (index < 0) index = keys.length - 2;
  const a = keys[index]!, b = keys[index + 1]!;
  const previous = keys[Math.max(0, index - 1)]!;
  const next = keys[Math.min(keys.length - 1, index + 2)]!;
  const span = b[0] - a[0];
  const slope = (b[1] - a[1]) / span;
  const before = index ? (a[1] - previous[1]) / (a[0] - previous[0]) : slope;
  const after = index + 2 < keys.length ? (next[1] - b[1]) / (next[0] - b[0]) : slope;
  // Monotone Hermite interpolation avoids pauses at keys and rotational overshoot.
  const m0 = Math.min(slope * 3, (before + slope) / 2) * span;
  const m1 = Math.min(slope * 3, (after + slope) / 2) * span;
  const t = (local - a[0]) / span, t2 = t * t, t3 = t2 * t;
  return (2*t3-3*t2+1)*a[1] + (t3-2*t2+t)*m0
    + (-2*t3+3*t2)*b[1] + (t3-t2)*m1 + cycle * (last[1] - first[1]);
}

export function poseAt(seconds: number): WatchPose {
  return { hour: sample(hour, seconds), minute: sample(minute, seconds), second: sample(second, seconds) };
}
