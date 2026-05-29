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
    },
  };
};
