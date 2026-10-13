/**
 * The About Us single type, fetched once for the page (BigPhoto, TwoFlex and
 * ThreePic share this query). Off English, an empty Russian entry falls back
 * to the English one as a whole.
 */
export type AboutImage = { url?: string | null; alternativeText?: string | null };

export type AboutPageEntry = {
  documentId?: string | null;
  section1?: { id?: string | number | null; title?: string | null; image?: AboutImage | null } | null;
  section2?: Array<{ title?: string | null; text?: string | null; image?: AboutImage | null }> | null;
  section3?: { title?: string | null; subTitle?: string | null; creatorsImages?: AboutImage[] | null } | null;
};

const FIELDS = `
  documentId
  section1 { id title image { url alternativeText } }
  section2 { title text image { url alternativeText } }
  section3 { title subTitle creatorsImages { url alternativeText } }
`;

const QUERY = `
  query AboutPage($locale: I18NLocaleCode, $withFallback: Boolean!) {
    aboutPage(locale: $locale) { ${FIELDS} }
    fallbackAboutPage: aboutPage(locale: "en") @include(if: $withFallback) { ${FIELDS} }
  }
`;

type AboutPageResponse = {
  aboutPage?: AboutPageEntry | null;
  fallbackAboutPage?: AboutPageEntry | null;
};

export const useAboutPage = async () => {
  const { data } = await useCmsQuery<AboutPageResponse>("about-page", QUERY);
  return {
    aboutPage: computed(() => data.value?.data?.aboutPage ?? data.value?.data?.fallbackAboutPage ?? null),
  };
};
