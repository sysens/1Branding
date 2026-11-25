// Everything the Settings page shows (spec 6.9). Secrets are reported only
// as "set / not set", never their values.
import { asc, desc } from "drizzle-orm";
import { campaigns, integrationStatus, plans, settings, telegramConnections, users } from "../../db/schema";
import { requireUser } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { DEFAULT_SETTINGS } from "../../utils/seed";
import { secretPresence } from "../../utils/settings";

export default defineEventHandler(async (event) => {
  const me = await requireUser(event);
  const db = useDb();
  const [settingRows, planRows, campaignRows, userRows, statuses, connections] = await Promise.all([
    db.select().from(settings),
    db.select().from(plans).orderBy(desc(plans.month)).limit(24),
    db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(500),
    db.select({
      id: users.id, email: users.email, name: users.name, role: users.role, isActive: users.isActive,
      totpEnabled: users.totpEnabled, telegramId: users.telegramId, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
    }).from(users).orderBy(asc(users.id)),
    db.select().from(integrationStatus),
    db.select().from(telegramConnections),
  ]);
  const general = { ...DEFAULT_SETTINGS, ...Object.fromEntries(settingRows.map((row) => [row.key, row.value])) };
  const config = useRuntimeConfig(event);
  return {
    general,
    plans: planRows,
    campaigns: campaignRows,
    users: me.role === "owner" ? userRows : userRows.map(({ email: _email, ...rest }) => rest),
    secrets: me.role === "owner" ? await secretPresence() : null,
    integrations: statuses,
    telegramConnections: connections,
    webhookUrls: {
      telegram: `${String(config.public.appUrl).replace(/\/$/, "")}/api/telegram/webhook`,
      instagram: `${String(config.public.appUrl).replace(/\/$/, "")}/api/instagram/webhook`,
    },
  };
});
