export const AWARDS_PREVIEW = "/home/awards/stage.v1.webp";
export const STAGE_WIDTH = 1366;
export const STAGE_HEIGHT = 840;
export const CAMERA_DISTANCE = 1800;
export const CARD_WIDTH = 178;
export const CARD_HEIGHT = 100;
export const AWARD_ARTWORK_IDS = [
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "199",
  "21", "22", "23", "24", "25", "26", "27", "28", "29", "299",
  "31", "32", "33", "34", "35", "36", "37", "38", "39", "40",
] as const;

export interface AwardRow {
  index: number;
  direction: "left" | "right";
  width: number;
  height: number;
  gap: number;
  top: number;
  arc: number;
  speed: number;
  count: number;
}

const ROW_WIDTHS = [62, 72, 84, 98, 114, 134, 158] as const;
const ROW_TOPS = [126, 154, 185, 219, 258, 302, 354] as const;
const ROW_DIRECTIONS = ["left", "right", "right", "left", "left", "right", "left"] as const;
export const AWARD_ROWS: readonly AwardRow[] = ROW_WIDTHS.map((width, index) => ({
  index, width, height: width * CARD_HEIGHT / CARD_WIDTH,
  gap: Math.max(12, width * .2), top: ROW_TOPS[index]!,
  direction: ROW_DIRECTIONS[index]!, arc: 3 + index * 6, speed: 5 + index * 1.35,
  count: Math.ceil((STAGE_WIDTH + width * 4) / (width * 1.2)) + 2,
}));

export function getCardPosition(row: AwardRow, column: number, time: number) {
  const step = row.width + row.gap;
  const period = row.count * step;
  const direction = row.direction === "left" ? -1 : 1;
  const offset = column * step + time * row.speed * direction + row.index * step * .43;
  const x = ((offset + period / 2) % period + period) % period - period / 2;
  const normalized = x / (STAGE_WIDTH / 2);
  const y = row.top + row.height / 2 - STAGE_HEIGHT / 2 + row.arc * normalized * normalized;
  const slope = Math.atan(2 * row.arc * x / Math.pow(STAGE_WIDTH / 2, 2));
  return { x, y, slope, yaw: -normalized * .22 };
}

export function artworkSource(row: number, column: number): string {
  const index = (row * 9 + column) % AWARD_ARTWORK_IDS.length;
  return `/home/awards/artwork/${AWARD_ARTWORK_IDS[index]}.webp`;
}
