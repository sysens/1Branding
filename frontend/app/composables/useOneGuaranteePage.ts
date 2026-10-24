/**
 * The One Guarantee single type, fetched once for the whole page: InfoSection,
 * GuaranteeMarquee, EarthDives, Reasons and BigPhoto all read this one query
 * (same key) instead of five requests. `fallback` is the English entry, loaded
 * off English, for whatever the page's own entry lacks, with the page's own
 * copy in place of its text (see withCopy).
 */
import { isPlaceholderCopy } from "~/utils/seo";

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

type Copy = {
  section4: { title: string; cards: Array<{ title: string; description: string }> };
  section5: { items: string[] };
  section6: { title: string; text: string; buttonText: string };
};

/**
 * The page's own copy (i18n oneGuarantee.cms) laid over an entry: over the
 * English entry on another language's page every text is replaced, so the
 * page reads in its language with the entry's pictures and links; over the
 * page's own entry only empty or placeholder text is ("ButtonEn", Lorem
 * ipsum, the repeated reason).
 */
const withCopy = (entry: OneGuaranteeEntry | null | undefined, copy: Copy, replaceAll: boolean): OneGuaranteeEntry | null => {
  if (!entry) return null;
  const pick = (value: string | null | undefined, local: string | undefined) => {
    const text = cmsText(value);
    return !replaceAll && text && !isPlaceholderCopy(text) ? text : local ?? text;
  };
  const reasons = entry.section5?.whyItWorks ?? [];
  const icon = reasons.find((item) => item?.checkMark?.url)?.checkMark ?? null;
  const ownReasons = [...new Set(reasons.map((item) => cmsText(item?.text)).filter((text) => text && !isPlaceholderCopy(text)))];
  return {
    ...entry,
    section4: entry.section4 ? {
      ...entry.section4,
      title: pick(entry.section4.title, copy.section4.title),
      cards: (entry.section4.cards ?? []).map((card, index) => ({
        ...card,
        title: pick(card.title, copy.section4.cards[index]?.title),
        description: pick(card.description, copy.section4.cards[index]?.description),
      })),
    } : entry.section4,
    section5: entry.section5 ? {
      ...entry.section5,
      whyItWorks: (!replaceAll && ownReasons.length ? ownReasons : copy.section5.items).map((text) => ({ text, checkMark: icon })),
    } : entry.section5,
    section6: entry.section6 ? {
      ...entry.section6,
      title: pick(entry.section6.title, copy.section6.title),
      text: pick(entry.section6.text, copy.section6.text),
      buttonText: pick(entry.section6.buttonText, copy.section6.buttonText),
    } : entry.section6,
  };
};

export const useOneGuaranteePage = async () => {
  // Before the await: after it a composable has no current component instance.
  const { tm, rt } = useI18n();
  const { data } = await useCmsQuery<OneGuaranteeResponse>("one-guarantee", QUERY);
  const copy = computed<Copy>(() => {
    const raw = tm("oneGuarantee.cms") as Record<string, never>;
    const text = (value: unknown) => (typeof value === "string" ? value : rt(value as never));
    const section4 = raw.section4 as unknown as { title: unknown; cards: Array<{ title: unknown; description: unknown }> };
    const section5 = raw.section5 as unknown as { items: unknown[] };
    const section6 = raw.section6 as unknown as { title: unknown; text: unknown; buttonText: unknown };
    return {
      section4: { title: text(section4.title), cards: section4.cards.map((card) => ({ title: text(card.title), description: text(card.description) })) },
      section5: { items: section5.items.map(text) },
      section6: { title: text(section6.title), text: text(section6.text), buttonText: text(section6.buttonText) },
    };
  });
  return {
    own: computed(() => withCopy(data.value?.data?.oneGuarantee, copy.value, false)),
    fallback: computed(() => withCopy(data.value?.data?.fallbackOneGuarantee, copy.value, true)),
  };
};
