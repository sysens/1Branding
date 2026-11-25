// Reference data every page needs: stages, channels, services, industries,
// refusal reasons, users, and the defaults of the reports.
import { asc, eq } from "drizzle-orm";
import { channels, industries, lossReasons, services, stages, users } from "../db/schema";
import { requireUser } from "../utils/auth";
import { useDb } from "../utils/db";
import { getSetting } from "../utils/settings";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const db = useDb();
  const [stageRows, channelRows, serviceRows, industryRows, reasonRows, userRows] = await Promise.all([
    db.select().from(stages).orderBy(asc(stages.position), asc(stages.id)),
    db.select().from(channels).orderBy(asc(channels.position), asc(channels.id)),
    db.select().from(services).orderBy(asc(services.position), asc(services.id)),
    db.select().from(industries).orderBy(asc(industries.position), asc(industries.id)),
    db.select().from(lossReasons).orderBy(asc(lossReasons.position), asc(lossReasons.id)),
    db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(eq(users.isActive, true)).orderBy(asc(users.id)),
  ]);
  const config = useRuntimeConfig(event);
  return {
    stages: stageRows,
    channels: channelRows,
    services: serviceRows,
    industries: industryRows,
    lossReasons: reasonRows,
    users: userRows,
    defaults: {
      reportCurrency: await getSetting<string>("reportCurrency"),
      attribution: await getSetting<string>("attribution"),
      staleDays: await getSetting<number>("staleDays"),
      workSchedule: await getSetting("workSchedule"),
      responseTargetMinutes: await getSetting<number>("responseTargetMinutes"),
      links: await getSetting<Record<string, string>>("links") ?? {},
    },
    siteUrl: config.public.siteUrl,
  };
});
