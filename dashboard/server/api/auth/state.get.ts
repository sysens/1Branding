// For the login page: is there anyone yet (else the first-owner setup is shown).
import { count } from "drizzle-orm";
import { users } from "../../db/schema";
import { useDb } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const [{ value } = { value: 0 }] = await useDb().select({ value: count() }).from(users);
  return { hasUsers: value > 0, setupEnabled: value === 0 && !!useRuntimeConfig(event).setupToken };
});
