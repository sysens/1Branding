// The projects page's opening (after mathildedechiara.com), as a pure function
// of time: where every tile is, how it is turned and bent, and where the
// camera stands, t seconds after the mosaic starts. ProjectsSlider.vue draws
// it with utils/projectsScene.ts and then takes the column over as its own.
//
// The pictures are square tiles (as tall as the slider's slides) on a lattice of five
// columns, the lattice turned 45deg so every square reads as a diamond (each
// picture turned back upright). Its rows glide in along the diagonal, by
// turns from the lower left and the upper right, the middle rows first, each
// tile bending like a flag with its speed, while the camera eases back and the
// whole mosaic bows like the face of a globe. Then the mosaic folds into the
// slider: every tile drops or rises to its place in the column, turns square
// (and widens to the slide's proportions) and slides to the middle, and the
// camera comes back to its resting distance, so the column the slider takes
// over is the mosaic's last frame.

import { HALF_TAN, REST_Z, VIEW_HEIGHT } from "./projectsScene";

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

const COLUMNS = 5;
const COLUMN_ORDER = [2, 1, 3, 0, 4];
const ANGLE = Math.PI / 4;
const COS = Math.cos(ANGLE);
const SIN = Math.sin(ANGLE);

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
  const viewWidth = VIEW_HEIGHT * aspect;
  const columnPitch = side + 0.04 * viewWidth;
  const columnX = Array.from({ length: COLUMNS }, (_, column) => (column - 2) * columnPitch);
  const rows = Math.ceil(count / COLUMNS);

  // The items, nearest the centred one first, dealt to the columns from the
  // middle out.
  const byDistance = Array.from({ length: count }, (_, index) => index).sort(
    (a, b) => Math.min(Math.abs(a - centre), count - Math.abs(a - centre)) - Math.min(Math.abs(b - centre), count - Math.abs(b - centre)),
  );
  const perColumn = Array.from({ length: COLUMNS }, () => 0);
  byDistance.forEach((_, index) => { perColumn[COLUMN_ORDER[index % COLUMNS]!]! += 1; });

  // The lattice's slots, centred.
  const slots: Array<{ column: number; row: number; x: number; y: number }> = [];
  perColumn.forEach((length, column) => {
    for (let row = 0; row < length; row++) slots.push({ column, row, x: columnX[column]!, y: ((rows - 1) / 2 - row) * step });
  });
  const middleX = (Math.min(...slots.map((slot) => slot.x)) + Math.max(...slots.map((slot) => slot.x))) / 2;
  const middleY = (Math.min(...slots.map((slot) => slot.y)) + Math.max(...slots.map((slot) => slot.y))) / 2;
  slots.forEach((slot) => { slot.x -= middleX; slot.y -= middleY; });

  // Top to bottom on screen gets the items in column order, so the fold
  // moves every tile straight to its place.
  const screenX = (slot: { x: number; y: number }) => slot.x * COS - slot.y * SIN;
  const screenY = (slot: { x: number; y: number }) => slot.x * SIN + slot.y * COS;
  slots.sort((a, b) => screenY(b) - screenY(a) || screenX(a) - screenX(b));
  const items = Array.from({ length: count }, (_, index) => index).sort((a, b) => ringOffset(a, centre, count) - ringOffset(b, centre, count));

  // The camera: far enough for the turned mosaic to fit (at least 6.5),
  // starting a tenth closer.
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
  const distance = Math.max(fit, REST_Z * 1.3);
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
  const middleRow = (rows - 1) / 2;

  let assemblyEnd = 0.35 + 2.4;
  const tiles: IntroTile[] = slots.map((slot, index) => {
    const direction = slot.row % 2 === 0 ? 1 : -1;
    const rowStart = 0.1 + 0.22 * Math.floor(Math.abs(slot.row - middleRow));
    const travel = offscreen(cameraAt(rowStart + (COLUMNS - 1) * 0.07)) + reach + side;
    const lag = 0.07 * (direction > 0 ? COLUMNS - 1 - slot.column : slot.column);
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
