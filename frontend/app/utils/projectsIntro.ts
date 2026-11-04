// The projects page's opening (after mathildedechiara.com), as a pure function
// of time: where every tile is, how it is turned and bent, and where the
// camera stands, t seconds after the mosaic starts. ProjectsSlider.vue draws
// it with utils/projectsScene.ts and then takes the column over as its own.
//
// The pictures are square tiles (as tall as the slider's slides) on a square
// lattice turned 45deg, so every square reads as a diamond (each picture
// turned back upright), laid out as a big "1", OneBranding's numeral (see
// `oneCells`). The lattice's rows glide in along the diagonal, by turns from
// the lower left and the upper right, the middle rows first, each
// tile bending like a flag with its speed, while the camera eases back and the
// whole mosaic bows like the face of a globe. Then the mosaic folds into the
// slider: every tile drops or rises to its place in the column, turns square
// (and widens to the slide's proportions) and slides to the middle, and the
// camera comes back to its resting distance, so the column the slider takes
// over is the mosaic's last frame.

import { HALF_TAN, REST_Z } from "./projectsScene";

/** The slider's slide in world units: its size and the column's step. */
export type SlideSize = { width: number; height: number; pitch: number };

export const easeInOut3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut3 = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// cubic-bezier(0.22, 1, 0.36, 1): the rows' glide, a long, soft landing.
const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  const curve = (a: number, b: number, s: number) => 3 * a * s * (1 - s) * (1 - s) + 3 * b * s * s * (1 - s) + s * s * s;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let low = 0;
    let high = 1;
    for (let step = 0; step < 24; step++) {
      const mid = (low + high) / 2;
      if (curve(x1, x2, mid) < x) low = mid;
      else high = mid;
    }
    return curve(y1, y2, (low + high) / 2);
  };
};
const glide = bezier(0.22, 1, 0.36, 1);
const slope = (u: number) => {
  const a = Math.max(u - 0.005, 0);
  const b = Math.min(u + 0.005, 1);
  return (glide(b) - glide(a)) / (b - a);
};
const GLIDE_REFERENCE_SLOPE = slope(0.12);

const ANGLE = Math.PI / 4;
const COS = Math.cos(ANGLE);
const SIN = Math.sin(ANGLE);
// A row's tiles set off 70 ms apart, the leading one first (at most 4 steps).
const LAG = 0.07;
const MAX_LAG = 4 * LAG;

/**
 * The "1" in diamonds, for n tiles: cells (x, y) of the turned lattice as seen
 * on screen, y downward, where x ≡ y (mod 2) and diagonal neighbours share an
 * edge. A stem w tiles a row wide (a zigzag 2w cells across), a flag of w
 * lines running down-left from the stem's top, each a tile shorter than the
 * one above, and a base: the last two rows a tile wider each side. The stem
 * is as tall as the count needs; a tile or two left over cap its top. Up to
 * 60 tiles the stem is two tiles wide, beyond that three, so the numeral
 * stays upright (from 34 tiles up, 1.3 to 2.7 times as tall as it is wide).
 */
export const oneCells = (n: number) => {
  const w = n <= 60 ? 2 : 3;
  const flagLength = w + 1;
  const flag = Array.from({ length: w }, (_, line) => flagLength - line).reduce((sum, length) => sum + length, 0);
  const rows = Math.max(Math.floor((n - flag - 4) / w), 2);
  const rest = Math.max(n - flag - 4 - rows * w, 0);
  const cells: Array<{ x: number; y: number }> = [];
  for (let k = 0; k < rest; k++) cells.push({ x: 1 + 2 * k, y: -1 });
  for (let y = 0; y < rows; y++) {
    const p = y % 2;
    for (let k = 0; k < w; k++) cells.push({ x: p + 2 * k, y });
    if (y >= rows - 2) cells.push({ x: p - 2, y }, { x: p + 2 * w, y });
  }
  for (let line = 0; line < w; line++) {
    for (let k = 1; k <= flagLength - line; k++) cells.push({ x: -k, y: k + 2 * line });
  }
  return cells.slice(0, n);
};

