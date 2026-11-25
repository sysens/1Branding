// Railway's healthcheck: 200 once the database is migrated and answers.
import { sql } from "drizzle-orm";
import { useDb } from "../utils/db";
import { databaseReady } from "../utils/ready";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  try {
    await databaseReady();
    await useDb().execute(sql`SELECT 1`);
    return "ok";
  } catch {
    setResponseStatus(event, 503);
    return "database unavailable";
  }
});
