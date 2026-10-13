import type { StrapiEnv } from "./upload";

export default ({ env }: { env: StrapiEnv }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_BASE_URL', ''),
  // Only trust forwarded headers behind a known proxy; bound the trusted hops.
  // Railway (which sets RAILWAY_SERVICE_ID) always sits behind its edge proxy;
  // without this every visitor shares one IP and one contact-form rate limit.
  proxy: {
    koa: env.bool('IS_PROXIED', Boolean(env('RAILWAY_SERVICE_ID', ''))),
    ipHeader: 'X-Forwarded-For',
    maxIpsCount: env.int('PROXY_MAX_IPS_COUNT', 1),
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
});
