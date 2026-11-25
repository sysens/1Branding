import { desc, eq } from "drizzle-orm";
import { clients, deals, stages } from "../../db/schema";
import { requireUser } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { idParam, notFound } from "../../utils/http";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const id = idParam(event);
  const db = useDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  if (!client) throw notFound("Клиент");
  const dealRows = await db.select({ deal: deals, stage: stages.name, stageKind: stages.kind }).from(deals)
    .innerJoin(stages, eq(stages.id, deals.stageId)).where(eq(deals.clientId, id)).orderBy(desc(deals.createdAt));
  return { client, deals: dealRows.map((row) => ({ ...row.deal, stage: row.stage, stageKind: row.stageKind })) };
});
