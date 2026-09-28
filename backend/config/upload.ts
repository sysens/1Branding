const MEGABYTE = 1024 * 1024;
const DEFAULT_UPLOAD_MAX_FILE_SIZE_MB = 128;

export interface StrapiEnv {
  (key: string, defaultValue?: string): string;
  bool(key: string, defaultValue?: boolean): boolean;
  int(key: string, defaultValue?: number): number;
}

interface UploadSecurityMiddlewareConfig {
  name: "strapi::security";
  config: {
    contentSecurityPolicy: {
      useDefaults: true;
      directives: {
        "connect-src": string[];
        "img-src": string[];
        "media-src": string[];
        upgradeInsecureRequests: null;
      };
    };
  };
}

interface LocalUploadConfig {
  config: {
    sizeLimit: number;
    providerOptions: {
      localServer: {
        maxage: number;
      };
    };
  };
}

type UploadConfig = LocalUploadConfig;

export const getUploadMaxFileSizeMb = (env: StrapiEnv): number =>
  env.int("UPLOAD_MAX_FILE_SIZE_MB", DEFAULT_UPLOAD_MAX_FILE_SIZE_MB);

export const getUploadMaxFileSizeBytes = (env: StrapiEnv): number =>
  getUploadMaxFileSizeMb(env) * MEGABYTE;

export const getUploadLimitLabel = (env: StrapiEnv): string =>
  `${getUploadMaxFileSizeMb(env)}mb`;

const getSecurityHosts = (): string[] => ["market-assets.strapi.io"];

export const buildUploadSecurityMiddleware = (
  _env: StrapiEnv
): UploadSecurityMiddlewareConfig => {
  const hosts = getSecurityHosts();

  return {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": ["'self'", "data:", "blob:", ...hosts],
          "media-src": ["'self'", "data:", "blob:", ...hosts],
          upgradeInsecureRequests: null,
        },
      },
    },
  };
};

export const buildUploadConfig = (env: StrapiEnv): UploadConfig => {
  const sizeLimit = getUploadMaxFileSizeBytes(env);

  return {
    config: {
      sizeLimit,
      // Cache-Control for GET /uploads/* (koa-static `maxage`, in ms). Strapi's
      // default is 0 (no caching). Not `immutable`: "Replace media" in the admin
      // keeps the same URL, so keep this bounded.
      providerOptions: {
        localServer: {
          maxage: env.int("UPLOAD_CACHE_MAX_AGE_SECONDS", 86400) * 1000,
        },
      },
    },
  };
};
