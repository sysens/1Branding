/**
 * contacts-request router
 */

import { factories } from '@strapi/strapi';

// Contact submissions are write-only over the public content API. This does not
// change any existing production Users & Permissions roles or API tokens.
export default factories.createCoreRouter('api::contacts-request.contacts-request', {
  only: ['create'],
});
