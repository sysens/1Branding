/**
 * `GET /healthz` for Railway's deploy healthcheck: 200 once Strapi is up and
 * the database answers, 503 otherwise, so a broken deploy never gets traffic
 * (Strapi's own /_health returns 204, and Railway waits for a 200).
 */
const DB_TIMEOUT_MS = 3_000;

export default (_config: unknown, { strapi }: { strapi: any }) =>
  async (ctx: any, next: () => Promise<void>) => {
    if (ctx.method !== 'GET' || ctx.path !== '/healthz') return next();
    ctx.set('Cache-Control', 'no-store');
    try {
      await Promise.race([
        strapi.db.connection.raw('select 1'),
        new Promise((_, fail) => setTimeout(() => fail(new Error('timeout')), DB_TIMEOUT_MS)),
      ]);
      ctx.status = 200;
      ctx.body = 'ok';
    } catch {
      ctx.status = 503;
      ctx.body = 'database unavailable';
    }
  };
