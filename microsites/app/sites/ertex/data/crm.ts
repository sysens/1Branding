// Demo data for the CRM mock-up. Every figure is made up for the presentation.

export const STAGES = ["inquiry", "samples", "approval", "production"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_NAMES: Record<Stage, string> = {
  inquiry: "Запрос",
  samples: "Образцы",
  approval: "Согласование",
  production: "В работе",
};

export const NEXT_STEPS: Record<Stage, string> = {
  inquiry: "Уточнить плотность, состав и оттенок. Подготовить комплект образцов для клиента.",
  samples: "Получить отзыв по образцам и подтвердить материал для расчёта партии.",
  approval: "Согласовать объём, стоимость и срок готовности. Передать подтверждённый заказ в работу.",
  production: "Проверить готовность партии и согласовать дату отгрузки с клиентом.",
};

/** The button in a deal's card: moves it to the next stage. */
export const ADVANCE_LABELS: Record<Stage, string> = {
  inquiry: "Образцы отправлены →",
  samples: "Перейти к согласованию →",
  approval: "Подтвердить заказ →",
  production: "Заказ передан в работу",
};

export type CrmView = "all" | "samples" | "orders";

export const VIEWS: { id: CrmView; label: string; title: string; stage: Stage | null }[] = [
  { id: "all", label: "Обзор", title: "Обзор продаж", stage: null },
  { id: "samples", label: "Образцы", title: "Образцы у клиентов", stage: "samples" },
  { id: "orders", label: "Заказы", title: "Заказы в работе", stage: "production" },
];

export const PERIODS = [
  { days: 30, label: "Последние 30 дней" },
  { days: 7, label: "Последние 7 дней" },
] as const;

/** The demo's "today": every period ends here. */
export const PERIOD_END = new Date("2026-11-22T23:59:59Z");

export interface Deal {
  id: string;
  product: string;
  client: string;
  /** YYYY-MM-DD */
  created: string;
  /** Kilograms */
  qty: number;
  /** USD */
  amount: number;
  stage: Stage;
  /** The fabric's colour, for the swatch in the table. */
  color: string;
}

export const DEALS: Deal[] = [
  { id: "ET-2048", product: "Футер · 3-нитка", client: "Швейное производство · Ташкент", created: "2026-11-22", qty: 1200, amount: 8400, stage: "approval", color: "#304d79" },
  { id: "ET-2047", product: "Кулирная гладь", client: "Производитель одежды · Самарканд", created: "2026-11-21", qty: 2500, amount: 13750, stage: "production", color: "#d6d2c8" },
  { id: "ET-2046", product: "Рибана · компакт", client: "Трикотажное ателье · Бухара", created: "2026-11-20", qty: 600, amount: 3900, stage: "samples", color: "#5c79a5" },
  { id: "ET-2045", product: "Интерлок · пенье", client: "Производство детской одежды · Андижан", created: "2026-11-19", qty: 1800, amount: 11700, stage: "inquiry", color: "#a7b1c1" },
  { id: "ET-2044", product: "Пике · хлопок", client: "Производитель униформы · Ташкент", created: "2026-11-17", qty: 900, amount: 5850, stage: "samples", color: "#2952ab" },
  { id: "ET-2043", product: "Футер · 2-нитка", client: "Швейная фабрика · Фергана", created: "2026-11-16", qty: 1600, amount: 9600, stage: "production", color: "#29364a" },
  { id: "ET-2042", product: "Кулирная гладь", client: "Бренд базовой одежды · Ташкент", created: "2026-11-13", qty: 800, amount: 4400, stage: "approval", color: "#c5c7c7" },
  { id: "ET-2041", product: "Рибана · эластик", client: "Текстильная мастерская · Наманган", created: "2026-11-10", qty: 450, amount: 3150, stage: "samples", color: "#465b7b" },
  { id: "ET-2040", product: "Интерлок · пенье", client: "Швейное производство · Ташкент", created: "2026-11-06", qty: 2100, amount: 13650, stage: "production", color: "#e2ded4" },
  { id: "ET-2039", product: "Футер · 3-нитка", client: "Производитель спортивной одежды · Джизак", created: "2026-11-03", qty: 1400, amount: 9800, stage: "approval", color: "#496284" },
  { id: "ET-2038", product: "Пике · хлопок", client: "Производитель одежды · Карши", created: "2026-10-29", qty: 700, amount: 4550, stage: "samples", color: "#6c788a" },
  { id: "ET-2037", product: "Кулирная гладь", client: "Швейная мастерская · Ургенч", created: "2026-10-25", qty: 1100, amount: 6050, stage: "production", color: "#233960" },
];
