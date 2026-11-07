const MEGABYTE = 1024 * 1024;
const DEFAULT_UPLOAD_MAX_FILE_SIZE_MB = 128;
const DEFAULT_SIGNED_URL_EXPIRES = 15 * 60;
const DEFAULT_R2_REGION = "auto";
const DEFAULT_R2_CACHE_CONTROL = "public, max-age=31536000, immutable";

export interface StrapiEnv {
  (key: string, defaultValue?: string): string;
  bool(key: string, defaultValue?: boolean): boolean;
  int(key: string, defaultValue?: number): number;
  array(key: string, defaultValue?: string[]): string[];
}

type UploadProvider = "local" | "r2";

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

// Media the site and the contact form need. Anything that a browser could run
// from the upload origin (HTML, SVG, JavaScript, XML...) is refused, so a file
// in the media library can never become a script on the admin's origin.
const UPLOAD_SECURITY = {
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/gif",
    "image/heic",
    "image/heif",
    "video/mp4",
    "video/webm",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
  deniedTypes: [
    "text/html",
    "application/xhtml+xml",
    "image/svg+xml",
    "text/javascript",
    "application/javascript",
    "application/x-javascript",
    "application/xml",
    "text/xml",
  ],
};

interface LocalUploadConfig {
  config: {
    sizeLimit: number;
    security: typeof UPLOAD_SECURITY;
    providerOptions: {
      localServer: {
        maxage: number;
      };
    };
  };
}

interface R2UploadConfig {
  config: {
    sizeLimit: number;
    security: typeof UPLOAD_SECURITY;
    provider: "aws-s3";
    providerOptions: {
      baseUrl: string;
      rootPath?: string;
      s3Options: {
        credentials: { accessKeyId: string; secretAccessKey: string };
        endpoint: string;
        forcePathStyle: boolean;
        region: string;
        params: { Bucket: string; CacheControl?: string; signedUrlExpires: number };
      };
    };
    actionOptions: { upload: Record<string, never>; uploadStream: Record<string, never>; delete: Record<string, never> };
  };
}

type UploadConfig = LocalUploadConfig | R2UploadConfig;

const removeTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const R2_REQUIRED = ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"] as const;

const r2Endpoint = (env: StrapiEnv): string => {
  const explicit = env("R2_ENDPOINT", "").trim();
  if (explicit) return removeTrailingSlash(explicit);
  const accountId = env("R2_ACCOUNT_ID", "").trim();
  return accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "";
};

/**
 * The provider in use. `UPLOAD_PROVIDER=r2` stores media in Cloudflare R2 (the
 * container's disk is wiped on every deploy, so production must use it). If
 * the R2 settings are incomplete, this falls back to the local disk with an
 * error in the log (`strapi build` loads this file too); in production the
 * server then refuses to start (src/utils/storage-guard.ts).
 */
export const getUploadProvider = (env: StrapiEnv): UploadProvider => {
  const wanted = env("UPLOAD_PROVIDER", "local").trim().toLowerCase();
  if (wanted !== "r2") {
    if (wanted !== "local") console.error(`[upload] Unknown UPLOAD_PROVIDER "${wanted}", using local disk`);
    return "local";
  }
  const missing = R2_REQUIRED.filter((key) => !env(key, "").trim());
  if (!r2Endpoint(env)) missing.push("R2_ENDPOINT or R2_ACCOUNT_ID" as never);
  if (missing.length) {
    console.error(`[upload] UPLOAD_PROVIDER=r2 but ${missing.join(", ")} not set: uploads go to the local disk and are lost on redeploy`);
    return "local";
  }
  return "r2";
};

/** Public origin + path prefix of uploaded files (`https://media.example.com/uploads`), or null for local. */
export const getR2PublicPrefix = (env: StrapiEnv): string | null => {
  if (getUploadProvider(env) !== "r2") return null;
  const rootPath = env("R2_ROOT_PATH", "").trim().replace(/^\/+|\/+$/g, "");
  return `${removeTrailingSlash(env("R2_PUBLIC_URL", "").trim())}${rootPath ? `/${rootPath}` : ""}`;
};

export const getUploadMaxFileSizeMb = (env: StrapiEnv): number =>
  env.int("UPLOAD_MAX_FILE_SIZE_MB", DEFAULT_UPLOAD_MAX_FILE_SIZE_MB);

export const getUploadMaxFileSizeBytes = (env: StrapiEnv): number =>
  getUploadMaxFileSizeMb(env) * MEGABYTE;

export const getUploadLimitLabel = (env: StrapiEnv): string =>
  `${getUploadMaxFileSizeMb(env)}mb`;

const hostOf = (value: string): string | null => {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
};

// The admin panel previews media from the R2 public domain, so it joins the CSP.
const getSecurityHosts = (env: StrapiEnv): string[] => {
  const hosts = new Set<string>(["market-assets.strapi.io"]);
  if (getUploadProvider(env) === "r2") {
    const publicHost = hostOf(env("R2_PUBLIC_URL", "").trim());
    if (publicHost) hosts.add(publicHost);
  }
  return [...hosts];
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

  if (getUploadProvider(env) === "local") {
    return {
      config: {
        sizeLimit,
        security: UPLOAD_SECURITY,
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
  }

  const rootPath = env("R2_ROOT_PATH", "").trim();
  const cacheControl = env("R2_CACHE_CONTROL", DEFAULT_R2_CACHE_CONTROL).trim();

  return {
    config: {
      sizeLimit,
      security: UPLOAD_SECURITY,
      provider: "aws-s3",
      providerOptions: {
        baseUrl: removeTrailingSlash(env("R2_PUBLIC_URL", "").trim()),
        ...(rootPath ? { rootPath } : {}),
        s3Options: {
          credentials: {
            accessKeyId: env("R2_ACCESS_KEY_ID", "").trim(),
            secretAccessKey: env("R2_SECRET_ACCESS_KEY", "").trim(),
          },
          endpoint: r2Endpoint(env),
          forcePathStyle: env.bool("R2_FORCE_PATH_STYLE", false),
          region: env("R2_REGION", DEFAULT_R2_REGION),
          params: {
            Bucket: env("R2_BUCKET", "").trim(),
            ...(cacheControl ? { CacheControl: cacheControl } : {}),
            signedUrlExpires: env.int("R2_SIGNED_URL_EXPIRES", DEFAULT_SIGNED_URL_EXPIRES),
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
