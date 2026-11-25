// Saves one of the editable lists of Settings: stages, loss-reasons,
// services, industries, channels (with their "UTM → channel" rules and
// marketplace commission).
import { asc } from "drizzle-orm";
import { z } from "zod";
import { channels, industries, lossReasons, services, stages } from "../../../db/schema";
import { audit } from "../../../utils/audit";
import { requireOwner } from "../../../utils/auth";
import { forgetChannels } from "../../../utils/channels";
import { useDb } from "../../../utils/db";
import { randomToken } from "../../../utils/crypto";
import { saveList } from "../../../utils/lists";

const id = z.number().int().positive().nullable().optional();
const name = z.string().trim().min(1).max(120);
const slug = z.string().trim().regex(/^[a-z0-9_]{2,40}$/, "Ключ: латиница, цифры, _");

const schemas = {
  stages: z.array(z.object({ id, name, kind: z.enum(["open", "won", "lost"]).optional(), requiresPayment: z.boolean().optional() })).min(3).max(20),
  "loss-reasons": z.array(z.object({ id, name, key: z.string().max(40).nullable().optional(), isActive: z.boolean().optional() })).max(40),
  services: z.array(z.object({
    id, name, key: slug.optional(), kind: z.enum(["service", "package"]), basePrice: z.number().nonnegative().max(1e9).nullable().optional(),
    currency: z.string().length(3).optional(), isActive: z.boolean().optional(),
  })).max(100),
  industries: z.array(z.object({ id, name, key: slug.optional(), isActive: z.boolean().optional() })).max(100),
  channels: z.array(z.object({
    id, name, key: slug.optional(), costMode: z.enum(["api", "manual", "none"]),
    commissionPercent: z.number().min(0).max(100),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
    isActive: z.boolean().optional(),
    rules: z.array(z.object({
      source: z.string().trim().max(80).optional(),
      medium: z.string().trim().max(80).optional(),
      clickId: z.enum(["gclid", "yclid", "fbclid"]).optional(),
      referrer: z.string().trim().max(120).optional(),
    })).max(30),
  })).max(60),
} as const;

const SYSTEM_CHANNELS = ["direct", "other", "unknown"];

export default defineEventHandler(async (event) => {
  await requireOwner(event);
  const list = getRouterParam(event, "list") as keyof typeof schemas;
  if (!(list in schemas)) throw createError({ statusCode: 404, message: "Нет такого списка" });
  // Each branch below saves the list its schema validated.
  const items = schemas[list].parse(await readBody(event)) as Array<{ id?: number | null } & Record<string, unknown>>;
  const db = useDb();
  const position = (_: unknown, index: number) => ({ position: index });

  if (list === "stages") {
    const current = await db.select().from(stages).orderBy(asc(stages.position));
    await saveList(stages, items, {
      protectedIds: current.filter((s) => s.isSystem).map((s) => s.id),
      prepare: (item, index, isNew, rowId) => {
        const known = current.find((s) => s.id === rowId);
        return {
          name: item.name,
          position: index,
          ...(item.requiresPayment !== undefined ? { requiresPayment: item.requiresPayment } : {}),
          // A new stage gets a key of its own; the built-in stages keep their key and kind.
          ...(isNew ? { key: `custom_${randomToken(4).toLowerCase()}`, kind: item.kind ?? "open" } : {}),
          ...(!isNew && known && !known.isSystem && item.kind ? { kind: item.kind } : {}),
        };
      },
    });
  } else if (list === "loss-reasons") {
    await saveList(lossReasons, items, { hasActive: true, prepare: (item, index) => ({ ...item, ...position(item, index) }) });
  } else if (list === "services") {
    await saveList(services, items, {
      hasActive: true,
      prepare: (item, index) => ({ ...item, key: item.key ?? `svc_${randomToken(4).toLowerCase()}`, position: index }),
    });
  } else if (list === "industries") {
    await saveList(industries, items, {
      hasActive: true,
      prepare: (item, index) => ({ ...item, key: item.key ?? `ind_${randomToken(4).toLowerCase()}`, position: index }),
    });
  } else if (list === "channels") {
    const current = await db.select().from(channels);
    await saveList(channels, items, {
      hasActive: true,
      protectedIds: current.filter((c) => SYSTEM_CHANNELS.includes(c.key)).map((c) => c.id),
      prepare: (item, index) => ({ ...item, key: item.key ?? `ch_${randomToken(4).toLowerCase()}`, position: index }),
    });
    forgetChannels();
  }
  await audit(event, "settings.list", list, null, { count: items.length });
  return { ok: true };
});