export type IntroTile = {
  /** Index into the opening's list (which may repeat the projects). */
  item: number;
  /** Signed distance from the centred item, round the list. */
  offset: number;
  column: number;
  row: number;
  localX: number;
  localY: number;
  startX: number;
  direction: number;
  start: number;
  duration: number;
};

export type IntroFrame = {
  cameraZ: number;
  tiles: Array<{ item: number; offset: number; x: number; y: number; width: number; height: number; rotation: number; uvAngle: number; distortion: number; wind: number; windX: number; sphere: number; sphereDepth: number }>;
  done: boolean;
};

export type Intro = {
  tiles: IntroTile[];
  foldStart: number;
  end: number;
  frame: (t: number) => IntroFrame;
};

const ringOffset = (index: number, centre: number, count: number) => {
  let offset = (((index - centre) % count) + count) % count;
  if (offset > count / 2) offset -= count;
  return offset;
};

export const createIntro = (count: number, centre: number, aspect: number, slide: SlideSize): Intro => {
  // The tiles are squares as tall as a slide, the rows a slide's step apart.
  const side = slide.height;
  const step = slide.pitch;

  // The "1"'s cells as slots of the turned lattice, one slide's step apart
  // along both of its axes: a cell (x, y) on screen is the lattice's column
  // (x - y) / 2 and row -(x + y) / 2. The numeral is centred on the screen.
  const screenX = (slot: { x: number; y: number }) => slot.x * COS - slot.y * SIN;
  const screenY = (slot: { x: number; y: number }) => slot.x * SIN + slot.y * COS;
  const slots = oneCells(count).map((cell) => {
    const column = (cell.x - cell.y) / 2;
    const row = -(cell.x + cell.y) / 2;
    return { column, row, x: column * step, y: row * step };
  });
  const middleX = (Math.min(...slots.map(screenX)) + Math.max(...slots.map(screenX))) / 2;
  const middleY = (Math.min(...slots.map(screenY)) + Math.max(...slots.map(screenY))) / 2;
  slots.forEach((slot) => {
    slot.x -= middleX * COS + middleY * SIN;
    slot.y -= middleY * COS - middleX * SIN;
  });

  // Top to bottom on screen gets the items in column order, so the fold
  // moves every tile straight to its place.
  slots.sort((a, b) => screenY(b) - screenY(a) || screenX(a) - screenX(b));
  const items = Array.from({ length: count }, (_, index) => index).sort((a, b) => ringOffset(a, centre, count) - ringOffset(b, centre, count));

  // The camera: far enough for the turned mosaic to fit with a little room
  // (and at least 6.5), starting a tenth closer.
  let fit = 0;
  for (const slot of slots) {
    for (const dx of [-0.5, 0.5]) {
      for (const dy of [-0.5, 0.5]) {
        const px = slot.x + dx * side;
        const py = slot.y + dy * side;
        fit = Math.max(fit, Math.abs(px * COS - py * SIN) / (HALF_TAN * aspect), Math.abs(px * SIN + py * COS) / HALF_TAN);
      }
    }
  }
  const distance = Math.max(fit * 1.06, REST_Z * 1.3);
  const cameraAt = (t: number) => 0.9 * distance + 0.1 * distance * easeInOut3(clamp01((t - 0.35) / 2.4));

  // The globe: the view's corner falls back 0.3 of the distance.
  const depth = distance;
  const corner = distance * HALF_TAN * Math.hypot(aspect, 1);
  const fall = 0.3 * distance;
  const sphere0 = fall / (1 - fall / depth) / (corner * corner);

  // How far off screen a row starts, along its axis, when the camera is at z.
  const offscreen = (z: number) => {
    const height = 2 * HALF_TAN * z;
    return ((z + depth) / z) * ((height * aspect) / 2 * COS + (height / 2) * SIN);
  };
  const reach = Math.max(...slots.map((slot) => Math.abs(slot.x))) + side / 2;
  const rowIndex = slots.map((slot) => slot.row);
  const middleRow = (Math.min(...rowIndex) + Math.max(...rowIndex)) / 2;
  // The middle rows first, the outermost ones about half a second later
  // (0.22 s a row apart at most), however many rows the numeral has.
  const furthestRow = Math.max(1, Math.floor(Math.max(...rowIndex.map((row) => Math.abs(row - middleRow)))));
  const rowGap = Math.min(0.22, 0.5 / furthestRow);

  let assemblyEnd = 0.35 + 2.4;
  const tiles: IntroTile[] = slots.map((slot, index) => {
    const direction = ((slot.row % 2) + 2) % 2 === 0 ? 1 : -1;
    const rowStart = 0.1 + rowGap * Math.floor(Math.abs(slot.row - middleRow));
    const travel = offscreen(cameraAt(rowStart + MAX_LAG)) + reach + side;
    // The row's leading tile (furthest along its way) sets off first.
    const ahead = slots.filter((other) => other.row === slot.row && (direction > 0 ? other.column > slot.column : other.column < slot.column)).length;
    const lag = Math.min(ahead * LAG, MAX_LAG);
    assemblyEnd = Math.max(assemblyEnd, rowStart + 1.8);
    return {
      item: items[index]!,
      offset: ringOffset(items[index]!, centre, count),
      column: slot.column,
      row: slot.row,
      localX: slot.x,
      localY: slot.y,
      startX: slot.x - direction * travel,
      direction,
      start: rowStart + lag,
      duration: 1.8 - lag,
    };
  });

  const foldStart = assemblyEnd + 0.1;
  const furthest = Math.max(...tiles.map((tile) => Math.abs(tile.offset)), 1);
  const spread = Math.min(0.05, 0.6 / furthest);
  const foldLength = 0.8 + furthest * spread + 0.9;
  const dollyStart = foldStart + foldLength - 1.65;
  const end = Math.max(foldStart + foldLength, dollyStart + 1.6);

  const frame = (t: number): IntroFrame => {
    if (t < foldStart) {
      // The mosaic: tiles in the turned lattice, gliding in.
      return {
        cameraZ: cameraAt(t),
        done: false,
        tiles: tiles.map((tile) => {
          const u = clamp01((t - tile.start) / tile.duration);
          const flying = t >= tile.start && u < 1;
          const x = tile.startX + (tile.localX - tile.startX) * glide(u);
          return {
            item: tile.item,
            offset: tile.offset,
            x: x * COS - tile.localY * SIN,
            y: x * SIN + tile.localY * COS,
            width: side,
            height: side,
            rotation: ANGLE,
            uvAngle: ANGLE,
            distortion: 0,
            wind: flying ? 0.9 * Math.min(slope(u) / GLIDE_REFERENCE_SLOPE, 1) : 0,
            windX: tile.direction,
            sphere: sphere0,
            sphereDepth: depth,
          };
        }),
      };
    }
    // The fold into the column.
    const time = t - foldStart;
    const main = clamp01(time);
    const eased = easeInOut3(main);
    const unturn = easeInOut3(clamp01((main - 0.3) / 0.7));
    const cameraZ = t < dollyStart ? distance : distance + (REST_Z - distance) * easeInOut3(clamp01((t - dollyStart) / 1.6));
    return {
      cameraZ,
      done: t >= end,
      tiles: tiles.map((tile) => {
        const fromX = tile.localX * COS - tile.localY * SIN;
        const fromY = tile.localX * SIN + tile.localY * COS;
        const collapse = clamp01((time - 0.8 - Math.abs(tile.offset) * spread) / 0.9);
        const rotation = ANGLE * (1 - unturn);
        return {
          item: tile.item,
          offset: tile.offset,
          x: fromX * (1 - easeInOut3(collapse)),
          y: fromY + (-tile.offset * step - fromY) * eased,
          width: side + (slide.width - side) * eased,
          height: side,
          rotation,
          uvAngle: rotation,
          distortion: 0.8 * (0.5 * Math.sin(Math.PI * main) + 0.5 * Math.sin(Math.PI * collapse)),
          wind: 0,
          windX: 0,
          sphere: sphere0 * (1 - eased),
          sphereDepth: depth,
        };
      }),
    };
  };

  return { tiles, foldStart, end, frame };
};
