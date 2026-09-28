export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_BASE_URL', ''),
  // Only trust forwarded headers behind a known proxy; bound the trusted hops.
  proxy: {
    koa: env.bool('IS_PROXIED', false),
    ipHeader: 'X-Forwarded-For',
    maxIpsCount: env.int('PROXY_MAX_IPS_COUNT', 1),
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
});
