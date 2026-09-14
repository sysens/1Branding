import { Vector3 } from "three";

export function marqueeLane(id: string): number {
  if (["poyqadam", "apex-pizza", "dodo-kids", "brono", "merhaba"].includes(id)) return 0;
  if (["red-bull", "onebranding", "makva", "street-vibe", "hilal", "cleo", "luqman"].includes(id)) return 1;
  return 2;
}

export function marqueeVerticalOffset(lane: number, time: number): number {
  const duration = lane % 2 === 0 ? 10 : 15;
  const direction = lane % 2 === 0 ? 1 : -1;
  return direction * 50 * (1 - Math.cos(Math.PI * time / duration));
}

export function marqueeVerticalDirection(): Vector3 {
  // Animate the column's local Y, exactly as the rotated React grid does.
  return new Vector3(0, 1, 0);
}
