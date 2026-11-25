// Channels and ads (spec 6.4): one row per channel, each opening into its
// campaigns (bloggers, placements). Cohort numbers, see utils/metrics.ts.
import { asc } from "drizzle-orm";
import { campaigns } from "../../db/schema";
import { requireUser } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { channelReport, ltvByChannel } from "../../utils/metrics";
import { requestFilters } from "../../utils/report-filters";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const f = await requestFilters(event);
  const [byChannel, byCampaign, campaignRows, ltv] = await Promise.all([
    channelReport(f, "channel"),
    channelReport(f, "campaign"),
    useDb().select().from(campaigns).orderBy(asc(campaigns.name)),
    ltvByChannel(f.currency),
  ]);
  const campaignChannel = new Map(campaignRows.map((c) => [c.id, c]));
  return {
    filters: f,
    channels: byChannel.map((row) => {
      const ltvRow = ltv.find((item) => item.channel_id === row.key);
      return {
        ...row,
        ltv: ltvRow?.ltv ?? null,
        ltvToCac: ltvRow?.ltv && row.cac ? ltvRow.ltv / row.cac : null,
        campaigns: byCampaign
          .filter((c) => c.key !== null && campaignChannel.get(c.key)?.channelId === row.key)
          .map((c) => ({ ...c, name: campaignChannel.get(c.key!)?.name ?? "—", placement: campaignChannel.get(c.key!)?.placement ?? null })),
      };
    }),
  };
});
