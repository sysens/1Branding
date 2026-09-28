import type { Core, Schema, UID } from "@strapi/strapi";

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

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    // Do not generate GraphQL queries or mutations for private submissions.
    strapi.plugin('graphql')?.service('extension')?.shadowCRUD(
      'api::contacts-request.contacts-request'
    ).disable();
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureDefaultSingleTypeDocuments(strapi);
  },
};
