// What runs on schedule (Tashkent time), checked every minute by the
// "ob:tick" task. A daily job runs once its time has come and it has not
// run that day yet, so a restart at the wrong minute does not skip it.
//   every minute   "no answer in 15 min" reminders (working hours only)
//   00:20 09:05 18:05  CBU exchange rates
//   03:00          remove expired sessions
//   04:00          ads spend for the last 3 days (Meta, Google, Yandex)
//   04:30          Instagram account statistics
//   10:00          tasks for today; on Mondays also the week's summary
//   19:30          the day's summary
//   hourly (:15)   integrations silent for 24 h → alert
import { and, eq, isNull, sql } from "drizzle-orm";
import { addDays, isWorkingTime, tashkentClock, tashkentDay, workingMsBetween, type WorkSchedule } from "../../shared/utils/time";
import { deals, integrationStatus, jobRuns, stages } from "../db/schema";
import { syncAds } from "./ads";
import { purgeExpiredSessions } from "./auth";
import { useDb } from "./db";
import { fetchCbuRates } from "./fx";
import { syncInstagramStats } from "./instagram";
import { INTEGRATION_LABELS, markIntegration } from "./integrations";
import { kpis, planFact } from "./metrics";
import { money, notifyDailyTasks, notifyDaySummary, notifyIntegrationFailure, notifyUnanswered, notifyWeekSummary } from "./notify";
import type { ReportFilters } from "./report-sql";
import { getSecret, getSetting } from "./settings";

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Claims a run key; false when it already ran. */
async function claim(key: string): Promise<boolean> {
  const inserted = await useDb().insert(jobRuns).values({ key }).onConflictDoNothing().returning();
  return inserted.length > 0;
}

async function daily(name: string, at: string, now: number, job: () => Promise<unknown>, done: string[]) {
  const clock = tashkentClock(now);
  if (clock.minutes < minutes(at)) return;
  if (!(await claim(`${name}:${clock.day}`))) return;
  try {
    await job();
    done.push(name);
  } catch (error) {
    console.error(`[jobs] ${name}`, error);
  }
}

async function checkUnanswered(now: number) {
  const schedule = await getSetting<WorkSchedule>("workSchedule");
  if (!isWorkingTime(now, schedule)) return;
  const target = (Number(await getSetting<number>("responseTargetMinutes")) || 15) * 60_000;
  const db = useDb();
  const waiting = await db.select({ id: deals.id, title: deals.title, contactName: deals.contactName, createdAt: deals.createdAt })
    .from(deals).innerJoin(stages, eq(stages.id, deals.stageId))
    .where(and(eq(stages.key, "new"), isNull(deals.firstResponseAt), isNull(deals.unansweredNotifiedAt), sql`${deals.createdAt} > now() - interval '7 days'`));
  const late = waiting
    .map((deal) => ({ ...deal, ms: workingMsBetween(deal.createdAt, now, schedule) }))
    .filter((deal) => deal.ms >= target);
  if (!late.length) return;
  for (const deal of late) await db.update(deals).set({ unansweredNotifiedAt: new Date() }).where(eq(deals.id, deal.id));
  await notifyUnanswered(late.map((deal) => ({ id: deal.id, name: deal.contactName || deal.title || "Без имени", minutes: deal.ms / 60_000 })));
}

