import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: [],

    auth: {
      logo: '/logo.png', // login sahifadagi logo
    },

    menu: {
      logo: '/logo.png', // chap sidebar logosi
    },

    head: {
      favicon: '/logo.png',
      title: 'OneBranding Admin',
    },

    translations: {
      en: {
        'Auth.form.welcome.title': 'OneBranding Admin',
        'Auth.form.welcome.subtitle': 'Login to your OneBranding admin panel.',
      },
    },
  },
  bootstrap(app: StrapiApp) {
    console.log(app);
  },
};
