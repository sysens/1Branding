export function closestScrollPanel(centers: readonly number[], viewportCenter: number): number {
  let active = 0;
  let closest = Number.POSITIVE_INFINITY;
  centers.forEach((center, index) => {
    const distance = Math.abs(center - viewportCenter);
    if (distance < closest) { closest = distance; active = index; }
  });
  return active;
}
