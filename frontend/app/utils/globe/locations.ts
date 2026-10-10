import type { Coordinate } from "./geography";

export interface GlobeLocation {
  name: string;
  coordinate: Coordinate;
  priority: number;
}
export const LOCATIONS: readonly GlobeLocation[] = [
  { name: "Turkey", coordinate: [41, 29], priority: 2 },
  { name: "Russia", coordinate: [55.75, 37.62], priority: 1 },
  { name: "USA", coordinate: [38.9, -77], priority: 1 },
  { name: "Kazakhstan", coordinate: [51.17, 71.43], priority: 3 },
  { name: "Uzbekistan", coordinate: [41.31, 69.28], priority: 2 },
  { name: "Egypt", coordinate: [26.8, 30.8], priority: 2 },
  { name: "Dubai", coordinate: [25.2, 55.27], priority: 3 },
  { name: "United Kingdom", coordinate: [51.5, -0.12], priority: 3 },
  { name: "Germany", coordinate: [52.52, 13.4], priority: 3 },
  { name: "China", coordinate: [39.9, 116.4], priority: 3 },
  { name: "India", coordinate: [28.6, 77.2], priority: 3 },
  { name: "Brazil", coordinate: [-23.55, -46.63], priority: 3 },
  { name: "Mexico", coordinate: [19.43, -99.13], priority: 3 },
  { name: "South Africa", coordinate: [-26.2, 28.05], priority: 3 },
];

export const ROUTES: readonly (readonly [number, number])[] = [
  [0, 1],
  [0, 2],
  [0, 5],
  [0, 6],
  [0, 4],
  [1, 2],
  [1, 3],
  [3, 4],
  [4, 6],
  [5, 6],
  [7, 2],
  [7, 8],
  [8, 1],
  [8, 0],
  [4, 9],
  [4, 10],
  [6, 10],
  [2, 12],
  [2, 11],
  [11, 7],
  [5, 13],
  [13, 6],
  [11, 12],
];
