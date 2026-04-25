const MEGABYTE = 1024 * 1024;
const DEFAULT_UPLOAD_MAX_FILE_SIZE_MB = 128;
const DEFAULT_SIGNED_URL_EXPIRES = 15 * 60;
const DEFAULT_R2_REGION = "auto";
const DEFAULT_R2_CACHE_CONTROL = "public, max-age=31536000, immutable";

export interface StrapiEnv {
  (key: string, defaultValue?: string): string;
  bool(key: string, defaultValue?: boolean): boolean;
  int(key: string, defaultValue?: number): number;
}

type UploadProvider = "local" | "r2";

interface UploadActionOptions {
  upload: Record<string, never>;
  uploadStream: Record<string, never>;
  delete: Record<string, never>;
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

interface R2UploadConfig {
  config: {
    sizeLimit: number;
    provider: "aws-s3";
    urlAbsolute: true;
    providerOptions: {
      baseUrl: string;
      rootPath?: string;
      s3Options: {
        credentials: {
          accessKeyId: string;
          secretAccessKey: string;
        };
        endpoint: string;
        forcePathStyle: boolean;
        region: string;
        params: {
          Bucket: string;
          CacheControl?: string;
          signedUrlExpires: number;
        };
      };
    };
    actionOptions: UploadActionOptions;
  };
}

type UploadConfig = LocalUploadConfig | R2UploadConfig;

const getUploadProvider = (env: StrapiEnv): UploadProvider => {
  const provider = env("UPLOAD_PROVIDER", "local").trim().toLowerCase();

  if (provider === "local" || provider === "r2") {
    return provider;
  }

  throw new Error(
    `Unsupported UPLOAD_PROVIDER "${provider}". Expected "local" or "r2".`
  );
};

export const getUploadMaxFileSizeMb = (env: StrapiEnv): number =>
  env.int("UPLOAD_MAX_FILE_SIZE_MB", DEFAULT_UPLOAD_MAX_FILE_SIZE_MB);

export const getUploadMaxFileSizeBytes = (env: StrapiEnv): number =>
  getUploadMaxFileSizeMb(env) * MEGABYTE;

export const getUploadLimitLabel = (env: StrapiEnv): string =>
  `${getUploadMaxFileSizeMb(env)}mb`;

const getRequiredEnv = (env: StrapiEnv, key: string): string => {
  const value = env(key, "").trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const removeTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const buildR2Endpoint = (env: StrapiEnv): string => {
  const explicitEndpoint = env("R2_ENDPOINT", "").trim();

  if (explicitEndpoint) {
    return removeTrailingSlash(explicitEndpoint);
  }

  const accountId = getRequiredEnv(env, "R2_ACCOUNT_ID");
  return `https://${accountId}.r2.cloudflarestorage.com`;
};

const parseHost = (value: string): string | null => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).host;
  } catch {
    return null;
  }
};

const getSecurityHosts = (env: StrapiEnv): string[] => {
  const provider = getUploadProvider(env);
  const hosts = new Set<string>(["market-assets.strapi.io"]);

  if (provider === "r2") {
    const publicUrlHost = parseHost(env("R2_PUBLIC_URL", "").trim());
    const endpointHost = parseHost(buildR2Endpoint(env));

    if (publicUrlHost) {
      hosts.add(publicUrlHost);
    }

    if (endpointHost) {
      hosts.add(endpointHost);
    }
  }

  return Array.from(hosts);
};

export const buildUploadSecurityMiddleware = (
  env: StrapiEnv
): UploadSecurityMiddlewareConfig => {
  const hosts = getSecurityHosts(env);

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
  const provider = getUploadProvider(env);

  if (provider === "local") {
    return {
      config: {
        sizeLimit,
      },
    };
  }

  const publicUrl = removeTrailingSlash(getRequiredEnv(env, "R2_PUBLIC_URL"));
  const rootPath = env("R2_ROOT_PATH", "").trim();
  const cacheControl = env("R2_CACHE_CONTROL", DEFAULT_R2_CACHE_CONTROL).trim();

  return {
    config: {
      sizeLimit,
      provider: "aws-s3",
      urlAbsolute: true,
      providerOptions: {
        baseUrl: publicUrl,
        ...(rootPath ? { rootPath } : {}),
        s3Options: {
          credentials: {
            accessKeyId: getRequiredEnv(env, "R2_ACCESS_KEY_ID"),
            secretAccessKey: getRequiredEnv(env, "R2_SECRET_ACCESS_KEY"),
          },
          endpoint: buildR2Endpoint(env),
          forcePathStyle: env.bool("R2_FORCE_PATH_STYLE", false),
          region: env("R2_REGION", DEFAULT_R2_REGION),
          params: {
            Bucket: getRequiredEnv(env, "R2_BUCKET"),
            ...(cacheControl ? { CacheControl: cacheControl } : {}),
            signedUrlExpires: env.int(
              "R2_SIGNED_URL_EXPIRES",
              DEFAULT_SIGNED_URL_EXPIRES
            ),
          },
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  };
};
