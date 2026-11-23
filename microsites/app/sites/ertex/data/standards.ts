/** The tabs of the style guide; each id has a panel component of its own. */
export const STANDARD_TABS = [
  { id: "logo", label: "Логотип" },
  { id: "color", label: "Цвет" },
  { id: "type", label: "Шрифт" },
  { id: "material", label: "Материалы и фото" },
] as const;

export type StandardTab = (typeof STANDARD_TABS)[number]["id"];

/** Brand colours, with the classes that paint their swatch. */
export const SWATCHES = [
  { name: "Кобальт", hex: "#004DDA", class: "bg-ertex-blue text-white" },
  { name: "Тёмно-синий", hex: "#032D6B", class: "bg-ertex-navy text-white" },
  { name: "Мягкий белый", hex: "#FEFEFE", class: "bg-[#fefefe]" },
];
