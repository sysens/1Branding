/**
 * Allows a request only when it was authenticated with a Strapi API token.
 *
 * Used to keep media-management GraphQL mutations away from the Public role,
 * which must hold `plugin::upload.content-api.upload` for the contact form.
 * Strapi 5 names the API-token auth strategy `content-api-token`
 * (@strapi/admin server/src/strategies/content-api-token).
 */
export default (policyContext: { state?: { auth?: { strategy?: { name?: string } } } }) =>
  policyContext.state?.auth?.strategy?.name === 'content-api-token';
