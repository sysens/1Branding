// Every API request waits until the database is migrated and seeded.
import { databaseReady } from "../utils/ready";

export default defineEventHandler(async (event) => {
  const path = event.path || "/";
  if (path.startsWith("/api/") || path.startsWith("/r/")) await databaseReady();
});
