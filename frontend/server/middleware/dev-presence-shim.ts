export default defineEventHandler((event) => {
  if (!import.meta.dev) {
    return;
  }

  if (getRequestURL(event).pathname !== "/api/presence") {
    return;
  }

  setResponseStatus(event, 204);
  return "";
});
