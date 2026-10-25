import type { Core } from "@strapi/strapi";

// The five case studies were published with "Lorem ipsum" titles and text and a
// placeholder palette (five times #B9878A), in English only. Their pictures are
// real work: these texts describe what the pictures show (no results, dates or
// quotes are made up), and the palettes are sampled from them. On boot an entry
// still in Lorem gets this copy, and a missing Russian version is created with
// the English entry's pictures; anything edited in the admin panel is left alone.
type Copy = {
  title: string;
  intro: string;
  detailTitle: string;
  detail: string;
  paletteTitle: string;
  palette: string;
};
export type ProjectCopy = { documentId: string; colors: string[]; en: Copy; ru: Copy };

const PROJECTS: ProjectCopy[] = [
  {
    documentId: "m79mik1r5fuciwdthlp0w08n",
    colors: ["#00552A", "#006532", "#108943", "#C9DDD3", "#FFFFFF"],
    en: {
      title: "Poyqadam: logo and brand identity",
      intro: "Poyqadam is a food brand whose line “Yillar sinovidan o‘tgan ta’m” (a taste tested by years) speaks of tradition. OneBranding gave it a logo and a visual identity built around that idea: a handcrafted emblem, a bold condensed wordmark and a deep green that reads as natural and trustworthy on every surface.",
      detailTitle: "Emblem and wordmark",
      detail: "The emblem is drawn like a traditional ornament and sits beside a wordmark set in tall, textured capitals. On a green field with a faint pattern the two read as one sign, from a shop sign to a small label.",
      paletteTitle: "Colour palette",
      palette: "Two deep greens carry the brand, with a pale green-grey and white for type and backgrounds.",
    },
    ru: {
      title: "Poyqadam: логотип и фирменный стиль",
      intro: "Poyqadam — пищевой бренд со слоганом «Yillar sinovidan o‘tgan ta’m» («вкус, проверенный годами»). OneBranding разработали для него логотип и фирменный стиль вокруг этой идеи: эмблему в духе ручного орнамента, крупный узкий шрифтовой знак и глубокий зелёный цвет, который выглядит натуральным и надёжным на любом носителе.",
      detailTitle: "Эмблема и шрифтовой знак",
      detail: "Эмблема нарисована как традиционный орнамент и стоит рядом с надписью высокими фактурными заглавными буквами. На зелёном фоне с тонким узором они читаются как единый знак — от вывески до маленькой этикетки.",
      paletteTitle: "Цветовая палитра",
      palette: "Бренд держится на двух глубоких зелёных, а светлый серо-зелёный и белый работают для текста и фонов.",
    },
  },
  {
    documentId: "whppp7vemlh9ra7ufsf3z0ky",
    colors: ["#C22A2D", "#B72528", "#981719", "#2A613F", "#FFFFFF"],
    en: {
      title: "Raviosta: logo and identity for an Italian restaurant",
      intro: "Raviosta is an Italian restaurant. Its logo joins the letter R and a fork in one monogram inside a ring, with a flowing script wordmark and the line “Italian cuisine”. Red, white and green take their cue from Italy, so the brand says what it serves before a guest opens the menu.",
      detailTitle: "Monogram",
      detail: "The fork’s tines rise out of the R and the ring holds both together, so the monogram also works on its own: on a menu cover, a napkin or a delivery box. A diagonal green edge brings in the third colour of the flag.",
      paletteTitle: "Colour palette",
      palette: "A warm Italian red is the brand’s main colour, with a deep green and white beside it.",
    },
    ru: {
      title: "Raviosta: логотип и айдентика итальянского ресторана",
      intro: "Raviosta — ресторан итальянской кухни. Логотип соединяет букву R и вилку в одной монограмме внутри кольца, рядом — плавный рукописный шрифтовой знак и подпись «Italian cuisine». Красный, белый и зелёный отсылают к Италии, поэтому бренд говорит о кухне ещё до того, как гость откроет меню.",
      detailTitle: "Монограмма",
      detail: "Зубцы вилки вырастают из буквы R, а кольцо объединяет их, поэтому монограмма работает и отдельно: на обложке меню, салфетке или коробке доставки. Диагональная зелёная грань добавляет третий цвет флага.",
      paletteTitle: "Цветовая палитра",
      palette: "Главный цвет бренда — тёплый итальянский красный, рядом с ним глубокий зелёный и белый.",
    },
  },
  {
    documentId: "sfjntmxh23d1fwk50s3yrl08",
    colors: ["#060100", "#270601", "#593525", "#C96A1B", "#FFFFFF"],
    en: {
      title: "RUSH: logo for a coffee and ice cream place",
      intro: "RUSH is a coffee and ice cream place. Its wordmark turns the letter U into a cup with a coffee bean inside and steam rising above it, set among clean capitals with the line “Coffee | Ice cream”. A warm orange on dark, coffee-brown photography gives the brand an evening, café-bar mood.",
      detailTitle: "Wordmark",
      detail: "Only the cup is drawn in orange, so the eye goes straight to the coffee, while the rest of the name stays white and simple. The sign works as well on a dark background as on cups and signage.",
      paletteTitle: "Colour palette",
      palette: "Near-black and coffee browns set the mood, orange marks the brand, and white is for type.",
    },
    ru: {
      title: "RUSH: логотип кофейни с мороженым",
      intro: "RUSH — кофейня с мороженым. В шрифтовом знаке буква U превращается в чашку с кофейным зерном и паром над ней, рядом — простые заглавные буквы и подпись «Coffee | Ice cream». Тёплый оранжевый на тёмной кофейной фотографии задаёт бренду вечернее настроение кафе-бара.",
      detailTitle: "Шрифтовой знак",
      detail: "Оранжевым выделена только чашка, поэтому взгляд сразу находит кофе, а остальная надпись остаётся белой и простой. Знак одинаково хорошо работает на тёмном фоне, стаканах и вывеске.",
      paletteTitle: "Цветовая палитра",
      palette: "Почти чёрный и кофейные коричневые задают настроение, оранжевый отмечает бренд, белый — для текста.",
    },
  },
  {
    documentId: "n7rsuvvd1zyfkwzkm9knq3rn",
    colors: ["#080808", "#161616", "#B8860B", "#F8E886", "#FEFEFE"],
    en: {
      title: "Street Vibe Tuning: logo for a car tuning studio",
      intro: "Street Vibe Tuning is a car tuning studio. Its logo is a badge in the spirit of street racing: bold slanted letters for STREET, a gold banner with VIBE and stars, and TUNING set solid below. Black and gold make it look like an emblem you would put on a car.",
      detailTitle: "Badge",
      detail: "The angled shape and the gold outline give the badge speed and weight, and it stays legible as a sticker, on workwear or on a garage sign. A brushed graffiti mark behind it nods to street culture.",
      paletteTitle: "Colour palette",
      palette: "Black and graphite carry the brand, gold and a light gold accent mark it, and white is for type.",
    },
    ru: {
      title: "Street Vibe Tuning: логотип студии автотюнинга",
      intro: "Street Vibe Tuning — студия автотюнинга. Логотип сделан как значок в духе уличных гонок: жирные наклонные буквы STREET, золотая лента с надписью VIBE и звёздами и плотное TUNING снизу. Чёрный и золотой делают его похожим на эмблему, которую хочется наклеить на машину.",
      detailTitle: "Значок",
      detail: "Скошенная форма и золотой контур придают значку скорость и вес, при этом он читается и как наклейка, и на спецодежде, и на вывеске гаража. Граффити на фоне отсылает к уличной культуре.",
      paletteTitle: "Цветовая палитра",
      palette: "Бренд держится на чёрном и графитовом, золотой и светло-золотой выделяют его, белый — для текста.",
    },
  },
  {
    documentId: "lf9kuj4v3r4cpaj46xyrnsso",
    colors: ["#6D0019", "#870422", "#A3062B", "#8E1F3D", "#FFFBEF"],
    en: {
      title: "grechno: logo and identity for a buckwheat food brand",
      intro: "grechno is a food brand built around buckwheat, with the line “сытно · натурально · гречно” (filling, natural, buckwheat). Its logo pairs a large, soft lowercase g with a serif wordmark, cream on a deep burgundy, so the brand feels warm and homely and stands apart from the usual green of healthy food.",
      detailTitle: "The letter g",
      detail: "The oversized g is cropped by the edge of the frame and works as the brand’s main graphic element, on packaging, cards and social posts, while the wordmark beside it stays small and calm.",
      paletteTitle: "Colour palette",
      palette: "Deep burgundy reds and a warm cream: a palette for a natural product without the usual green.",
    },
    ru: {
      title: "grechno: логотип и айдентика бренда продуктов из гречки",
      intro: "grechno — продуктовый бренд вокруг гречки со слоганом «сытно · натурально · гречно». Логотип сочетает крупную мягкую строчную букву g и шрифтовой знак с засечками, кремовым на глубоком бордовом, поэтому бренд выглядит тёплым и домашним и выделяется среди привычного зелёного «полезной» еды.",
      detailTitle: "Буква g",
      detail: "Крупная g обрезана краем кадра и работает как главный графический элемент бренда — на упаковке, карточках и в соцсетях, а шрифтовой знак рядом остаётся небольшим и спокойным.",
      paletteTitle: "Цветовая палитра",
      palette: "Глубокие бордовые и тёплый кремовый: палитра натурального продукта без привычного зелёного.",
    },
  },
];

