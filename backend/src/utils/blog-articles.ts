import type { Core } from "@strapi/strapi";

// Blog articles that answer the price and "what is the difference" questions
// people search for in Tashkent, in the site's three languages. Their facts
// (prices, what a logo includes, timelines) are the ones on the service and
// pricing pages. Each article is created once, on boot; the store remembers it,
// so an article renamed or deleted in the admin panel is never recreated.
//
// Text format, read by the article page (components/news/NewsHero.vue):
// paragraphs separated by blank lines, "## " starts a heading, "- " a list
// item, and [text](/path) is a link inside the site.
type Version = { title: string; text: string };
export type Article = {
  key: string;
  /** The article's address, /news/<slug>, in every language. */
  slug: string;
  /** Uploaded pictures by file name: the hero, then up to two more. */
  image: string;
  images: string[];
  en: Version;
  ru: Version;
  uz: Version;
};

const ARTICLES: Article[] = [
  {
    key: "logo-price-2026",
    slug: "logo-cost-tashkent-2026",
    image: "Raviosta",
    images: ["299", "streetvibe"],
    en: {
      title: "How much does a logo cost in Tashkent in 2026?",
      text: `A logo can cost almost nothing or several thousand dollars, and both prices can be honest. What changes is what you get for the money: a picture, or a sign that is built on research and works on every surface your brand will use. Here is how the price comes together, with OneBranding’s own prices as an example.

## Why logo prices differ so much

The cheapest logos come from templates, online generators or a quick job by a freelancer. That is enough to test an idea. The risk is a sign that looks like many others, says nothing about your business and has to be redrawn once you print packaging, put up a sign or register a trademark.

An agency price pays for the work around the drawing: understanding the business and its customers, studying competitors, finding the idea, testing the logo at small sizes and on real applications, and preparing every file you will need.

## What logo design includes at OneBranding

An individual logo at OneBranding starts at $900. That covers:

- a brief and research into your market and competitors;
- logo concepts built on one clear idea;
- rounds of revisions on the chosen concept;
- horizontal and vertical layouts and a compact sign;
- colour, one-colour and inverted versions;
- checks at small sizes and on real applications;
- basic usage rules: clear space, minimum size, backgrounds;
- final files in vector, print and web formats, plus the source files.

## What changes the final price

The final price is agreed after the brief. It depends on how much research the market needs, whether the brand also needs a name, how many applications the logo has to be shown on (packaging, signage, uniforms, a website), and whether you need a new sign or a redesign of one people already recognise.

## A logo alone or a branding package

A logo is enough to sign your work. Once you produce packaging, print, a website or social media posts, you also need colours, typography and graphics that work with it: a brand identity. For that OneBranding has branding packages: Launch Base from $1,900, One Pro from $2,900 and Global ultimate from $5,900. They include the logo together with the identity and the rules for using it.

## How long it takes

A logo designed together with a focused identity usually takes 2 to 6 weeks. For a logo on its own, the timeline is agreed after the brief, before the work starts.

## How to get a better logo for the same budget

- Describe your business, customers and competitors in the brief as precisely as you can.
- Decide early where the logo will appear: a sign, packaging, an app icon, social media.
- Let one person make the final decision.
- Ask which files you will receive, and check that the source files are included.

The details are on the [logo design page](/services/logo-design), and every package is on the [pricing page](/pricing).

Prices are starting prices in US dollars, as of 2026.`,
    },
    ru: {
      title: "Сколько стоит разработка логотипа в Ташкенте в 2026 году",
      text: `Логотип может стоить почти ничего или несколько тысяч долларов, и обе цены бывают честными. Разница в том, что вы получаете за эти деньги: картинку или знак, построенный на исследовании и работающий на любом носителе, где появится ваш бренд. Рассказываем, как складывается цена, на примере собственных цен OneBranding.

## Почему цены на логотип так сильно различаются

Самые дешёвые логотипы делают по шаблонам, в онлайн-генераторах или быстро у фрилансера. Чтобы проверить идею, этого достаточно. Риск в том, что знак похож на многие другие, ничего не говорит о вашем бизнесе, и его приходится перерисовывать, как только дело доходит до упаковки, вывески или регистрации товарного знака.

В цену агентства входит работа вокруг рисунка: понять бизнес и его клиентов, изучить конкурентов, найти идею, проверить логотип в маленьком размере и на реальных носителях и подготовить все нужные файлы.

## Что входит в разработку логотипа в OneBranding

Индивидуальный логотип в OneBranding стоит от $900. В эту цену входят:

- бриф и исследование вашего рынка и конкурентов;
- концепции логотипа, построенные на одной ясной идее;
- раунды правок выбранной концепции;
- горизонтальная и вертикальная компоновки и компактный знак;
- цветная, одноцветная и инверсная версии;
- проверка в маленьком размере и на реальных носителях;
- базовые правила: охранное поле, минимальный размер, фоны;
- итоговые файлы в векторе, для печати и веба, а также исходники.

## От чего зависит итоговая цена

Итоговую цену мы согласуем после брифа. Она зависит от того, насколько глубоко нужно изучить рынок, нужен ли бренду ещё и нейминг, на скольких носителях показать логотип (упаковка, вывеска, форма, сайт) и создаётся ли новый знак или обновляется уже узнаваемый.

## Только логотип или пакет брендинга

Логотипа достаточно, чтобы подписать вашу работу. Но как только появляются упаковка, полиграфия, сайт или посты в соцсетях, нужны ещё цвета, шрифты и графика, которые работают вместе с ним, — фирменный стиль. Для этого в OneBranding есть пакеты брендинга: Launch Base — от $1 900, One Pro — от $2 900 и Global ultimate — от $5 900. В них логотип входит вместе с фирменным стилем и правилами его использования.

## Сколько времени это занимает

Логотип вместе с фирменным стилем обычно занимает от 2 до 6 недель. Для отдельного логотипа сроки согласуем после брифа, до начала работы.

## Как получить логотип лучше за тот же бюджет

- Опишите в брифе бизнес, клиентов и конкурентов как можно точнее.
- Заранее решите, где будет логотип: вывеска, упаковка, иконка приложения, соцсети.
- Пусть окончательное решение принимает один человек.
- Уточните, какие файлы вы получите, и проверьте, что исходники входят в цену.

Подробности — на странице [разработки логотипа](/ru/services/razrabotka-logotipa), все пакеты — на странице [цен](/ru/pricing).

Цены указаны в долларах США как стартовые, по состоянию на 2026 год.`,
    },
    uz: {
      title: "2026-yilda Toshkentda logotip yaratish qancha turadi",
      text: `Logotip deyarli tekin ham, bir necha ming dollar ham turishi mumkin va ikkala narx ham halol boʻlishi mumkin. Farq pulga nima olishingizda: oddiy rasmmi yoki tadqiqotga asoslangan va brendingiz chiqadigan har qanday joyda ishlaydigan belgimi. Narx qanday shakllanishini OneBrandingʼning oʻz narxlari misolida tushuntiramiz.

## Nega logotip narxlari bunchalik farq qiladi

Eng arzon logotiplar shablonlar, onlayn generatorlar yoki frilanserning tezkor ishi orqali qilinadi. Gʻoyani sinab koʻrish uchun bu yetarli. Xavfi shundaki, belgi boshqa koʻplab belgilarga oʻxshaydi, biznesingiz haqida hech narsa aytmaydi va qadoq, peshlavha yoki tovar belgisini roʻyxatdan oʻtkazish vaqti kelganda uni qayta chizishga toʻgʻri keladi.

Agentlik narxiga rasm atrofidagi ish kiradi: biznes va uning mijozlarini tushunish, raqobatchilarni oʻrganish, gʻoyani topish, logotipni kichik oʻlchamda va real tashuvchilarda sinab koʻrish hamda kerakli barcha fayllarni tayyorlash.

## OneBrandingʼda logotip yaratishga nimalar kiradi

OneBrandingʼda individual logotip $900 dan boshlanadi. Bu narxga quyidagilar kiradi:

- bozoringiz va raqobatchilaringiz boʻyicha brif va tadqiqot;
- bitta aniq gʻoyaga qurilgan logotip konsepsiyalari;
- tanlangan konsepsiya boʻyicha tuzatish bosqichlari;
- gorizontal va vertikal joylashuv hamda ixcham belgi;
- rangli, bir rangli va inversiya versiyalari;
- kichik oʻlchamda va real tashuvchilarda tekshiruv;
- asosiy qoidalar: himoya maydoni, minimal oʻlcham, fonlar;
- vektor, chop etish va veb uchun yakuniy fayllar hamda manba fayllari.

## Yakuniy narx nimaga bogʻliq

Yakuniy narxni brifdan keyin kelishamiz. U bozorni qanchalik chuqur oʻrganish kerakligiga, brendga neyming ham kerakmi yoki yoʻqligiga, logotipni nechta tashuvchida koʻrsatish kerakligiga (qadoq, peshlavha, forma, sayt) hamda yangi belgi yaratilyaptimi yoki allaqachon tanilgan belgi yangilanyaptimi — shunga bogʻliq.

## Faqat logotipmi yoki brending paketi

Ishingizga imzo qoʻyish uchun logotip yetarli. Lekin qadoq, poligrafiya, sayt yoki ijtimoiy tarmoqlardagi postlar paydo boʻlishi bilan u bilan birga ishlaydigan ranglar, shriftlar va grafika — firma uslubi kerak boʻladi. Buning uchun OneBrandingʼda brending paketlari bor: Launch Base — $1 900 dan, One Pro — $2 900 dan va Global ultimate — $5 900 dan. Ularda logotip firma uslubi va undan foydalanish qoidalari bilan birga keladi.

## Qancha vaqt oladi

Firma uslubi bilan birga logotip odatda 2 haftadan 6 haftagacha vaqt oladi. Alohida logotip uchun muddatni brifdan keyin, ish boshlanishidan oldin kelishamiz.

## Shu byudjetga yaxshiroq logotip olish uchun

- Brifda biznesingiz, mijozlaringiz va raqobatchilaringizni iloji boricha aniq tasvirlang.
- Logotip qayerda boʻlishini oldindan hal qiling: peshlavha, qadoq, ilova belgisi, ijtimoiy tarmoqlar.
- Yakuniy qarorni bitta odam qabul qilsin.
- Qanday fayllar olishingizni soʻrang va manba fayllari narxga kirganini tekshiring.

Batafsil — [logotip yaratish sahifasida](/uz/services/logotip-yaratish), barcha paketlar — [narxlar sahifasida](/uz/pricing).

Narxlar AQSh dollarida, boshlangʻich narxlar, 2026-yil holatiga.`,
    },
  },
  {
    key: "logo-identity-brandbook",
    slug: "logo-identity-brand-book",
    image: "grechno",
    images: ["image_1", "Raviosta"],
    en: {
      title: "Logo, brand identity and brand book: what is the difference?",
      text: `Three words often get mixed up in a brief: logo, brand identity and brand book. They are three layers of one thing, and knowing which one you need saves both money and time.

## The logo: the sign

A logo is a single sign: a symbol, a wordmark or both. It tells people who you are and signs everything the brand makes. A good logo is simple, stands out in its category and stays recognisable at any size, in colour and in one colour.

## The brand identity: the system around the sign

A brand identity is the visual language around the logo: the colour palette, typefaces, graphic elements such as patterns, shapes and icons, the style of photography and illustration, and layout principles. It is what makes a menu, a box, a website and an Instagram post look like one brand even when the logo is not on them. The logo says who you are; the identity makes every touchpoint feel like you.

## The brand book: the rules

A brand book is the document that describes the identity. It shows the logo versions, clear space, minimum sizes and examples of misuse, the colour values for print and screen, the typographic hierarchy and how the elements come together on real applications. It usually also explains the brand’s idea, positioning and tone of voice. It exists so that any designer, printer or contractor uses the brand the same way.

## Which one you need

- Starting out and testing an idea: a logo with basic usage rules.
- Launching packaging, a website, signage or social media: a brand identity, so every piece looks consistent.
- Working with several designers, agencies, printers or branches: a brand book, so the brand stays the same in every hand.

## How they come together at OneBranding

At OneBranding a logo can be ordered on its own, from $900. A brand identity and a brand book are created within the branding packages: Launch Base from $1,900, One Pro from $2,900 and Global ultimate from $5,900. A focused identity usually takes 2 to 6 weeks.

More about each service: [logo design](/services/logo-design), [brand identity](/services/brand-identity) and [brand book](/services/brand-book).`,
    },
    ru: {
      title: "Логотип, фирменный стиль и брендбук: в чём разница",
      text: `В брифах часто путают три слова: логотип, фирменный стиль и брендбук. Это три слоя одного целого, и понимание того, что именно вам нужно, экономит и деньги, и время.

## Логотип — знак

Логотип — это один знак: символ, надпись или и то и другое. Он говорит, кто вы, и подписывает всё, что делает бренд. Хороший логотип простой, выделяется в своей категории и узнаётся в любом размере, в цвете и в одном цвете.

## Фирменный стиль — система вокруг знака

Фирменный стиль — это визуальный язык вокруг логотипа: цветовая палитра, шрифты, графические элементы (паттерны, формы, иконки), стиль фотографий и иллюстраций и принципы вёрстки. Благодаря ему меню, коробка, сайт и пост в Instagram выглядят как один бренд, даже если логотипа на них нет. Логотип говорит, кто вы, а фирменный стиль делает узнаваемой каждую точку контакта.

## Брендбук — правила

Брендбук — это документ, который описывает фирменный стиль. В нём показаны версии логотипа, охранное поле, минимальные размеры и примеры неправильного использования, значения цветов для печати и экрана, типографическая иерархия и то, как элементы работают на реальных носителях. Обычно брендбук объясняет и идею бренда, позиционирование и тон коммуникации. Он нужен, чтобы любой дизайнер, типография или подрядчик использовал бренд одинаково.

## Что нужно именно вам

- Вы только начинаете и проверяете идею — логотип с базовыми правилами.
- Запускаете упаковку, сайт, вывеску или соцсети — фирменный стиль, чтобы всё выглядело единообразно.
- Работаете с несколькими дизайнерами, агентствами, типографиями или филиалами — брендбук, чтобы бренд оставался одинаковым в любых руках.

## Как это устроено в OneBranding

В OneBranding логотип можно заказать отдельно — от $900. Фирменный стиль и брендбук создаются в рамках пакетов брендинга: Launch Base — от $1 900, One Pro — от $2 900 и Global ultimate — от $5 900. Фирменный стиль обычно занимает от 2 до 6 недель.

Подробнее о каждой услуге: [разработка логотипа](/ru/services/razrabotka-logotipa), [фирменный стиль](/ru/services/firmennyj-stil) и [брендбук](/ru/services/brendbuk).`,
    },
    uz: {
      title: "Logotip, firma uslubi va brendbuk: farqi nimada",
      text: `Briflarda uchta soʻz koʻpincha chalkashtiriladi: logotip, firma uslubi va brendbuk. Bular bitta butunning uch qatlami va sizga aynan qaysi biri kerakligini bilish pul ham, vaqt ham tejaydi.

## Logotip — belgi

Logotip — bu bitta belgi: ramz, yozuv yoki ikkalasi. U kimligingizni aytadi va brend qilgan hamma narsaga imzo boʻladi. Yaxshi logotip oddiy, oʻz toifasida ajralib turadi va har qanday oʻlchamda, rangli va bir rangli koʻrinishda taniladi.

## Firma uslubi — belgi atrofidagi tizim

Firma uslubi — logotip atrofidagi vizual til: rang palitrasi, shriftlar, grafik elementlar (naqshlar, shakllar, ikonkalar), fotosurat va illyustratsiya uslubi hamda joylashtirish tamoyillari. Uning yordamida menyu, quti, sayt va Instagramʼdagi post logotip boʻlmasa ham bitta brenddek koʻrinadi. Logotip kimligingizni aytadi, firma uslubi esa har bir aloqa nuqtasini tanish qiladi.

## Brendbuk — qoidalar

Brendbuk — firma uslubini tasvirlaydigan hujjat. Unda logotip versiyalari, himoya maydoni, minimal oʻlchamlar va notoʻgʻri foydalanish misollari, chop etish va ekran uchun rang qiymatlari, tipografik ierarxiya hamda elementlarning real tashuvchilarda qanday ishlashi koʻrsatiladi. Odatda brendbuk brend gʻoyasi, pozitsiyasi va muloqot ohangini ham tushuntiradi. U har qanday dizayner, bosmaxona yoki pudratchi brenddan bir xil foydalanishi uchun kerak.

## Sizga aynan nima kerak

- Endi boshlayapsiz va gʻoyani sinayapsiz — asosiy qoidalari bilan logotip.
- Qadoq, sayt, peshlavha yoki ijtimoiy tarmoqlarni ishga tushiryapsiz — hammasi bir xil koʻrinishi uchun firma uslubi.
- Bir nechta dizayner, agentlik, bosmaxona yoki filiallar bilan ishlaysiz — brend har qanday qoʻlda bir xil qolishi uchun brendbuk.

## OneBrandingʼda bu qanday ishlaydi

OneBrandingʼda logotipni alohida buyurtma qilish mumkin — $900 dan. Firma uslubi va brendbuk brending paketlari doirasida yaratiladi: Launch Base — $1 900 dan, One Pro — $2 900 dan va Global ultimate — $5 900 dan. Firma uslubi odatda 2 haftadan 6 haftagacha vaqt oladi.

Har bir xizmat haqida batafsil: [logotip yaratish](/uz/services/logotip-yaratish), [firma uslubi](/uz/services/firma-uslubi) va [brendbuk](/uz/services/brendbuk).`,
    },
  },
];

