import type { Core } from "@strapi/strapi";

// The five case studies were published with "Lorem ipsum" titles and text and a
// placeholder palette (five times #B9878A), in English only. Their pictures are
// real work: these texts describe what the pictures show (no results, dates or
// quotes are made up), and the palettes are sampled from them. On boot an entry
// still in Lorem gets this copy, a missing Russian or Uzbek version is created
// with the English entry's pictures, and an entry without a slug gets its one;
// anything edited in the admin panel is left alone.
type Copy = {
  title: string;
  intro: string;
  detailTitle: string;
  detail: string;
  paletteTitle: string;
  palette: string;
};
export type ProjectCopy = { documentId: string; slug: string; colors: string[]; en: Copy; ru: Copy; uz: Copy };

const PROJECTS: ProjectCopy[] = [
  {
    documentId: "m79mik1r5fuciwdthlp0w08n",
    slug: "poyqadam-brand-identity",
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
    uz: {
      title: "Poyqadam: logotip va firma uslubi",
      intro: "Poyqadam — «Yillar sinovidan oʻtgan taʼm» shiorli oziq-ovqat brendi. OneBranding unga shu gʻoya atrofida logotip va firma uslubi yaratdi: qoʻlda chizilgan naqsh uslubidagi emblema, baland ingichka harfli yozuv va har qanday tashuvchida tabiiy va ishonchli koʻrinadigan toʻq yashil rang.",
      detailTitle: "Emblema va yozuv",
      detail: "Emblema anʼanaviy naqsh kabi chizilgan va baland, teksturali bosh harflardagi yozuv yonida turadi. Nozik naqshli yashil fonda ikkalasi peshlavhadan tortib kichik yorliqqacha bitta belgi boʻlib oʻqiladi.",
      paletteTitle: "Rang palitrasi",
      palette: "Brend ikki toʻq yashil rangga tayanadi, matn va fonlar uchun och kulrang-yashil va oq ishlatiladi.",
    },
  },
  {
    documentId: "whppp7vemlh9ra7ufsf3z0ky",
    slug: "raviosta-restaurant-identity",
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
    uz: {
      title: "Raviosta: italyan restorani uchun logotip va firma uslubi",
      intro: "Raviosta — italyan oshxonasi restorani. Logotip R harfi va vilkani halqa ichidagi bitta monogrammaga birlashtiradi, yonida oqib turuvchi qoʻlyozma yozuv va «Italian cuisine» imzosi bor. Qizil, oq va yashil Italiyaga ishora qiladi, shuning uchun brend mehmon menyuni ochishidan oldin oshxona haqida aytib beradi.",
      detailTitle: "Monogramma",
      detail: "Vilka tishlari R harfidan oʻsib chiqadi, halqa esa ularni birlashtiradi, shuning uchun monogramma alohida ham ishlaydi: menyu muqovasida, salfetkada yoki yetkazib berish qutisida. Diagonal yashil qirra bayroqning uchinchi rangini qoʻshadi.",
      paletteTitle: "Rang palitrasi",
      palette: "Brendning asosiy rangi — iliq italyan qizili, yonida toʻq yashil va oq.",
    },
  },
  {
    documentId: "sfjntmxh23d1fwk50s3yrl08",
    slug: "rush-coffee-logo",
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
    uz: {
      title: "RUSH: qahva va muzqaymoq doʻkoni uchun logotip",
      intro: "RUSH — qahva va muzqaymoq doʻkoni. Yozuvda U harfi ichida qahva doni va ustida bugʻ koʻtarilayotgan chashkaga aylanadi, yonida oddiy bosh harflar va «Coffee | Ice cream» imzosi. Toʻq qahvarang fotosuratdagi iliq toʻq sariq rang brendga kechki kafe-bar kayfiyatini beradi.",
      detailTitle: "Yozuv",
      detail: "Faqat chashka toʻq sariq rangda, shuning uchun nigoh darhol qahvaga tushadi, nomning qolgan qismi esa oq va oddiy qoladi. Belgi toʻq fonda ham, stakanlar va peshlavhada ham birdek yaxshi ishlaydi.",
      paletteTitle: "Rang palitrasi",
      palette: "Deyarli qora va qahvarang tuslar kayfiyatni beradi, toʻq sariq brendni belgilaydi, oq — matn uchun.",
    },
  },
  {
    documentId: "n7rsuvvd1zyfkwzkm9knq3rn",
    slug: "street-vibe-tuning-logo",
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
    uz: {
      title: "Street Vibe Tuning: avto-tyuning studiyasi uchun logotip",
      intro: "Street Vibe Tuning — avto-tyuning studiyasi. Logotip koʻcha poygalari ruhidagi nishon sifatida yaratilgan: STREET uchun qalin qiya harflar, VIBE yozuvi va yulduzlar tushirilgan oltin lenta hamda pastda zich TUNING. Qora va oltin rang uni mashinaga yopishtirgingiz keladigan emblemaga oʻxshatadi.",
      detailTitle: "Nishon",
      detail: "Qiya shakl va oltin kontur nishonga tezlik va vazn beradi, shu bilan birga u stiker, ish kiyimi va garaj peshlavhasida ham oʻqiladi. Fondagi graffiti koʻcha madaniyatiga ishora qiladi.",
      paletteTitle: "Rang palitrasi",
      palette: "Brend qora va grafit rangga tayanadi, oltin va och oltin uni ajratib turadi, oq — matn uchun.",
    },
  },
  {
    documentId: "lf9kuj4v3r4cpaj46xyrnsso",
    slug: "grechno-brand-identity",
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
    uz: {
      title: "grechno: grechka mahsulotlari brendi uchun logotip va firma uslubi",
      intro: "grechno — «сытно · натурально · гречно» (toʻyimli, tabiiy, grechkali) shiorli grechka mahsulotlari brendi. Logotip katta yumshoq kichik g harfi va serifli yozuvni toʻq bordo fonda krem rangda birlashtiradi, shuning uchun brend iliq va uydagidek koʻrinadi hamda «foydali» ovqatning odatiy yashil rangidan ajralib turadi.",
      detailTitle: "g harfi",
      detail: "Katta g harfi kadr cheti bilan kesilgan va qadoq, kartochkalar va ijtimoiy tarmoqlarda brendning asosiy grafik elementi boʻlib ishlaydi, yonidagi yozuv esa kichik va osoyishta qoladi.",
      paletteTitle: "Rang palitrasi",
      palette: "Toʻq bordo tuslar va iliq krem: odatiy yashilsiz tabiiy mahsulot palitrasi.",
    },
  },
];

