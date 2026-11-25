// Moves a deal to another stage (a drag on the board). "Prepayment" and
// "Paid in full" need a payment; "Lost" needs a reason (spec 6.2).
import { z } from "zod";
import { audit } from "../../../utils/audit";
import { requireEditor } from "../../../utils/auth";
import { moveDeal } from "../../../utils/deals";
import { idParam } from "../../../utils/http";

const schema = z.object({
  stageId: z.number().int().positive(),
  lossReasonId: z.number().int().positive().nullable().optional(),
  lossComment: z.string().trim().max(500).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireEditor(event);
  const id = idParam(event);
  const body = await readValidatedBody(event, schema.parse);
  const deal = await moveDeal(id, body.stageId, user.id, { lossReasonId: body.lossReasonId, lossComment: body.lossComment });
  await audit(event, "deal.move", "deal", id, { to: body.stageId });
  return deal;
});
