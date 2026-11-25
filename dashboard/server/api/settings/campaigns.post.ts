// The UTM link builder (spec 5, 6.9): the campaign is saved, so spend typed
// in or loaded from an ads API attaches to it, and the tagged link is returned.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { campaigns, channels } from "../../db/schema";
import { audit } from "../../utils/audit";
import { requireEditor } from "../../utils/auth";
import { useDb } from "../../utils/db";

const tag = z.string().trim().regex(/^[a-z0-9_.-]{1,120}$/i, "Только латиница, цифры, _ . -");
const schema = z.object({
  channelId: z.number().int().positive(),
  utmCampaign: tag,
  utmSource: tag,
  utmMedium: tag,
  utmContent: z.string().trim().max(120).optional().nullable(),
  name: z.string().trim().min(1).max(200),
  placement: z.string().trim().max(200).optional().nullable(),
  path: z.string().trim().max(300).default("/"),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireEditor(event);
  const body = await readValidatedBody(event, schema.parse);
  const db = useDb();
  const [channel] = await db.select().from(channels).where(eq(channels.id, body.channelId));
  if (!channel) throw createError({ statusCode: 422, message: "Нет такого канала" });
  const [existing] = await db.select().from(campaigns).where(eq(campaigns.utmCampaign, body.utmCampaign));
  const campaign = existing
    ? (await db.update(campaigns).set({ name: body.name, placement: body.placement ?? existing.placement, channelId: body.channelId })
      .where(eq(campaigns.id, existing.id)).returning())[0]
    : (await db.insert(campaigns).values({
      channelId: body.channelId,
      utmCampaign: body.utmCampaign,
      name: body.name,
      placement: body.placement || null,
      startsOn: body.startsOn ?? null,
      endsOn: body.endsOn ?? null,
    }).returning())[0];

  const site = String(useRuntimeConfig(event).public.siteUrl).replace(/\/$/, "");
  const url = new URL(body.path.startsWith("/") ? body.path : `/${body.path}`, site);
  url.searchParams.set("utm_source", body.utmSource);
  url.searchParams.set("utm_medium", body.utmMedium);
  url.searchParams.set("utm_campaign", body.utmCampaign);
  if (body.utmContent) url.searchParams.set("utm_content", body.utmContent);
  await audit(event, "campaign.save", "campaign", campaign!.id, { by: user.id });
  return { campaign, url: url.toString() };
});
