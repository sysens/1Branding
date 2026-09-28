/**
 * Allows a request only when it was authenticated with a Strapi API token.
 *
 * Used to keep media-management GraphQL mutations away from the Public role,
 * which must hold `plugin::upload.content-api.upload` for the contact form.
 */
export default (policyContext: { state?: { auth?: { strategy?: { name?: string } } } }) =>
  policyContext.state?.auth?.strategy?.name === 'api-token';
