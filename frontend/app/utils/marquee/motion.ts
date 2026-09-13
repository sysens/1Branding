export function marqueeLane(id: string): number {
  if (["red-bull", "apex-pizza", "dodo-kids", "poyqadam", "brono", "merhaba", "street-vibe"].includes(id)) return 0;
  if (["onebranding", "makva"].includes(id)) return 1;
  return 2;
}

export function marqueeVerticalOffset(lane: number, time: number): number {
  // Opposing lanes share a 15px gap; preserve that space throughout the cycle.
  return Math.sin(time * Math.PI / 4) * 6 * (lane === 1 ? -1 : 1);
}

export function marqueeVerticalDirection(): Vector3 {
  // Project to screen Y while remaining in the board plane, above its backing.
  const component = 1 / (Math.SQRT2 * Math.cos(MARQUEE_TILT));
  return new Vector3(component, component, 0);
}
import { Vector3 } from "three";
import { MARQUEE_TILT } from "./layout";