async function weekSummary(now: number) {
  const today = tashkentDay(now);
  // The week that just ended (Mon–Sun) against the one before it.
  const lastMonday = addDays(today, -7);
  const lastSunday = addDays(today, -1);
  const currency = (await getSetting<string>("reportCurrency")) === "UZS" ? "UZS" : "USD";
  const base: ReportFilters = { from: lastMonday, to: lastSunday, currency, attribution: "last", channelIds: [], serviceIds: [] };
  const before: ReportFilters = { ...base, from: addDays(lastMonday, -7), to: addDays(lastSunday, -7) };
  const schedule = await getSetting<WorkSchedule>("workSchedule");
  const [a, b, plan] = await Promise.all([
    kpis(base, { schedule, targetMinutes: 15 }),
    kpis(before, { schedule, targetMinutes: 15 }),
    planFact(today, base),
  ]);
  const delta = (x: number | null, y: number | null) => (x === null || y === null || !y ? "" : ` (${x >= y ? "+" : ""}${Math.round(((x - y) / Math.abs(y)) * 100)}%)`);
  const fmt = (value: number | null) => money(value, currency);
  await notifyWeekSummary([
    `${lastMonday.split("-").reverse().join(".")} – ${lastSunday.split("-").reverse().join(".")}`,
    `Лиды: <b>${a.leads}</b>${delta(a.leads, b.leads)}`,
    `Расходы: ${fmt(a.expenses)}${delta(a.expenses, b.expenses)} · CPL: ${fmt(a.cpl)}`,
    `Новые клиенты: ${a.newClients}${delta(a.newClients, b.newClients)} · CAC: ${fmt(a.cac)}`,
    `Выручка: <b>${fmt(a.revenue)}</b>${delta(a.revenue, b.revenue)}`,
    `ROMI: ${a.romi === null ? "—" : `${Math.round(a.romi)}%`}`,
    "",
    `План месяца: лиды ${plan.leadsFact} из ${plan.leadsPlan ?? "—"}, выручка ${fmt(plan.revenueFact)} из ${plan.revenuePlan === null ? "—" : fmt(plan.revenuePlan)}`,
  ]);
}

async function checkIntegrations(now: number) {
  const db = useDb();
  const statuses = await db.select().from(integrationStatus);
  const configured: Record<string, boolean> = {
    tracker: true,
    cbu: true,
    meta: !!(await getSecret("meta_access_token")),
    google: !!(await getSecret("google_ads_refresh_token")),
    yandex: !!(await getSecret("yandex_direct_token")),
    instagram: !!(await getSecret("instagram_access_token")),
  };
  const silent = statuses.filter((s) => configured[s.provider]
    && !s.alertedAt
    && (!s.lastSuccessAt || now - +s.lastSuccessAt > 24 * 60 * 60 * 1000)
    && (s.lastAttemptAt || s.lastSuccessAt));
  if (!silent.length) return;
  for (const s of silent) await db.update(integrationStatus).set({ alertedAt: new Date() }).where(eq(integrationStatus.provider, s.provider));
  await notifyIntegrationFailure(silent.map((s) => ({
    label: INTEGRATION_LABELS[s.provider] ?? s.provider,
    since: s.lastSuccessAt ? new Date(+s.lastSuccessAt + 5 * 3600_000).toISOString().slice(0, 16).replace("T", " ") : "начала работы",
    error: s.lastError,
  })));
}

async function refreshRates() {
  try {
    await fetchCbuRates();
    await markIntegration("cbu", { ok: true });
  } catch (error) {
    await markIntegration("cbu", { ok: false, error: (error as Error).message });
  }
}

export async function runDueJobs(now = Date.now()): Promise<string[]> {
  const done: string[] = [];
  const clock = tashkentClock(now);
  try {
    await checkUnanswered(now);
  } catch (error) {
    console.error("[jobs] unanswered", error);
  }
  await daily("cbu-night", "00:20", now, refreshRates, done);
  await daily("cbu-morning", "09:05", now, refreshRates, done);
  await daily("cbu-evening", "18:05", now, refreshRates, done);
  await daily("sessions", "03:00", now, purgeExpiredSessions, done);
  await daily("ads", "04:00", now, () => syncAds(3), done);
  await daily("instagram", "04:30", now, syncInstagramStats, done);
  await daily("tasks", "10:00", now, notifyDailyTasks, done);
  if (clock.weekday === 1) await daily("week", "10:00", now, () => weekSummary(now), done);
  await daily("day", "19:30", now, () => notifyDaySummary(clock.day), done);
  if (clock.minutes % 60 === 15) {
    try {
      await checkIntegrations(now);
    } catch (error) {
      console.error("[jobs] integrations", error);
    }
  }
  return done;
}

