// One database for the whole server. Production (and anything with
// DATABASE_URL) uses PostgreSQL through postgres.js; without it, local
// development and the tests run on PGlite, a real PostgreSQL compiled to
// WebAssembly that keeps its files in .data/pglite (or in memory).
import type { SQL } from "drizzle-orm";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

export type Db = PostgresJsDatabase<typeof schema>;

let instance: Db | null = null;
let closeFn: (() => Promise<void>) | null = null;
let isPglite = false;

export const useDb = (): Db => {
  if (!instance) throw new Error("Database is not initialised yet");
  return instance;
};

export const dbIsPglite = () => isPglite;

export async function initDb(options: { url?: string; pgliteDir?: string } = {}): Promise<Db> {
  if (instance) return instance;
  const url = options.url ?? process.env.DATABASE_URL ?? "";
  if (url) {
    const client = postgres(url, {
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      idle_timeout: 30,
      connect_timeout: 15,
      // Every timestamp the server reads or writes is UTC; reports convert to
      // Asia/Tashkent in SQL where a day boundary matters.
      connection: { TimeZone: "UTC" },
      onnotice: () => {},
    });
    instance = drizzlePostgres(client, { schema });
    closeFn = () => client.end({ timeout: 5 });
  } else {
    // A deployment without its PostgreSQL would keep the CRM in the container
    // and lose it on the next deploy: refuse to start instead.
    if (process.env.NODE_ENV === "production" && !options.pgliteDir && !process.env.PGLITE_DIR) {
      throw new Error("DATABASE_URL is not set");
    }
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
    const dir = options.pgliteDir ?? process.env.PGLITE_DIR ?? ".data/pglite";
    if (dir !== "memory") (await import("node:fs")).mkdirSync(dir, { recursive: true });
    const client = dir === "memory" ? new PGlite() : new PGlite(dir);
    await client.exec("SET TIME ZONE 'UTC'");
    // Same query builder; only raw `execute` results differ (see `rows`).
    instance = drizzlePglite(client, { schema }) as unknown as Db;
    closeFn = () => client.close();
    isPglite = true;
  }
  return instance;
}

export async function closeDb() {
  await closeFn?.();
  instance = null;
  closeFn = null;
}

/** Runs a raw query and returns its rows, whichever driver is in use. */
export async function rows<T = Record<string, unknown>>(query: SQL): Promise<T[]> {
  const result = (await useDb().execute(query)) as unknown;
  if (Array.isArray(result)) return result as T[];
  return ((result as { rows?: T[] }).rows ?? []) as T[];
}

export async function one<T = Record<string, unknown>>(query: SQL): Promise<T | undefined> {
  return (await rows<T>(query))[0];
}
