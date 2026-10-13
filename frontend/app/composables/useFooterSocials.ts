/**
 * Social links from the Footer single type (the site footer and the Contacts
 * page share this query); off English an empty entry falls back to English.
 */
export type SocialLinks = {
  telegramLink?: string | null;
  instagramLink?: string | null;
  behanceLink?: string | null;
  linkedinLink?: string | null;
};

const QUERY = `
  query FooterSocials($locale: I18NLocaleCode, $withFallback: Boolean!) {
    footer(locale: $locale) { socialMedia { telegramLink instagramLink behanceLink linkedinLink } }
    fallbackFooter: footer(locale: "en") @include(if: $withFallback) {
      socialMedia { telegramLink instagramLink behanceLink linkedinLink }
    }
  }
`;

type FooterSocialsResponse = {
  footer?: { socialMedia?: SocialLinks | null } | null;
  fallbackFooter?: { socialMedia?: SocialLinks | null } | null;
};

export const useFooterSocials = async () => {
  const { data } = await useCmsQuery<FooterSocialsResponse>("footer-socials", QUERY);
  return {
    socialMedia: computed<SocialLinks | null>(
      () => data.value?.data?.footer?.socialMedia ?? data.value?.data?.fallbackFooter?.socialMedia ?? null
    ),
  };
};
