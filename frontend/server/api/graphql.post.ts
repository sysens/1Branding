export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  return await $fetch(config.public.graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
});
