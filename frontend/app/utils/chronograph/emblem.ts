export const EMBLEM = {
  // Align the vertical stem, not the asymmetric image box, with the hand pivot.
  left: 403 - (126 * 158.5) / 222,
  top: 263,
  width: 126,
  height: 280,
} as const;

export const EMBLEM_STYLE = {
  left: `${(EMBLEM.left / 806) * 100}%`,
  top: `${(EMBLEM.top / 806) * 100}%`,
  width: `${(EMBLEM.width / 806) * 100}%`,
  height: `${(EMBLEM.height / 806) * 100}%`,
};
