// API tokens and ids of the connections (spec 6.9 "подключения"): stored
// encrypted; an empty value removes one. Owners only.
import { z } from "zod";
import { audit } from "../../utils/audit";
import { requireOwner } from "../../utils/auth";
import { SECRET_KEYS, setSecret } from "../../utils/settings";

const schema = z.record(z.enum(SECRET_KEYS), z.string().max(4000));

export default defineEventHandler(async (event) => {
  await requireOwner(event);
  const body = await readValidatedBody(event, schema.parse);
  for (const [key, value] of Object.entries(body)) await setSecret(key as (typeof SECRET_KEYS)[number], value);
  await audit(event, "connections.update", "secrets", null, { keys: Object.keys(body) });
  return { ok: true };
});
