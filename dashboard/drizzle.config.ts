import { defineConfig } from "drizzle-kit";

// `bun run db:generate` writes a SQL migration for every schema change;
// the server applies them on start (server/plugins/00.database.ts).
export default defineConfig({
  dialect: "postgresql",
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
});
