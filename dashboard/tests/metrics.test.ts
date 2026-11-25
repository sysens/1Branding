// Spec 12: "the metrics of section 7 checked by hand on a test set: 10 deals,
// 3 channels, 2 currencies". The expected numbers below were worked out on
// paper from the data; the reports must give exactly them.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import { dealCosts, deals, expenses, fxRates, lossReasons, payments } from "../server/db/schema";
import { channelIdByKey } from "../server/utils/channels";
import { closeDb, initDb, useDb } from "../server/utils/db";
import { moveDeal, stageByKey, stageList } from "../server/utils/deals";
import { createLead } from "../server/utils/leads";
import { channelReport, funnelByStages, kpis, receivables } from "../server/utils/metrics";
import { applyMigrations } from "../server/utils/migrate";
import type { ReportFilters } from "../server/utils/report-sql";
import { seedDefaults } from "../server/utils/seed";
import { DEFAULT_SCHEDULE } from "../shared/utils/time";

const F: ReportFilters = { from: "2026-10-01", to: "2026-10-31", currency: "USD", attribution: "last", channelIds: [], serviceIds: [] };
const ids: Record<string, number> = {};

async function rates(day: string, currency: string) {
  const usd = day >= "2026-10-15" ? 12100 : 12000;
  return { uzsPerUnit: currency === "UZS" ? 1 : usd, uzsPerUsd: usd };
}

async function pay(dealId: number, kind: "prepayment" | "balance", amount: number, currency: string, paidOn: string) {
  await useDb().insert(payments).values({ dealId, kind, amount, currency, ...(await rates(paidOn, currency)), paidOn, method: "transfer" });
}

async function deal(n: number, channel: string, created: string, path: string[], amount?: { value: number; currency: string }, lost?: string) {
  const channelId = await channelIdByKey(channel);
  const { deal: row } = await createLead({ origin: "manual", company: `Client ${n}`, phone: `+99890000000${n}`, forceChannelId: channelId, amount: amount?.value ?? null, currency: amount?.currency ?? "USD" });
  await useDb().update(deals).set({ createdAt: new Date(`${created}T09:00:00+05:00`) }).where(eq(deals.id, row.id));
  for (const key of path) {
    if (key === "pay") continue;
    const stage = await stageByKey(key);
    let lossReasonId: number | undefined;
    if (key === "lost") {
      const [reason] = await useDb().select().from(lossReasons).where(lost === "spam" || lost === "not_target" ? eq(lossReasons.key, lost) : eq(lossReasons.name, "Дорого"));
      lossReasonId = reason!.id;
    }
    await moveDeal(row.id, stage.id, null, { lossReasonId });
  }
  ids[`D${n}`] = row.id;
  return row.id;
}

beforeAll(async () => {
  await initDb({ url: "", pgliteDir: "memory" });
  const dir = join(import.meta.dir, "../server/db/migrations");
  await applyMigrations(readdirSync(dir).filter((f) => f.endsWith(".sql")).map((f) => ({ name: f.replace(/\.sql$/, ""), sql: readFileSync(join(dir, f), "utf8") })));
  await seedDefaults();
  const db = useDb();
  await db.insert(fxRates).values([
    { day: "2026-10-01", currency: "USD", uzsPerUnit: 12000 },
    { day: "2026-10-15", currency: "USD", uzsPerUnit: 12100 },
  ]);

  // D1 meta: paid in full, $500 + 6 050 000 UZS (= $500 at 12 100); a $200 contractor cost.
  const d1 = await deal(1, "meta", "2026-10-03", ["contacted", "meeting", "proposal"], { value: 1000, currency: "USD" });
  await pay(d1, "prepayment", 500, "USD", "2026-10-06");
  await moveDeal(d1, (await stageByKey("prepaid")).id, null);
  await pay(d1, "balance", 6_050_000, "UZS", "2026-10-20");
  await moveDeal(d1, (await stageByKey("paid")).id, null);
  await db.insert(dealCosts).values({ dealId: d1, category: "contractor", amount: 200, currency: "USD", uzsPerUnit: 12100, uzsPerUsd: 12100, spentOn: "2026-10-18" });
  await deal(2, "meta", "2026-10-04", ["contacted", "lost"], undefined, "spam");
  await deal(3, "meta", "2026-10-05", ["contacted", "meeting"]);
  // D4 google: 24 000 000 UZS, half prepaid on 10-10 (= $1000 at 12 000).
  const d4 = await deal(4, "google", "2026-10-07", ["contacted", "meeting", "proposal"], { value: 24_000_000, currency: "UZS" });
  await pay(d4, "prepayment", 12_000_000, "UZS", "2026-10-10");
  await moveDeal(d4, (await stageByKey("prepaid")).id, null);
  await deal(5, "google", "2026-10-08", []);
  await deal(6, "google", "2026-10-09", ["contacted", "lost"], undefined, "expensive");
  // D7 Telegram placement: $2000, $1000 prepaid, now in work.
  const d7 = await deal(7, "tg_posev", "2026-10-11", ["contacted", "meeting", "proposal"], { value: 2000, currency: "USD" });
  await pay(d7, "prepayment", 1000, "USD", "2026-10-12");
  await moveDeal(d7, (await stageByKey("prepaid")).id, null);
  await moveDeal(d7, (await stageByKey("in_work")).id, null);
  await deal(8, "tg_posev", "2026-10-12", ["contacted"]);
  await deal(9, "tg_posev", "2026-10-13", ["lost"], undefined, "not_target");
  await deal(10, "meta", "2026-10-14", ["contacted", "meeting", "proposal"]);

  // Spend: meta $300, google 2 420 000 UZS (= $200 at 12 100), placement $100.
  const spend = async (channel: string, amount: number, currency: string, day: string) =>
    db.insert(expenses).values({ spentOn: day, channelId: (await channelIdByKey(channel))!, amount, currency, ...(await rates(day, currency)), source: "manual" });
  await spend("meta", 300, "USD", "2026-10-05");
  await spend("google", 2_420_000, "UZS", "2026-10-16");
  await spend("tg_posev", 100, "USD", "2026-10-02");
});

