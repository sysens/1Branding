// Runs every minute (nitro scheduledTasks) and does whatever is due: see server/utils/jobs.ts.
import { runDueJobs } from "../../utils/jobs";
import { databaseReady } from "../../utils/ready";

export default defineTask({
  meta: { name: "ob:tick", description: "Scheduled jobs: ads spend, CBU rates, reminders, digests" },
  async run() {
    await databaseReady();
    const done = await runDueJobs();
    return { result: done };
  },
});
