// Russian number, money and date formats for the CRM mock-up. Dates are read
// in UTC so the server and the browser print the same day.
const numberFormat = new Intl.NumberFormat("ru-RU");
const dayMonthFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });

export const formatNumber = (value: number) => numberFormat.format(value);
export const formatMoney = (value: number) => `$${numberFormat.format(value)}`;
/** "22 ноября" */
export const formatDayMonth = (date: Date) => dayMonthFormat.format(date);
/** "22.11" */
export const formatShortDate = (date: Date) => `${date.getUTCDate()}.${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

/** A YYYY-MM-DD date as noon UTC that day. */
export const parseDay = (day: string) => new Date(`${day}T12:00:00Z`);
