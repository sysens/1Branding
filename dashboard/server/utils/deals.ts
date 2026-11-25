// The funnel's rules (spec 6.2): creating a deal, moving it between stages
// (with its history), and the checks a move must pass.
import { and, asc, count, eq } from "drizzle-orm";
import { createError } from "h3";
import { deals, lossReasons, payments, stageHistory, stages } from "../db/schema";
import { useDb } from "./db";

export type StageRow = typeof stages.$inferSelect;
export type DealRow = typeof deals.$inferSelect;

export async function stageList(): Promise<StageRow[]> {
  return useDb().select().from(stages).orderBy(asc(stages.position), asc(stages.id));
}

export async function stageByKey(key: string): Promise<StageRow> {
  const [row] = await useDb().select().from(stages).where(eq(stages.key, key));
  if (!row) throw new Error(`Stage "${key}" is missing`);
  return row;
}

export async function insertDeal(values: typeof deals.$inferInsert, userId: number | null = null): Promise<DealRow> {
  const db = useDb();
  return db.transaction(async (tx) => {
    const [deal] = await tx.insert(deals).values({ ...values, createdBy: userId, stageChangedAt: new Date() }).returning();
    await tx.insert(stageHistory).values({ dealId: deal!.id, fromStageId: null, toStageId: deal!.stageId, userId });
    return deal!;
  });
}

export type MoveOptions = { lossReasonId?: number | null; lossComment?: string | null };

/** Moves a deal to a stage, or throws a 422 with the reason the move is not allowed. */
export async function moveDeal(dealId: number, toStageId: number, userId: number | null, options: MoveOptions = {}): Promise<DealRow> {
  const db = useDb();
  const [deal] = await db.select().from(deals).where(eq(deals.id, dealId));
  if (!deal) throw createError({ statusCode: 404, message: "Сделка не найдена" });
  if (deal.stageId === toStageId && !options.lossReasonId) return deal;
  const list = await stageList();
  const target = list.find((stage) => stage.id === toStageId);
  if (!target) throw createError({ statusCode: 422, message: "Нет такого этапа" });

  if (target.requiresPayment) {
    const [{ value } = { value: 0 }] = await db.select({ value: count() }).from(payments).where(eq(payments.dealId, dealId));
    if (!value) throw createError({ statusCode: 422, message: `Чтобы перевести в «${target.name}», сначала внесите платёж` });
  }
  if (target.kind === "lost") {
    if (!options.lossReasonId) throw createError({ statusCode: 422, message: "Укажите причину отказа" });
    const [reason] = await db.select().from(lossReasons).where(and(eq(lossReasons.id, options.lossReasonId)));
    if (!reason) throw createError({ statusCode: 422, message: "Нет такой причины отказа" });
  }

  const contacted = list.find((stage) => stage.key === "contacted");
  const now = new Date();
  // First response: the lead first reached "Contacted" or any later working stage.
  const responds = !deal.firstResponseAt && target.kind !== "lost" && contacted && target.position >= contacted.position;
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(deals).set({
      stageId: toStageId,
      stageChangedAt: now,
      ...(responds ? { firstResponseAt: now } : {}),
      closedAt: target.kind === "open" ? null : now,
      lossReasonId: target.kind === "lost" ? options.lossReasonId ?? null : null,
      lossComment: target.kind === "lost" ? options.lossComment?.trim() || null : null,
    }).where(eq(deals.id, dealId)).returning();
    if (deal.stageId !== toStageId) {
      await tx.insert(stageHistory).values({ dealId, fromStageId: deal.stageId, toStageId, userId, at: now });
    }
    return updated!;
  });
}
