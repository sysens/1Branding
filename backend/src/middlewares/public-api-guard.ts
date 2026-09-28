/**
 * Closes content-API endpoints the website never uses to anonymous visitors,
 * independently of how the Public role is configured in the admin panel:
 *
 * - `/api/upload/files*`   lists, reads or deletes every uploaded file, including
 *                          applicants' briefs sent through the contact form;
 * - `/api/users*`, `/api/users-permissions/*` expose end users and roles;
 * - `POST /api/auth/local/register` creates accounts.
 *
 * The contact form's `POST /api/upload` and every page query keep working, and
 * requests that carry an `Authorization` header are left to Strapi's own
 * API-token / JWT permission checks. Oversized GraphQL documents are refused
 * before body parsing (the site's largest query is ~2 KB).
 */
const MAX_GRAPHQL_BODY_BYTES = 64 * 1024;

const isClosedToAnonymous = (method: string, path: string): boolean =>
  path === '/api/upload/files' ||
  path.startsWith('/api/upload/files/') ||
  path === '/api/users' ||
  path.startsWith('/api/users/') ||
  path.startsWith('/api/users-permissions/') ||
  (method === 'POST' && path === '/api/auth/local/register');

export default () => async (ctx: any, next: () => Promise<void>) => {
  const path: string = ctx.path.replace(/\/+$/, '') || '/';

  if (!ctx.get('Authorization') && isClosedToAnonymous(ctx.method, path)) {
    return ctx.throw(403, 'Forbidden');
  }

  if (ctx.method === 'POST' && path === '/graphql' &&
      Number(ctx.get('Content-Length')) > MAX_GRAPHQL_BODY_BYTES) {
    return ctx.throw(413, 'Request too large');
  }

  return next();
};