const PROJECT = "api::projects-page.projects-page";
const LOREM = /lorem ipsum/i;

type Media = { id: number } | null | undefined;
type ProjectEntry = {
  slug?: string | null;
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

    // The slug is shared by every language (/projects/<slug>).
    if (!en.slug) {
      await documents.update({ documentId, locale: "en", data: { slug: project.slug } } as never);
      strapi.log.info(`Bootstrap gave case study ${documentId} the slug ${project.slug}`);
    }

    if (LOREM.test(en.section1?.projectTitle ?? "")) {
      await documents.update({ documentId, locale: "en", data: localizedData(project.en, colors, en) } as never);
      strapi.log.info(`Bootstrap wrote the copy of case study ${documentId} (en)`);
    }

    for (const locale of ["ru", "uz"] as const) {
      if (await documents.findOne({ documentId, locale })) continue;
      // Strapi does not copy the shared slug into a new language version.
      await documents.update({ documentId, locale, data: { ...localizedData(project[locale], colors, en), slug: en.slug || project.slug } } as never);
      strapi.log.info(`Bootstrap created the ${locale} version of case study ${documentId}`);
    }
  }
};

export const ensureProjectCopy = (strapi: Core.Strapi): Promise<void> => applyProjectCopy(strapi, PROJECTS);
