// General settings: working hours, response target, idle days, report
// defaults, notification switches, links to Metrika and Looker Studio.
import { z } from "zod";
import { audit } from "../../utils/audit";
import { requireOwner } from "../../utils/auth";
import { setSetting } from "../../utils/settings";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const schema = z.object({
  workSchedule: z.object({ days: z.array(z.number().int().min(1).max(7)).max(7), start: time, end: time }).optional(),
  responseTargetMinutes: z.number().int().min(1).max(1440).optional(),
  staleDays: z.number().int().min(1).max(365).optional(),
  reportCurrency: z.enum(["USD", "UZS"]).optional(),
  attribution: z.enum(["last", "first"]).optional(),
  notifications: z.record(z.string(), z.boolean()).optional(),
  links: z.object({
    metrikaCounterId: z.string().trim().max(20).optional(),
    lookerStudioUrl: z.string().trim().max(500).optional(),
  }).partial().optional(),
});

export default defineEventHandler(async (event) => {
  await requireOwner(event);
  const body = await readValidatedBody(event, schema.parse);
  if (body.links?.lookerStudioUrl && !/^https:\/\/lookerstudio\.google\.com\//.test(body.links.lookerStudioUrl)) {
    throw createError({ statusCode: 422, message: "Ссылка на Looker Studio должна начинаться с https://lookerstudio.google.com/" });
  }
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) await setSetting(key, value);
  }
  await audit(event, "settings.update", "settings", null, { keys: Object.keys(body) });
  return { ok: true };
});
