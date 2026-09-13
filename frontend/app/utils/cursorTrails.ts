// Spring-chain motion adapted from Inspira UI's MIT-licensed Sleek Line Cursor.
export interface CursorPoint { x: number; y: number; vx: number; vy: number }
export interface CursorTrail { spring: number; nodes: CursorPoint[] }
export const createCursorTrails = (x: number, y: number): CursorTrail[] =>
  Array.from({ length: 20 }, (_, index) => ({
    spring: .4 + index / 20 * .025,
    nodes: Array.from({ length: 50 }, () => ({ x, y, vx: 0, vy: 0 })),
  }));

export function stepCursorTrails(trails: CursorTrail[], x: number, y: number): void {
  for (const trail of trails) {
    let spring = trail.spring;
    trail.nodes.forEach((node, index) => {
      const leader = trail.nodes[index - 1];
      node.vx += ((leader?.x ?? x) - node.x) * spring + (leader?.vx ?? 0) * .25;
      node.vy += ((leader?.y ?? y) - node.y) * spring + (leader?.vy ?? 0) * .25;
      node.vx *= .5; node.vy *= .5;
      node.x += node.vx; node.y += node.vy;
      spring *= .98;
    });
  }
}

export function drawCursorTrails(context: CanvasRenderingContext2D, trails: CursorTrail[], opacity: number): void {
  context.strokeStyle = `rgba(0,205,58,${.08 * opacity})`;
  context.lineWidth = 1;
  for (const { nodes } of trails) {
    const first = nodes[0];
    if (!first) continue;
    context.beginPath(); context.moveTo(first.x, first.y);
    for (let i = 1; i < nodes.length - 1; i++) {
      const node = nodes[i]!, next = nodes[i + 1]!;
      context.quadraticCurveTo(node.x, node.y, (node.x + next.x) / 2, (node.y + next.y) / 2);
    }
    context.stroke();
  }
}
