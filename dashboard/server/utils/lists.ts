// Saving an editable list from Settings (stages, refusal reasons, services,
// industries, channels): rows with an id are updated, new ones inserted,
// missing ones deleted. A row still used by deals cannot be deleted and is
// switched off instead (where the table has is_active).
import { eq } from "drizzle-orm";
import { createError } from "h3";
import type { PgTable } from "drizzle-orm/pg-core";
import { useDb } from "./db";

type Row = { id?: number | null } & Record<string, unknown>;

export async function saveList<T extends PgTable>(
  table: T,
  items: Row[],
  options: { hasActive?: boolean; protectedIds?: number[]; prepare?: (item: Row, index: number, isNew: boolean, id: number | null) => Record<string, unknown> } = {},
) {
  const db = useDb();
  // drizzle's generic table typing does not reach the column helpers here.
  const t = table as unknown as Record<string, never> & { id: never; isActive: never };
  const keepIds = items.map((item) => item.id).filter((id): id is number => typeof id === "number");
  const prepare = options.prepare ?? ((item: Row) => item);

  return db.transaction(async (tx) => {
    const existing = (await tx.select({ id: t.id }).from(table as never)) as Array<{ id: number }>;
    const removed = existing.map((row) => row.id).filter((id) => !keepIds.includes(id));
    for (const id of removed) {
      if (options.protectedIds?.includes(id)) throw createError({ statusCode: 422, message: "Этот элемент нельзя удалить: на нём держится логика" });
      try {
        await tx.transaction(async (inner) => {
          await inner.delete(table).where(eq(t.id, id));
        });
      } catch {
        if (!options.hasActive) throw createError({ statusCode: 409, message: "Элемент используется в сделках, его нельзя удалить" });
        await tx.update(table).set({ isActive: false } as never).where(eq(t.id, id));
      }
    }
    for (const [index, item] of items.entries()) {
      const { id, ...rest } = item;
      const values = prepare(rest, index, typeof id !== "number", typeof id === "number" ? id : null);
      if (typeof id === "number") await tx.update(table).set(values as never).where(eq(t.id, id));
      else await tx.insert(table).values(values as never);
    }
    return { removed: removed.length };
  });
}

