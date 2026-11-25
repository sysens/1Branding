// Names the server and the pages agree on: roles, the funnel's built-in
// stages, payment kinds and methods, the tracker's events, currencies.
// The interface is in Russian (the spec, section 6).

export const ROLES = ["owner", "manager", "viewer"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  owner: "Владелец",
  manager: "Менеджер",
  viewer: "Только просмотр",
};

/** The stages the logic relies on (keys); names and extra stages are editable. */
export const CORE_STAGES = ["new", "contacted", "meeting", "proposal", "thinking", "prepaid", "in_work", "paid", "lost"] as const;
export type CoreStage = (typeof CORE_STAGES)[number];

export const PAYMENT_KINDS = ["prepayment", "balance", "extra"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];
export const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = {
  prepayment: "Предоплата",
  balance: "Остаток",
  extra: "Доп. оплата",
};

export const PAYMENT_METHODS = ["cash", "transfer", "card", "payme", "click", "fiverr", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Наличные",
  transfer: "Перевод",
  card: "Карта",
  payme: "Payme",
  click: "Click",
  fiverr: "Fiverr",
  other: "Другое",
};

export const COST_CATEGORIES = ["contractor", "print", "shoot", "other"] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];
export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  contractor: "Подрядчики",
  print: "Печать",
  shoot: "Съёмка",
  other: "Другое",
};

export const DEAL_ORIGINS = ["form", "telegram", "whatsapp", "instagram", "phone", "manual"] as const;
export type DealOrigin = (typeof DEAL_ORIGINS)[number];
export const DEAL_ORIGIN_LABELS: Record<DealOrigin, string> = {
  form: "Форма на сайте",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  instagram: "Instagram Direct",
  phone: "Звонок",
  manual: "Вручную",
};

export const CONTACT_METHODS = ["phone", "telegram", "whatsapp"] as const;
export const CONTACT_METHOD_LABELS: Record<string, string> = { phone: "Телефон", telegram: "Telegram", whatsapp: "WhatsApp" };

export const CURRENCIES = ["USD", "UZS", "EUR", "RUB"] as const;
export const REPORT_CURRENCIES = ["USD", "UZS"] as const;
export type ReportCurrency = (typeof REPORT_CURRENCIES)[number];

/** The tracker's events (spec 3.3): the same names in GA4, Metrika, Pixel and here. */
export const TRACKED_EVENTS = [
  "page_view",
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "scroll_90",
  "engaged_30s",
  "engaged_60s",
  "engaged_180s",
  "view_pricing",
  "view_case",
  "cta_click",
  "form_open",
  "form_start",
  "form_submit",
  "messenger_click",
  "phone_click",
  "lang_switch",
] as const;

export const ATTRIBUTION_MODELS = ["last", "first"] as const;
export type AttributionModel = (typeof ATTRIBUTION_MODELS)[number];
export const ATTRIBUTION_LABELS: Record<AttributionModel, string> = {
  last: "Последний значимый переход",
  first: "Первое касание",
};

export const DEVICE_LABELS: Record<string, string> = { mobile: "Телефон", tablet: "Планшет", desktop: "Компьютер" };
export const LANGUAGE_LABELS: Record<string, string> = { ru: "Русский", en: "English", uz: "Oʻzbekcha" };
