// Railway deploy healthcheck: a new deploy only gets traffic once it answers.
export default defineEventHandler((event) => {
  setHeader(event, "Cache-Control", "no-store");
  return "ok";
});
