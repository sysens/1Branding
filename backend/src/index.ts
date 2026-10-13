import type { Core, Schema, UID } from "@strapi/strapi";
import { checkUploadStorage } from "./utils/check-upload-storage";
import { removeOrphanContactUploads } from "./utils/contact-uploads";

const isApiSingleType = (
  uid: string,
  contentType: Schema.ContentType
): uid is UID.ContentType =>
  uid.startsWith("api::") && contentType.kind === "singleType";

const ensureSingleTypeDocument = async (
  strapi: Core.Strapi,
  uid: UID.ContentType
): Promise<void> => {
  const existingDocument = await strapi.documents(uid).findFirst();

  if (existingDocument) {
    return;
  }

  await strapi.documents(uid).create({ data: {} });
  strapi.log.info(`Bootstrap created missing single type document for ${uid}`);
};

const ensureDefaultSingleTypeDocuments = async (
  strapi: Core.Strapi
): Promise<void> => {
  const singleTypeUids = Object.entries(strapi.contentTypes)
    .filter(
      (entry): entry is [UID.ContentType, Schema.ContentType] =>
        isApiSingleType(entry[0], entry[1])
    )
    .map(([uid]) => uid);

  for (const uid of singleTypeUids) {
    await ensureSingleTypeDocument(strapi, uid);
  }
};

// The site has no end-user accounts, so public sign-up (enabled by default in
// Users & Permissions -> Advanced settings) is switched off on every boot.
const disablePublicRegistration = async (strapi: Core.Strapi): Promise<void> => {
  const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const advanced = (await store.get({ key: 'advanced' })) as Record<string, unknown> | null;
  if (!advanced || advanced.allow_register === false) return;
  await store.set({ key: 'advanced', value: { ...advanced, allow_register: false } });
  strapi.log.info('Bootstrap disabled public user registration');
};

// The secrets that sign admin sessions, API tokens and transfers. A value
// copied from .env.example / .env.railway.example is public, so anyone could
// forge an admin session with it.
const SECRET_KEYS = [
  "APP_KEYS",
  "ADMIN_JWT_SECRET",
  "API_TOKEN_SALT",
  "TRANSFER_TOKEN_SALT",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
];
const PLACEHOLDER = /tobemodified|change-?me|replace-?me|example|placeholder/i;

const reportWeakSecrets = (strapi: Core.Strapi): void => {
  if (process.env.NODE_ENV !== "production") return;
  const weak = SECRET_KEYS.filter((key) =>
    (process.env[key] ?? "")
      .split(",")
      .some((part) => part.trim().length < 16 || PLACEHOLDER.test(part))
  );
  // Logged rather than thrown: a crash loop would take the site down too.
  if (weak.length) {
    strapi.log.error(
      `Insecure secrets: ${weak.join(", ")} are missing, too short or copied from an example file. Set new random values.`
    );
  }
};

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    const graphqlExtension = strapi.plugin('graphql')?.service('extension');

    // Do not generate GraphQL queries or mutations for private submissions.
    graphqlExtension?.shadowCRUD('api::contacts-request.contacts-request').disable();

    // The upload plugin authorizes `updateUploadFile` with the same `upload`
    // scope the Public role needs for the contact form, which would let anyone
    // rename or re-caption any site media over /graphql. Restrict both media
    // mutations to API tokens; the website and admin panel do not use them.
    // The same applies to listing every uploaded file (applicants' briefs
    // included) and to the users-permissions API: the website only reads media
    // through page fields, which are resolved separately and stay public.
    // Paths that do not exist in the schema are ignored by the extension.
    const apiTokenOnly = { policies: ['global::api-token-only'] };
    graphqlExtension?.use({
      resolversConfig: Object.fromEntries([
        'Mutation.updateUploadFile',
        'Mutation.deleteUploadFile',
        'Query.uploadFile',
        'Query.uploadFiles',
        'Query.uploadFiles_connection',
        'Mutation.register',
        'Query.usersPermissionsUser',
        'Query.usersPermissionsUsers',
        'Query.usersPermissionsUsers_connection',
        'Query.usersPermissionsRole',
        'Query.usersPermissionsRoles',
        'Query.usersPermissionsRoles_connection',
        'Mutation.createUsersPermissionsUser',
        'Mutation.updateUsersPermissionsUser',
        'Mutation.deleteUsersPermissionsUser',
        'Mutation.createUsersPermissionsRole',
        'Mutation.updateUsersPermissionsRole',
        'Mutation.deleteUsersPermissionsRole',
      ].map((path) => [path, apiTokenOnly])),
    });
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    reportWeakSecrets(strapi);
    void checkUploadStorage(strapi);
    await ensureDefaultSingleTypeDocuments(strapi);
    await disablePublicRegistration(strapi);

    // Contact-form uploads never attached to a submission are deleted hourly.
    strapi.cron.add({
      contactUploadCleanup: {
        task: async () => {
          const removed = await removeOrphanContactUploads(strapi);
          if (removed) strapi.log.info(`Removed ${removed} unattached contact upload(s)`);
        },
        options: { rule: "17 * * * *" },
      },
    });
  },
};
