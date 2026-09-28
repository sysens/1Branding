import {
  buildUploadSecurityMiddleware,
  getUploadLimitLabel,
  getUploadMaxFileSizeBytes,
  type StrapiEnv,
} from "./upload";

const getAllowedOrigins = (env: StrapiEnv): string[] => {
  const defaults = env("NODE_ENV", "development") === "production"
    ? ""
    : "http://localhost:3000,http://127.0.0.1:3000";

  return env("CORS_ORIGINS", defaults)
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter((origin) => {
      try {
        const url = new URL(origin);
        return (url.protocol === "https:" || url.protocol === "http:") &&
          url.origin === origin;
      } catch {
        return false;
      }
    });
};

export default ({ env }: { env: StrapiEnv }) => [
  "strapi::logger",
  "strapi::errors",
  buildUploadSecurityMiddleware(env),
  {
    name: "strapi::cors",
    config: {
      origin: getAllowedOrigins(env),
      credentials: false,
    },
  },
  "strapi::poweredBy",
  "strapi::query",
  { name: "global::contact-protection", config: { phase: "pre" } },
  {
    name: "strapi::body",
    config: {
      formLimit: getUploadLimitLabel(env),
      jsonLimit: "2mb",
      textLimit: "2mb",
      formidable: {
        maxFileSize: getUploadMaxFileSizeBytes(env),
      },
    },
  },
  { name: "global::contact-protection", config: { phase: "validate" } },
  "strapi::session",
  {
    name: "strapi::favicon",
    config: {
      path: "public/favicon.ico",
    },
  },
  "strapi::public",
];