afterAll(async () => {
  await closeDb();
});

const close = (value: number | null, expected: number) => expect(value).toBeCloseTo(expected, 2);

describe("section 7 metrics on 10 deals, 3 channels, USD and UZS", () => {
  test("summary KPIs", async () => {
    const k = await kpis(F, { schedule: DEFAULT_SCHEDULE, targetMinutes: 15 });
    expect(k.leads).toBe(10);
    close(k.expenses, 600);
    close(k.cpl, 60);
    close(k.revenue, 3000);
    expect(k.newClients).toBe(3);
    close(k.cac, 200);
    close(k.romi, 400);
    close(k.grossProfit, 2800);
    close(k.roi, (2200 / 600) * 100);
    expect(k.salesCount).toBe(3);
    close(k.salesTotal, 5000);
    close(k.averageCheck, 5000 / 3);
  });

  test("the same KPIs in UZS", async () => {
    const k = await kpis({ ...F, currency: "UZS" }, { schedule: DEFAULT_SCHEDULE, targetMinutes: 15 });
    // 500×12000 + 6 050 000 + 12 000 000 + 1000×12000
    close(k.revenue, 36_050_000);
    // 300×12000 + 2 420 000 + 100×12000
    close(k.expenses, 7_220_000);
  });

  test("receivables in the deal's currency, reported at today's rate", async () => {
    const owed = await receivables(F);
    const byDeal = new Map(owed.items.map((item) => [item.id, item]));
    close(byDeal.get(ids.D4!)!.remaining, 12_000_000);
    close(byDeal.get(ids.D7!)!.remaining, 1000);
    expect(byDeal.has(ids.D1!)).toBe(false);
    close(owed.total, 12_000_000 / 12100 + 1000);
  });

  test("end-to-end funnel by stage history", async () => {
    const steps = Object.fromEntries((await funnelByStages(F, await stageList())).map((s) => [s.key, s.count]));
    expect(steps.contacted).toBe(8);
    expect(steps.meeting).toBe(5);
    expect(steps.proposal).toBe(4);
    expect(steps.prepaid).toBe(3);
    expect(steps.paid).toBe(1);
  });

  test("channels: cohort CAC, ROMI, ROI", async () => {
    const rows = await channelReport(F);
    const by = async (key: string) => {
      const id = await channelIdByKey(key);
      return rows.find((r) => r.key === id)!;
    };
    const meta = await by("meta");
    expect(meta.leads).toBe(4);
    expect(meta.qualified).toBe(3);
    expect(meta.meetings).toBe(3);
    expect(meta.clients).toBe(1);
    close(meta.revenue, 1000);
    close(meta.cac, 300);
    close(meta.romi, (700 / 300) * 100);
    close(meta.roi, (500 / 300) * 100);
    const google = await by("google");
    expect(google.leads).toBe(3);
    expect(google.qualified).toBe(2);
    close(google.expenses, 200);
    close(google.romi, 400);
    const placement = await by("tg_posev");
    expect(placement.qualified).toBe(2);
    close(placement.romi, 900);
    close(placement.averageCheck, 2000);
  });

  test("a payment is required before Prepayment, a reason before Lost", async () => {
    const id = ids.D5!;
    await expect(moveDeal(id, (await stageByKey("prepaid")).id, null)).rejects.toThrow();
    await expect(moveDeal(id, (await stageByKey("lost")).id, null)).rejects.toThrow();
    const [row] = await useDb().execute(sql`SELECT count(*)::int AS n FROM stage_history WHERE deal_id = ${id}`).then((r) => ((r as unknown as { rows?: unknown[] }).rows ?? r) as Array<{ n: number }>);
    expect(row!.n).toBe(1);
  });
});
