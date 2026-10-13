/**
 * Server-side GraphQL requests take Railway's private network instead of going
 * out to the backend's public domain and back in through its edge proxy.
 *
 * Pages call `runtimeConfig.public.graphqlUrl` (the public URL, which the
 * browser needs) everywhere, so instead of changing every call site the
 * server's fetch sends requests for exactly that URL to NUXT_GRAPHQL_URL_INTERNAL
 * (e.g. http://1branding.railway.internal:1337/graphql). useFetch keys stay the
 * same on server and client, since the URL the code passes does not change.
 * If the private address fails, the request goes to the public URL and the
 * private one is retried a minute later.
 */
const RETRY_AFTER_MS = 60_000;

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig();
  const publicUrl = String(config.public.graphqlUrl || "");
  const internalUrl = String(config.graphqlUrlInternal || "");
  if (!publicUrl || !internalUrl || publicUrl === internalUrl) return;

  const originalFetch = globalThis.fetch;
  let skipUntil = 0;

  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : null;
    if (url !== publicUrl || Date.now() < skipUntil) return originalFetch(input, init);
    try {
      return await originalFetch(internalUrl, init);
    } catch (error) {
      skipUntil = Date.now() + RETRY_AFTER_MS;
      console.warn(`[graphql] private network request failed (${(error as Error)?.message}); using the public URL for a minute`);
      return originalFetch(input, init);
    }
  };
});
