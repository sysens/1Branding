import { expect, test } from "bun:test";
import { createIntro, oneCells } from "../app/utils/projectsIntro";

// The projects page's opening lays its tiles out as a "1" of diamonds.

const key = (cell: { x: number; y: number }) => `${cell.x},${cell.y}`;

test("the \"1\" has exactly one lattice cell per tile, all distinct", () => {
  for (let n = 30; n <= 72; n++) {
    const cells = oneCells(n);
    expect(cells.length).toBe(n);
    expect(new Set(cells.map(key)).size).toBe(n);
    // Every cell is on the turned lattice: x and y of the same parity.
    for (const cell of cells) expect(((cell.x - cell.y) % 2 + 2) % 2).toBe(0);
  }
});

test("the \"1\" is one piece: every tile shares an edge with another", () => {
  for (const n of [30, 35, 36, 40, 50, 60]) {
    const cells = oneCells(n);
    const taken = new Set(cells.map(key));
    // Diamonds share an edge with their diagonal neighbours.
    const neighbours = (cell: { x: number; y: number }) => [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([dx, dy]) => `${cell.x + dx!},${cell.y + dy!}`).filter((name) => taken.has(name));
    const seen = new Set([key(cells[0]!)]);
    const queue = [cells[0]!];
    while (queue.length) {
      const cell = queue.shift()!;
      for (const name of neighbours(cell)) {
        if (seen.has(name)) continue;
        seen.add(name);
        const [x, y] = name.split(",").map(Number);
        queue.push({ x: x!, y: y! });
      }
    }
    expect(seen.size).toBe(n);
  }
});

test("the \"1\" stands taller than it is wide, its flag on the left", () => {
  for (const n of [34, 35, 36, 40, 50, 61, 72]) {
    const cells = oneCells(n);
    const xs = cells.map((cell) => cell.x);
    const ys = cells.map((cell) => cell.y);
    const width = Math.max(...xs) - Math.min(...xs) + 2;
    const height = Math.max(...ys) - Math.min(...ys) + 2;
    expect(height / width).toBeGreaterThan(1.25);
    expect(height / width).toBeLessThan(2.8);
    // The flag reaches further left than the base.
    const top = cells.filter((cell) => cell.y <= 3);
    const bottom = cells.filter((cell) => cell.y >= Math.max(...ys) - 1);
    expect(Math.min(...top.map((cell) => cell.x))).toBeLessThan(Math.min(...bottom.map((cell) => cell.x)));
  }
});

test("the opening keeps one tile per item and folds into the column", () => {
  const slide = { width: 2, height: 1.125, pitch: 1.4 };
  const intro = createIntro(35, 0, 16 / 9, slide);
  expect(intro.tiles.length).toBe(35);
  expect(new Set(intro.tiles.map((tile) => tile.item)).size).toBe(35);
  const last = intro.frame(intro.end);
  expect(last.done).toBe(true);
  for (const tile of last.tiles) {
    expect(tile.x).toBeCloseTo(0, 6);
    expect(tile.y).toBeCloseTo(-tile.offset * slide.pitch, 6);
    expect(tile.rotation).toBeCloseTo(0, 6);
  }
});
