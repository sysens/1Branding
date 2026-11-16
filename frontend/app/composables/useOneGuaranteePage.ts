/**
 * What /one-guarantee takes from the CMS: the client reviews of the One
 * Guarantee single type (section3). The rest of the page is its own copy
 * (i18n oneGuarantee.*), after the design. `fallback` is the English entry,
 * loaded off English, for a language whose own entry has no reviews yet.
 */
export type OneGuaranteeComment = {
  id?: string | number | null;
  authorFullName?: string | null;
  authorQuote?: string | null;
  authorPosition?: string | null;
};

export type OneGuaranteeEntry = {
  section3?: { comment?: OneGuaranteeComment[] | null } | null;
};

const SECTIONS = `
  section3 { comment { id authorFullName authorQuote authorPosition } }
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
