import type { Coordinate } from "./geography";

export interface GlobeLocation {
  name: string;
  coordinate: Coordinate;
  priority: number;
}
export const LOCATIONS: readonly GlobeLocation[] = [
  { name: "UK", coordinate: [51.5, -0.12], priority: 2 },
  { name: "Germany", coordinate: [52.52, 13.4], priority: 2 },
  { name: "Spain", coordinate: [40.4, -3.7], priority: 3 },
  { name: "Italy", coordinate: [41.9, 12.5], priority: 3 },
  { name: "Turkey", coordinate: [41, 29], priority: 2 },
  { name: "Israel", coordinate: [32.1, 34.8], priority: 4 },
  { name: "Egypt", coordinate: [26.8, 30.8], priority: 2 },
  { name: "Saudi Arabia", coordinate: [23.9, 45.1], priority: 3 },
  { name: "Kenya", coordinate: [-1.3, 36.8], priority: 3 },
  { name: "South Africa", coordinate: [-30.6, 24], priority: 1 },
  { name: "USA", coordinate: [38.9, -77], priority: 1 },
  { name: "Canada", coordinate: [45.4, -75.7], priority: 2 },
  { name: "Mexico", coordinate: [19.4, -99.1], priority: 2 },
  { name: "Brazil", coordinate: [-15.8, -47.9], priority: 1 },
  { name: "Argentina", coordinate: [-34.6, -58.4], priority: 2 },
  { name: "China", coordinate: [35.9, 104.2], priority: 1 },
  { name: "Hong Kong", coordinate: [22.3, 114.2], priority: 1 },
  { name: "Japan", coordinate: [35.7, 139.7], priority: 2 },
  { name: "Thailand", coordinate: [13.8, 100.5], priority: 3 },
  { name: "Singapore", coordinate: [1.3, 103.8], priority: 1 },
  { name: "Australia", coordinate: [-25.3, 133.8], priority: 1 },
  { name: "New Zealand", coordinate: [-41.3, 174.8], priority: 2 },
];

export const ROUTES: readonly (readonly [number, number])[] = [
  [0, 16],
  [2, 6],
  [1, 4],
  [6, 9],
  [4, 19],
  [16, 20],
  [19, 20],
  [10, 0],
  [13, 10],
  [17, 16],
];
