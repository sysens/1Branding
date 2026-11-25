// Every page but the login ones needs a full session; a user without 2FA
// is sent to set it up first.
const PUBLIC = ["/login", "/setup"];

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC.includes(to.path)) return;
  const me = await loadMe();
  if (!me) return navigateTo({ path: "/login", query: to.fullPath !== "/" ? { next: to.fullPath } : {} });
  if (me.needs2faSetup && to.path !== "/setup-2fa") return navigateTo("/setup-2fa");
  if (to.path !== "/setup-2fa") await useMeta().load();
});
