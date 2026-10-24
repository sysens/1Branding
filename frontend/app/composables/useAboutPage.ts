/**
 * The About Us single type, fetched once for the page (BigPhoto, TwoFlex and
 * ThreePic share this query). A language without its own entry shows the
 * English entry's pictures with its own copy from i18n (aboutPage.cms).
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
  // Before the await: after it a composable has no current component instance.
  const { t, tm, rt } = useI18n();
  const { data } = await useCmsQuery<AboutPageResponse>("about-page", QUERY);
  return {
    aboutPage: computed<AboutPageEntry | null>(() => {
      const own = data.value?.data?.aboutPage;
      if (own) return own;
      const fallback = data.value?.data?.fallbackAboutPage;
      if (!fallback) return null;
      // Another language without its own entry: the English entry's pictures
      // with the page's own copy (i18n aboutPage.cms), not English text.
      const blocks = tm("aboutPage.cms.section2") as Array<{ title: unknown; text: unknown }>;
      return {
        ...fallback,
        section1: fallback.section1 ? { ...fallback.section1, title: t("aboutPage.cms.section1Title") } : fallback.section1,
        section2: (fallback.section2 ?? []).map((block, index) => ({
          ...block,
          title: blocks[index] ? rt(blocks[index].title as never) : block.title,
          text: blocks[index] ? rt(blocks[index].text as never) : block.text,
        })),
        section3: fallback.section3 ? {
          ...fallback.section3,
          title: t("aboutPage.cms.section3Title"),
          subTitle: t("aboutPage.cms.section3Text"),
        } : fallback.section3,
      };
    }),
  };
};
