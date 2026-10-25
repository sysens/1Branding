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
];

// A Russian word left in the English article ("more contrasted, насыщенный and
// confident"); replaced once, so a later edit in the admin panel stays.
const TEXT_FIXES: TextFix[] = [
  { documentId: "zztkud74sbscajz3k646rykf", locale: "en", from: "more contrasted, насыщенный and confident", to: "more contrasted, richer and more confident" },
];

const NEWS = "api::news-page.news-page";

type Media = { id: number } | null | undefined;
type NewsEntry = { text?: string | null; image?: Media; images?: Media[] | null } | null;

export const applyNewsTranslations = async (
  strapi: Core.Strapi,
  translations: Translation[],
  fixes: TextFix[],
): Promise<void> => {
  const documents = strapi.documents(NEWS);

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
  applyNewsTranslations(strapi, TRANSLATIONS, TEXT_FIXES);
