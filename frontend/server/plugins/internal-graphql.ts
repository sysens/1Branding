/**
 * Server-side GraphQL requests take Railway's private network instead of going
 * out to the backend's public domain and back in through its edge proxy.
 *
 * Pages call `runtimeConfig.public.graphqlUrl` (the public URL, which the
 * browser needs) everywhere, so instead of changing every call site the
 * server's fetch sends requests for exactly that URL to NUXT_GRAPHQL_URL_INTERNAL
 * (e.g. http://1branding.railway.internal:1337/graphql). useFetch keys stay the
 * same on server and client, since the URL the code passes does not change.
 * If the private address fails, or does not answer within 4 s, the request
 * goes to the public URL and the private one is retried a minute later. When
 * the caller itself gives up (cmsRequest's timeout), nothing is retried.
 */
const RETRY_AFTER_MS = 60_000;
const INTERNAL_TIMEOUT_MS = 4_000;

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
    // Only until the response headers arrive; the body is then the caller's to time.
    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(new Error(`no answer in ${INTERNAL_TIMEOUT_MS} ms`)), INTERNAL_TIMEOUT_MS);
    const signal = init?.signal ? AbortSignal.any([init.signal, deadline.signal]) : deadline.signal;
    try {
      return await originalFetch(internalUrl, { ...init, signal });
    } catch (error) {
      if (init?.signal?.aborted) throw error;
      skipUntil = Date.now() + RETRY_AFTER_MS;
      console.warn(`[graphql] private network request failed (${(error as Error)?.message}); using the public URL for a minute`);
      return originalFetch(input, init);
    } finally {
      clearTimeout(timer);
    }
  };
});
