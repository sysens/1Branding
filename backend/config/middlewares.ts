import {
  buildUploadSecurityMiddleware,
  getUploadLimitLabel,
  getUploadMaxFileSizeBytes,
  type StrapiEnv,
} from "./upload";

export default ({ env }: { env: StrapiEnv }) => [
  "strapi::logger",
  "strapi::errors",
  buildUploadSecurityMiddleware(env),
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::query",
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
  "strapi::session",
  {
    name: "strapi::favicon",
    config: {
      path: "public/favicon.ico",
    },
  },
  "strapi::public",
];
