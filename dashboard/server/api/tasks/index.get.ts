// Open tasks across all deals: overdue, today, later (and recently done).
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { clients, deals, tasks, users } from "../../db/schema";
import { requireUser } from "../../utils/auth";
import { useDb } from "../../utils/db";

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const db = useDb();
  const select = {
    task: tasks,
    dealTitle: deals.title,
    client: clients.name,
    assignee: users.name,
  };
  const open = await db.select(select).from(tasks)
    .leftJoin(deals, eq(deals.id, tasks.dealId))
    .leftJoin(clients, eq(clients.id, deals.clientId))
    .leftJoin(users, eq(users.id, tasks.assigneeId))
    .where(eq(tasks.done, false))
    .orderBy(sql`${tasks.dueOn} IS NULL`, asc(tasks.dueOn), asc(tasks.id));
  const done = await db.select(select).from(tasks)
    .leftJoin(deals, eq(deals.id, tasks.dealId))
    .leftJoin(clients, eq(clients.id, deals.clientId))
    .leftJoin(users, eq(users.id, tasks.assigneeId))
    .where(and(eq(tasks.done, true), gt(tasks.doneAt, sql`now() - interval '14 days'`)))
    .orderBy(desc(tasks.doneAt)).limit(50);
  const flat = (list: typeof open) => list.map((row) => ({ ...row.task, dealTitle: row.dealTitle, client: row.client, assignee: row.assignee }));
  return { open: flat(open), done: flat(done) };
});
