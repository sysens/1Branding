/**
 * The One Guarantee single type, fetched once for the whole page: InfoSection,
 * GuaranteeMarquee, EarthDives, Reasons and BigPhotoo all read this one query
 * (same key) instead of five requests. `fallback` is the English entry, loaded
 * off English, for whatever the Russian entry lacks.
 */
export type OneGuaranteeMedia = { url?: string | null };

export type OneGuaranteeComment = {
  id?: string | number | null;
  authorFullName?: string | null;
  authorQuote?: string | null;
  authorPosition?: string | null;
};

export type OneGuaranteeCard = {
  title?: string | null;
  description?: string | null;
  icon?: OneGuaranteeMedia | null;
};

export type OneGuaranteeEntry = {
  section2?: {
    title?: string | null;
    text1?: string | null;
    text2?: string | null;
    text3?: string | null;
    text4?: string | null;
    text5?: string | null;
  } | null;
  section3?: { comment?: OneGuaranteeComment[] | null } | null;
  section4?: { title?: string | null; cards?: OneGuaranteeCard[] | null } | null;
  section5?: {
    title?: string | null;
    whyItWorks?: Array<{ text?: string | null; checkMark?: OneGuaranteeMedia | null }> | null;
  } | null;
  section6?: {
    title?: string | null;
    text?: string | null;
    buttonText?: string | null;
    buttonUrl?: string | null;
  } | null;
};

const SECTIONS = `
  section2 { title text1 text2 text3 text4 text5 }
  section3 { comment { id authorFullName authorQuote authorPosition } }
  section4 { title cards { title description icon { url } } }
  section5 { title whyItWorks { text checkMark { url } } }
  section6 { title text buttonText buttonUrl }
`;

const QUERY = `
  query OneGuaranteePage($locale: I18NLocaleCode, $withFallback: Boolean!) {
    oneGuarantee(locale: $locale) { ${SECTIONS} }
    fallbackOneGuarantee: oneGuarantee(locale: "en") @include(if: $withFallback) { ${SECTIONS} }
  }
`;

type OneGuaranteeResponse = {
  oneGuarantee?: OneGuaranteeEntry | null;
  fallbackOneGuarantee?: OneGuaranteeEntry | null;
};

export const useOneGuaranteePage = async () => {
  const { data } = await useCmsQuery<OneGuaranteeResponse>("one-guarantee", QUERY);
  return {
    own: computed(() => data.value?.data?.oneGuarantee ?? null),
    fallback: computed(() => data.value?.data?.fallbackOneGuarantee ?? null),
  };
};
