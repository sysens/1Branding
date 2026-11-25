// The site's request form (spec 4.1). Checks the bot traps (empty hidden
// field, at least 3 s to fill, Cloudflare Turnstile when configured, 5
// requests per IP in 15 minutes), creates the lead in "New" with its visit
// history, then tells the owners in Telegram and Meta through the
// Conversions API.
import { z } from "zod";
import type { Touch } from "../../db/schema";
import { normalizePhone, normalizeUsername } from "../../utils/contacts";
import { createLead } from "../../utils/leads";
import { sendCapiLead } from "../../utils/meta-capi";
import { notifyNewLead } from "../../utils/notify";
import { publicClient, readJsonBody } from "../../utils/public-request";
import { allow } from "../../utils/rate-limit";
import { getSecret } from "../../utils/settings";

const short = (max: number) => z.string().trim().max(max);
const touch = z.record(z.string(), z.union([z.string().max(500), z.number()])).nullable().optional();

const schema = z.object({
  name: short(150),
  company: short(200),
  industry: short(40),
  industryOther: short(200).optional(),
  services: z.array(short(40)).max(30).default([]),
  method: z.enum(["phone", "telegram", "whatsapp"]),
  contact: short(60),
  consent: z.literal(true),
  lang: short(8).optional(),
  page: short(500).optional(),
  device: z.enum(["mobile", "tablet", "desktop"]).optional(),
  vid: z.uuid().optional().nullable(),
  first: touch,
  last: touch,
  ids: z.object({ ga: short(100), ym: short(100), fbp: short(200), fbc: short(400) }).partial().optional(),
  code: short(20).optional().nullable(),
  eventId: short(64).optional(),
  meta: z.object({ website: z.string().max(200).optional(), elapsedMs: z.number().optional() }).optional(),
  turnstile: z.string().max(4096).optional(),
});


async function turnstileOk(token: string | undefined, ip: string) {
  const secret = await getSecret("turnstile_secret");
  if (!secret) return true;
  if (!token) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(8_000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    // Cloudflare unreachable: the other traps still stand; a lead is not lost for it.
    return true;
  }
}

export default defineEventHandler(async (event) => {
  // The site reads { error: { message, field } } (frontend/app/composables/useContactForm.ts).
  const fail = (message: string, field?: string, statusCode = 400) => {
    setResponseStatus(event, statusCode);
    return { error: { message, ...(field ? { field } : {}) } };
  };
  const client = publicClient(event);
  if (!allow(`lead:${client.ip}`, 5, 15 * 60_000)) return fail("Слишком много заявок, попробуйте позже", undefined, 429);

  const parsed = schema.safeParse(await readJsonBody(event, 32 * 1024));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return fail("invalid", ["name", "company", "industry", "contact", "consent"].includes(field) ? field : undefined);
  }
  const body = parsed.data;
  // Bot traps: the hidden field filled, or the form sent faster than a person can.
  if (body.meta?.website || (body.meta?.elapsedMs ?? 0) < 3000) return fail("invalid");
  if (body.name.length < 2) return fail("name", "name");
  if (!body.company) return fail("company", "company");
  if (!body.industry) return fail("industry", "industry");
  if (!(await turnstileOk(body.turnstile, client.ip))) return fail("captcha");

  const phone = body.method === "telegram" ? null : normalizePhone(body.contact);
  const telegram = body.method === "telegram" ? normalizeUsername(body.contact) : null;
  if (body.method === "telegram" ? !telegram : !phone) return fail("contact", "contact");

  const { deal } = await createLead({
    origin: "form",
    name: body.name,
    company: body.company,
    industryKey: body.industry,
    industryOther: body.industryOther,
    serviceKeys: body.services,
    method: body.method,
    phone: body.method === "phone" ? phone : null,
    whatsapp: body.method === "whatsapp" ? phone : null,
    telegram,
    visitorId: body.vid ?? null,
    firstTouch: (body.first as Touch | null) ?? null,
    lastTouch: (body.last as Touch | null) ?? null,
    code: body.code ?? null,
    language: body.lang ?? null,
    page: body.page ?? null,
    device: body.device ?? null,
  });

  const siteUrl = String(useRuntimeConfig(event).public.siteUrl || "").replace(/\/$/, "");
  event.waitUntil(notifyNewLead(deal.id).catch((error) => console.error("[lead] telegram", error)));
  if (body.eventId) {
    event.waitUntil(sendCapiLead({
      eventId: body.eventId,
      sourceUrl: `${siteUrl}${body.page ?? ""}`,
      ip: client.ip,
      userAgent: client.userAgent,
      phone,
      name: body.name,
      fbp: body.ids?.fbp,
      fbc: body.ids?.fbc,
      visitorId: body.vid,
    }).catch(() => false));
  }
  return { ok: true };
});