const PROJECT = "api::projects-page.projects-page";
const LOREM = /lorem ipsum/i;

type Media = { id: number } | null | undefined;
type ProjectEntry = {
  section1?: { projectTitle?: string | null; images?: Media[] | null } | null;
  section2?: { image?: Media } | null;
} | null;

const POPULATE = { section1: { populate: ["images"] }, section2: { populate: ["image"] } };

// The localized fields of an entry, with the pictures of `source`.
const localizedData = (copy: Copy, colors: string[], source: ProjectEntry) => ({
  section1: {
    projectTitle: copy.title,
    text: copy.intro,
    images: (source?.section1?.images ?? []).flatMap((file) => (file ? [file.id] : [])),
  },
  section2: { title: copy.detailTitle, text: copy.detail, image: source?.section2?.image?.id ?? null },
  section3: { title: copy.paletteTitle, text: copy.palette, colorCard: colors.map((HexColorCode) => ({ HexColorCode })) },
});

export const applyProjectCopy = async (strapi: Core.Strapi, projects: ProjectCopy[]): Promise<void> => {
  const documents = strapi.documents(PROJECT);

  for (const project of projects) {
    const { documentId, colors } = project;
    const en = (await documents.findOne({ documentId, locale: "en", populate: POPULATE } as never)) as ProjectEntry;
    if (!en) continue;

    if (LOREM.test(en.section1?.projectTitle ?? "")) {
      await documents.update({ documentId, locale: "en", data: localizedData(project.en, colors, en) } as never);
      strapi.log.info(`Bootstrap wrote the copy of case study ${documentId} (en)`);
    }

    const ru = await documents.findOne({ documentId, locale: "ru" });
    if (!ru) {
      await documents.update({ documentId, locale: "ru", data: localizedData(project.ru, colors, en) } as never);
      strapi.log.info(`Bootstrap created the ru version of case study ${documentId}`);
    }
  }
};

export const ensureProjectCopy = (strapi: Core.Strapi): Promise<void> => applyProjectCopy(strapi, PROJECTS);
