export type MarqueePoint = readonly [x: number, y: number];

export interface MarqueeTile {
  id: string;
  title: string;
  points: readonly MarqueePoint[];
}

export const MARQUEE_ATLAS = "/home/marquee/reference.v1.webp";
export const ATLAS_WIDTH = 1340;
export const ATLAS_HEIGHT = 523;
export const MARQUEE_TILT = 55 * Math.PI / 180;

// Coordinates are shared by the geometry and atlas UVs, including the interlocking corners.
export const MARQUEE_TILES: readonly MarqueeTile[] = [
  { id: "red-bull", title: "Red Bull", points: [[105, 0], [496, 0], [503, 14], [288, 131], [278, 132]] },
  { id: "cadbury", title: "Cadbury Dairy Milk", points: [[626, 0], [1055, 0], [847, 118], [832, 120]] },
  { id: "street77", title: "Street77", points: [[951, 89], [1109, 0], [1258, 0], [1340, 49], [1340, 90], [1140, 196], [1129, 199]] },
  { id: "apex-pizza", title: "Apex Pizza", points: [[0, 74], [75, 34], [245, 132], [252, 143], [35, 290], [23, 291], [0, 278]] },
  { id: "onebranding", title: "OneBranding", points: [[313, 145], [579, 0], [593, 0], [786, 108], [790, 117], [520, 261], [510, 260]] },
  { id: "dodo-kids", title: "Dodo Kids", points: [[86, 291], [312, 172], [488, 272], [488, 279], [261, 396], [251, 397]] },
  { id: "hilal", title: "Hilal", points: [[726, 172], [798, 130], [828, 144], [842, 145], [928, 101], [939, 101], [1111, 206], [1114, 214], [949, 299], [937, 302], [730, 182]] },
  { id: "makva", title: "Makva", points: [[533, 275], [702, 181], [921, 316], [923, 323], [757, 407], [748, 408], [535, 284]] },
  { id: "cleo", title: "Cleo", points: [[1006, 289], [1340, 103], [1340, 350], [1326, 358], [1269, 333], [1256, 332], [1160, 383], [1146, 382]] },
  { id: "poyqadam", title: "Poyqadam", points: [[0, 332], [59, 297], [269, 420], [94, 523], [0, 523]] },
  { id: "brono", title: "Brono 360", points: [[279, 407], [501, 285], [705, 399], [708, 407], [493, 523], [471, 523]] },
  { id: "street-vibe", title: "Street Vibe Tuning", points: [[770, 430], [985, 308], [1172, 417], [1173, 425], [999, 523], [928, 523]] },
  { id: "merhaba", title: "Merhaba", points: [[505, 523], [723, 402], [839, 470], [840, 482], [770, 523]] },
  { id: "luqman", title: "Luqman", points: [[1038, 490], [1253, 356], [1268, 349], [1340, 389], [1340, 523], [1088, 523]] },
];
