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
 * requests that carry a bearer token are left to Strapi's own API-token / JWT
 * permission checks (an invalid token gets a 401 there). Any other
 * `Authorization` value is ignored by Strapi, which then treats the request as
 * Public, so it does not open these paths. Oversized GraphQL documents are
 * refused before body parsing (the site's largest query is ~2 KB).
 *
 * Multipart bodies are parsed, and written to disk, before any route or
 * permission check runs. Anonymous visitors only ever upload through the
 * contact form's `POST /api/upload` (capped at 10 MB by contact-protection);
 * the admin panel and API tokens send a bearer token. Any other anonymous
 * multipart request is refused before it is read.
 */
import { routePath } from '../utils/route-path';

const MAX_GRAPHQL_BODY_BYTES = 64 * 1024;

const hasBearerToken = (ctx: any): boolean => /^Bearer\s+\S+$/i.test(ctx.get('Authorization'));

const isClosedToAnonymous = (method: string, path: string): boolean =>
  path === '/api/upload/files' ||
  path.startsWith('/api/upload/files/') ||
  path === '/api/users' ||
  path.startsWith('/api/users/') ||
  path.startsWith('/api/users-permissions/') ||
  (method === 'POST' && path === '/api/auth/local/register');

export default () => async (ctx: any, next: () => Promise<void>) => {
  const path = routePath(ctx.path);

  if (!hasBearerToken(ctx) && isClosedToAnonymous(ctx.method, path)) {
    return ctx.throw(403, 'Forbidden');
  }

  if (!hasBearerToken(ctx) && ctx.is('multipart') &&
      !(ctx.method === 'POST' && path === '/api/upload')) {
    return ctx.throw(415, 'Unsupported Media Type');
  }

  if (ctx.method === 'POST' && path === '/graphql') {
    // Without a length (a chunked body) the limit could not be checked before
    // the whole body is read. Browsers and the site's server always send one.
    if (!/^\d+$/.test(ctx.get('Content-Length')) || ctx.get('Transfer-Encoding')) {
      return ctx.throw(411, 'Content-Length required');
    }
    if (Number(ctx.get('Content-Length')) > MAX_GRAPHQL_BODY_BYTES) {
      return ctx.throw(413, 'Request too large');
    }
  }

  return next();
};
