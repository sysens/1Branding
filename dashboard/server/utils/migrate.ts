// Applies the SQL migrations drizzle-kit writes to server/db/migrations
// (bundled as the "migrations" server asset), in order, once each. A small
// runner of our own: it works the same on postgres.js and PGlite and needs
// no migration folder on disk in the built server.
import { sql } from "drizzle-orm";
import { rows, useDb } from "./db";

export type Migration = { name: string; sql: string };

export async function applyMigrations(list: Migration[]) {
  const db = useDb();
  await db.execute(sql`CREATE TABLE IF NOT EXISTS __migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const done = new Set((await rows<{ name: string }>(sql`SELECT name FROM __migrations`)).map((row) => row.name));
  const pending = [...list].sort((a, b) => a.name.localeCompare(b.name)).filter((m) => !done.has(m.name));
  for (const migration of pending) {
    await db.transaction(async (tx) => {
      for (const statement of migration.sql.split("--> statement-breakpoint")) {
        if (statement.trim()) await tx.execute(sql.raw(statement));
      }
      await tx.execute(sql`INSERT INTO __migrations (name) VALUES (${migration.name})`);
    });
  }
  return pending.map((m) => m.name);
}

/** The migrations bundled with the server (nitro serverAssets "migrations"). */
export async function bundledMigrations(): Promise<Migration[]> {
  const storage = useStorage("assets:migrations");
  const keys = (await storage.getKeys()).filter((key) => key.endsWith(".sql"));
  const list: Migration[] = [];
  for (const key of keys) {
    const text = await storage.getItem<string>(key);
    list.push({ name: key.replace(/\.sql$/, ""), sql: String(text ?? "") });
  }
  return list;
}
