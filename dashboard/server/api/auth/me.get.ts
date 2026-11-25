// The signed-in user, for the app shell. 401 when there is no full session.
import { sessionUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const user = await sessionUser(event);
  if (!user || user.stage !== "active") throw createError({ statusCode: 401, message: "Требуется вход" });
  const require2fa = process.env.NUXT_AUTH_REQUIRE_2FA !== "false";
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    totpEnabled: user.totpEnabled,
    needs2faSetup: require2fa && !user.totpEnabled,
  };
});
