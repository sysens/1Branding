import type { Core } from "@strapi/strapi";

// Language versions of news articles that were published in English only: the
// site's /ru/news showed the English text, so search engines saw an untranslated
// page. Each version is created once, on boot, when it does not exist yet, with
// the English entry's pictures; after that it is edited in the admin panel like
// any other entry and never overwritten here.
export type Translation = { documentId: string; locale: string; title: string; text: string };
export type TextFix = { documentId: string; locale: string; from: string; to: string };

const TRANSLATIONS: Translation[] = [
  {
    documentId: "zztkud74sbscajz3k646rykf",
    locale: "ru",
    title: "Как Pepsi обновила фирменный стиль в 2025 году",
    text: [
      "В 2025 году Pepsi представила обновлённый фирменный стиль: бренд вернулся к своему наследию и при этом усилил современный характер. Новый дизайн по-новому прочитывает классический логотип: он стал контрастнее, насыщеннее и увереннее. Центральный элемент, узнаваемый круг с красно-бело-синей волной, получил более выразительную графику и чёткие формы, поэтому бренд лучше заметен и в цифровой среде, и на полке.",
      "Особое внимание уделили типографике. Новый шрифт жирнее и выразительнее, он подчёркивает энергию и смелость бренда. Вместе с глубокими цветами и минималистичным подходом это создаёт сильный визуальный язык, который легко переносится на упаковку, рекламу и медиа.",
      "Обновление отражает и стратегию Pepsi: стать ближе к новой аудитории, сохранив узнаваемость и наследие. Это баланс между ностальгией и современностью, в котором классические элементы становятся инструментом для будущего.",
      "В итоге бренд выглядит громче, увереннее и актуальнее, оставаясь верным своей ДНК.",
    ].join("\n\n"),
  },
  {
    documentId: "zztkud74sbscajz3k646rykf",
    locale: "uz",
    title: "Pepsi 2025-yilda firma uslubini qanday yangiladi",
    text: [
      "2025-yilda Pepsi yangilangan firma uslubini taqdim etdi: brend oʻz merosiga qaytdi va zamonaviy xarakterini kuchaytirdi. Yangi dizayn klassik logotipni yangicha talqin qiladi: u kontrastliroq, toʻyinganroq va ishonchliroq boʻldi. Markaziy element — qizil-oq-koʻk toʻlqinli taniqli doira — yanada ifodali grafika va aniq shakllarga ega boʻldi, shuning uchun brend raqamli muhitda ham, peshtaxtada ham yaxshiroq koʻzga tashlanadi.",
      "Tipografikaga alohida eʼtibor qaratildi. Yangi shrift qalinroq va ifodaliroq, u brendning energiyasi va jasoratini taʼkidlaydi. Toʻq ranglar va minimalistik yondashuv bilan birga bu qadoq, reklama va mediaga oson koʻchadigan kuchli vizual tilni yaratadi.",
      "Yangilanish Pepsi strategiyasini ham aks ettiradi: tanilishi va merosini saqlagan holda yangi auditoriyaga yaqinlashish. Bu nostalgiya va zamonaviylik oʻrtasidagi muvozanat boʻlib, unda klassik elementlar kelajak uchun vositaga aylanadi.",
      "Natijada brend baland ovozliroq, ishonchliroq va dolzarbroq koʻrinadi va oʻz DNKsiga sodiq qoladi.",
    ].join("\n\n"),
  },
];

// Readable addresses (/news/<slug>) for articles published without one; the
// slug is shared by every language.
const SLUGS: Array<{ documentId: string; slug: string }> = [
  { documentId: "zztkud74sbscajz3k646rykf", slug: "pepsi-brand-identity-2025" },
];

// A Russian word left in the English article ("more contrasted, насыщенный and
// confident"); replaced once, so a later edit in the admin panel stays.
const TEXT_FIXES: TextFix[] = [
  { documentId: "zztkud74sbscajz3k646rykf", locale: "en", from: "more contrasted, насыщенный and confident", to: "more contrasted, richer and more confident" },
];

const NEWS = "api::news-page.news-page";

type Media = { id: number } | null | undefined;
type NewsEntry = { slug?: string | null; text?: string | null; image?: Media; images?: Media[] | null } | null;

export const applyNewsTranslations = async (
  strapi: Core.Strapi,
  translations: Translation[],
  fixes: TextFix[],
  slugs: Array<{ documentId: string; slug: string }> = [],
): Promise<void> => {
  const documents = strapi.documents(NEWS);

  for (const { documentId, slug } of slugs) {
    const entry = (await documents.findOne({ documentId, locale: "en" })) as { slug?: string | null } | null;
    if (!entry || entry.slug) continue;
    await documents.update({ documentId, locale: "en", data: { slug } } as never);
    strapi.log.info(`Bootstrap gave news article ${documentId} the slug ${slug}`);
  }

  for (const { documentId, locale, title, text } of translations) {
    const existing = await documents.findOne({ documentId, locale });
    if (existing) continue;
    const source = (await documents.findOne({ documentId, locale: "en", populate: ["image", "images"] })) as NewsEntry;
    if (!source) continue;
    await documents.update({
      documentId,
      locale,
      data: {
        title,
        text,
        // Strapi does not copy the shared slug into a new language version.
        slug: source.slug ?? null,
        image: source.image?.id ?? null,
        images: (source.images ?? []).flatMap((file) => (file ? [file.id] : [])),
      },
    } as never);
    strapi.log.info(`Bootstrap created the ${locale} version of news article ${documentId}`);
  }

  for (const { documentId, locale, from, to } of fixes) {
    const entry = (await documents.findOne({ documentId, locale })) as NewsEntry;
    if (!entry?.text?.includes(from)) continue;
    await documents.update({ documentId, locale, data: { text: entry.text.replace(from, to) } } as never);
    strapi.log.info(`Bootstrap fixed the text of news article ${documentId} (${locale})`);
  }
};

export const ensureNewsTranslations = (strapi: Core.Strapi): Promise<void> =>
  applyNewsTranslations(strapi, TRANSLATIONS, TEXT_FIXES, SLUGS);
