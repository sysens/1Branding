// Opens the database, applies pending migrations and adds the default
// reference data (channels, stages, services ...). Nitro does not wait for
// an async plugin, so requests wait for `databaseReady` in
// server/middleware/00.ready.ts.
import { initDb } from "../utils/db";
import { applyMigrations, bundledMigrations } from "../utils/migrate";
import { setDatabaseReady } from "../utils/ready";
import { seedDefaults } from "../utils/seed";

export default defineNitroPlugin(() => {
  setDatabaseReady((async () => {
    await initDb();
    const applied = await applyMigrations(await bundledMigrations());
    if (applied.length) console.info(`[db] applied migrations: ${applied.join(", ")}`);
    await seedDefaults();
  })());
});