const NEWS = "api::news-page.news-page";
const FILE = "plugin::upload.file";
const STORE_KEY = "blog-articles";

// The CMS shipped with English and Russian only; Uzbek pages fell back to the
// English entries. Adding the locale changes nothing for entries without an
// Uzbek version: they still fall back.
export const ensureUzbekLocale = async (strapi: Core.Strapi): Promise<void> => {
  const locales = strapi.plugin("i18n").service("locales");
  if (await locales.findByCode("uz")) return;
  await locales.create({ code: "uz", name: "Uzbek (uz)" });
  strapi.log.info("Bootstrap added the uz locale");
};

// An uploaded picture by its file name (the part before the upload hash).
const fileId = async (strapi: Core.Strapi, name: string): Promise<number | null> => {
  const file = (await strapi.db.query(FILE).findOne({ where: { hash: { $startsWith: `${name}_` } } })) as { id: number } | null;
  return file?.id ?? null;
};

export const applyBlogArticles = async (strapi: Core.Strapi, articles: Article[]): Promise<void> => {
  const store = strapi.store({ type: "plugin", name: "onebranding" });
  const created = ((await store.get({ key: STORE_KEY })) as Record<string, string> | null) ?? {};
  const documents = strapi.documents(NEWS);

  for (const article of articles) {
    if (created[article.key]) continue;
    const image = await fileId(strapi, article.image);
    const images = (await Promise.all(article.images.map((name) => fileId(strapi, name)))).filter((id): id is number => id !== null);
    const media = { image, images };

    const document = (await documents.create({ locale: "en", data: { ...article.en, slug: article.slug, ...media } } as never)) as { documentId: string };
    for (const locale of ["ru", "uz"] as const) {
      await documents.update({ documentId: document.documentId, locale, data: { ...article[locale], slug: article.slug, ...media } } as never);
    }
    created[article.key] = document.documentId;
    await store.set({ key: STORE_KEY, value: created });
    strapi.log.info(`Bootstrap published the article ${article.key} (${document.documentId}) in en, ru and uz`);
  }
};

export const ensureBlogArticles = (strapi: Core.Strapi): Promise<void> => applyBlogArticles(strapi, ARTICLES);
