// Time in Tashkent (UTC+5 all year: Uzbekistan has no daylight saving time)
// and the working-hours arithmetic behind "first response speed" and the
// "no answer in 15 minutes" reminder. Pure functions: the server, the pages
// and the tests share them.

export const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type WorkSchedule = {
  /** ISO weekdays: 1 = Monday … 7 = Sunday. */
  days: number[];
  /** "HH:MM", Tashkent time. */
  start: string;
  end: string;
};

export const DEFAULT_SCHEDULE: WorkSchedule = { days: [1, 2, 3, 4, 5], start: "10:00", end: "19:00" };

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** "YYYY-MM-DD" of the moment in Tashkent. */
export function tashkentDay(at: Date | number = Date.now()): string {
  return new Date(+at + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Minutes since Tashkent midnight and the ISO weekday of the moment. */
export function tashkentClock(at: Date | number = Date.now()) {
  const local = new Date(+at + TASHKENT_OFFSET_MS);
  const weekday = local.getUTCDay() === 0 ? 7 : local.getUTCDay();
  return { minutes: local.getUTCHours() * 60 + local.getUTCMinutes(), weekday, day: local.toISOString().slice(0, 10) };
}

/** The UTC moment of a Tashkent wall-clock time on a day ("YYYY-MM-DD", minutes). */
export function tashkentMoment(day: string, minutesOfDay = 0): number {
  return Date.parse(`${day}T00:00:00Z`) - TASHKENT_OFFSET_MS + minutesOfDay * 60_000;
}

export function addDays(day: string, count: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + count * DAY_MS).toISOString().slice(0, 10);
}

export function isWorkingTime(at: Date | number, schedule: WorkSchedule = DEFAULT_SCHEDULE): boolean {
  const clock = tashkentClock(at);
  return schedule.days.includes(clock.weekday) && clock.minutes >= minutes(schedule.start) && clock.minutes < minutes(schedule.end);
}

/** Milliseconds of working time between two moments (0 when `to` is not after `from`). */
export function workingMsBetween(from: Date | number, to: Date | number, schedule: WorkSchedule = DEFAULT_SCHEDULE): number {
  const start = +from;
  const end = +to;
  if (!(end > start)) return 0;
  const open = minutes(schedule.start);
  const close = minutes(schedule.end);
  if (close <= open) return 0;
  let total = 0;
  let day = tashkentDay(start);
  const lastDay = tashkentDay(end);
  // A guard against absurd ranges (years): working time is capped at ~3 years of days.
  for (let i = 0; i < 1200; i += 1) {
    const weekday = tashkentClock(tashkentMoment(day, 12 * 60)).weekday;
    if (schedule.days.includes(weekday)) {
      const windowStart = Math.max(start, tashkentMoment(day, open));
      const windowEnd = Math.min(end, tashkentMoment(day, close));
      if (windowEnd > windowStart) total += windowEnd - windowStart;
    }
    if (day === lastDay) break;
    day = addDays(day, 1);
  }
  return total;
}

/** Monday of the moment's week in Tashkent ("YYYY-MM-DD"). */
export function weekStart(day: string): string {
  const weekday = tashkentClock(tashkentMoment(day, 12 * 60)).weekday;
  return addDays(day, 1 - weekday);
}

export function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function monthEnd(day: string): string {
  const [y, m] = day.split("-").map(Number);
  return new Date(Date.UTC(y!, m!, 0)).toISOString().slice(0, 10);
}

/** Inclusive number of days in a range of "YYYY-MM-DD" days. */
export function daysInRange(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
}

/** The period of the same length right before [from, to]. */
export function previousPeriod(from: string, to: string) {
  const length = daysInRange(from, to);
  return { from: addDays(from, -length), to: addDays(from, -1) };
}
