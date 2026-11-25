// A deal typed in by hand (spec 6.2): Fiverr orders, calls, recommendations,
// Direct. A contact code (OB-xxxx) brings in the visitor's source and visits;
// without one, the channel picked in the form is used.
import { z } from "zod";
import { DEAL_ORIGINS } from "../../../shared/utils/constants";
import { audit } from "../../utils/audit";
import { requireEditor } from "../../utils/auth";
import { createLead, findContactCode } from "../../utils/leads";

const schema = z.object({
  name: z.string().trim().max(150).optional(),
  company: z.string().trim().max(200).optional(),
  clientId: z.number().int().positive().optional().nullable(),
  phone: z.string().trim().max(40).optional(),
  telegram: z.string().trim().max(60).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  instagram: z.string().trim().max(80).optional(),
  industryKey: z.string().max(40).optional().nullable(),
  serviceIds: z.array(z.number().int().positive()).max(30).default([]),
  amount: z.number().nonnegative().max(1e12).optional().nullable(),
  currency: z.string().length(3).default("USD"),
  channelId: z.number().int().positive().optional().nullable(),
  contactCode: z.string().trim().max(20).optional().nullable(),
  origin: z.enum(DEAL_ORIGINS).default("manual"),
  ownerId: z.number().int().positive().optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const user = await requireEditor(event);
  const body = await readValidatedBody(event, schema.parse);
  if (!body.clientId && !body.company && !body.name && !body.phone && !body.telegram && !body.whatsapp && !body.instagram) {
    throw createError({ statusCode: 422, message: "Укажите клиента: имя, компанию или контакт" });
  }
  const code = body.contactCode ? findContactCode(body.contactCode) : null;
  if (body.contactCode && !code) throw createError({ statusCode: 422, message: "Код обращения выглядит как OB-1234" });
  const { deal } = await createLead({
    origin: body.origin,
    name: body.name,
    company: body.company,
    clientId: body.clientId ?? null,
    phone: body.phone || null,
    telegram: body.telegram || null,
    whatsapp: body.whatsapp || null,
    instagram: body.instagram || null,
    industryKey: body.industryKey ?? null,
    serviceIds: body.serviceIds,
    amount: body.amount ?? null,
    currency: body.currency.toUpperCase(),
    code,
    // A code wins (its visit is the real source); otherwise the picked channel.
    forceChannelId: code ? null : body.channelId ?? null,
    channelKey: code ? null : "unknown",
    ownerId: body.ownerId ?? user.id,
  }, user.id);
  await audit(event, "deal.create", "deal", deal.id);
  return deal;
});
