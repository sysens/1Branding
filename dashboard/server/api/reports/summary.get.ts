// The main screen (spec 6.1): KPI tiles against the previous period of the
// same length, the end-to-end funnel, leads per day by channel, the month's
// plan and fact, and the short channel table.
import { previousPeriod, type WorkSchedule } from "../../../shared/utils/time";
import { requireUser } from "../../utils/auth";
import { channelReport, countVisits, funnelByStages, kpis, leadsByDay, ltvByChannel, lossReasonsReport, planFact, receivables } from "../../utils/metrics";
import { requestFilters } from "../../utils/report-filters";
import { getSetting } from "../../utils/settings";
import { stageList } from "../../utils/deals";

const FUNNEL_STAGES = ["contacted", "meeting", "proposal", "prepaid", "paid"];

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const f = await requestFilters(event);
  const schedule = await getSetting<WorkSchedule>("workSchedule");
  const targetMinutes = Number(await getSetting<number>("responseTargetMinutes")) || 15;
  const prev = { ...f, ...previousPeriod(f.from, f.to) };
  const stageRows = await stageList();

  const [current, previous, owed, funnel, visits, byDay, plan, channels, losses, ltv] = await Promise.all([
    kpis(f, { schedule, targetMinutes }),
    kpis(prev, { schedule, targetMinutes }),
    receivables(f),
    funnelByStages(f, stageRows),
    countVisits(f),
    leadsByDay(f),
    planFact(f.to, f),
    channelReport(f),
    lossReasonsReport(f),
    ltvByChannel(f.currency),
  ]);

  const ltvAll = ltv.reduce((acc, row) => ({ clients: acc.clients + row.clients, total: acc.total + row.ltv * row.clients }), { clients: 0, total: 0 });
  const averageLtv = ltvAll.clients ? ltvAll.total / ltvAll.clients : null;

  return {
    filters: f,
    previousPeriod: { from: prev.from, to: prev.to },
    kpis: { ...current, receivables: owed.total, ltv: averageLtv, ltvToCac: averageLtv && current.cac ? averageLtv / current.cac : null },
    previous,
    // Spec 6.1: Visits → Leads → Contacted → Meeting → Proposal → Prepayment → Paid in full.
    funnel: [
      { key: "visits", name: "Визиты", count: visits.visits },
      { key: "leads", name: "Лиды", count: current.leads },
      ...funnel.filter((step) => FUNNEL_STAGES.includes(step.key)),
    ],
    leadsByDay: byDay,
    plan,
    channels,
    lossReasons: losses,
  };
});
