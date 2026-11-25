// Meta's webhook verification for Instagram messaging (spec 8.3).
import { getSecret } from "../../utils/settings";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const expected = await getSecret("instagram_verify_token");
  if (query["hub.mode"] === "subscribe" && expected && query["hub.verify_token"] === expected) {
    setResponseHeader(event, "content-type", "text/plain");
    return String(query["hub.challenge"] ?? "");
  }
  throw createError({ statusCode: 403, message: "forbidden" });
});
