# SEO komponentlarini birlashtirish: production rejasi

Migratsiya: [`database/migrations/202610140001_merge_seo_components.js`](../database/migrations/202610140001_merge_seo_components.js)

## Nima o'zgaradi

- `seo.landing-page`, `seo.about-page`, `seo.price-page`, `seo.one-guarantee-page`,
  `seo.contacts-page` (beshtasi ham `title` + `description`) bitta `shared.seo` komponentiga
  aylanadi. SEO single type'dagi maydon nomlari (`landingPage`, `aboutPage`, ...) o'zgarmaydi,
  shuning uchun GraphQL/REST javobi bir xil qoladi va frontendni alohida deploy qilish shart emas.
- Hech bir content type ishlatmaydigan komponentlar o'chiriladi: `contacts-page.write-to-one-brending`,
  `contacts-page.topic`, `contacts-page.requested-services-message`, `contacts-page.contact`,
  `landing-page.projects-images`, `landing-page.tools`.
- Backend ishga tushganda migratsiya schema sinxronizatsiyasidan **oldin**, bitta tranzaksiyada
  ishlaydi: `components_shared_seos` jadvalini yaratadi, `seos_cmps` bog'lagan har bir SEO yozuvini
  (en va ru) ko'chiradi va bog'lanishni yangi qatorga ulaydi. Keyin Strapi eski jadvallarni o'zi
  o'chiradi. Migratsiya xato bersa tranzaksiya qaytariladi, backend ishga tushmaydi va Railway
  trafikni eski deployda qoldiradi.

Lokal sinov (2026-10-14): eski kod bilan SQLite, Postgres 16 va Postgres 18 (prod versiyasi) bazalarida en/ru SEO yozildi, nusxasida
yangi kod ishga tushirildi. GraphQL, REST va document service javoblari oldin va keyin bir xil
(komponent `id`laridan tashqari), qayta ishga tushirishda migratsiya takrorlanmaydi, admin
orqali tahrirlash ishlaydi, yangi jadval Strapi o'zi yaratadigan bilan bir xil.

## 1. Backup (birinchi qadam, majburiy)

Workspace Hobby rejasida: Railway volume backup'lari yo'q (limit 0). Shuning uchun backup
vaqtinchalik `pg-backup` servisi bilan olindi (2026-10-13 19:49 UTC):

- image `postgres:18` (server bilan bir xil versiya), volume `pg-backup-volume` → `/backup`;
- `DATABASE_URL=${{Postgres.DATABASE_URL}}` havolasi, parol hech kimga ko'rsatilmaydi;
- start command `pg_dump --format=custom` ni `/backup/pre-seo-merge-<vaqt>.dump` ga yozadi,
  `pg_restore --list` bilan tekshiradi, `BACKUP_OK <fayl>` deb log qiladi va uxlab turadi.

Natija: `/backup/pre-seo-merge-20261013T194955Z.dump`, 471 KB, 114 ta jadval ma'lumoti.

## 2. Deploydan oldin tekshirish (faqat o'qish)

Railway CLI bu kompyuterda yo'q, shuning uchun prod bazada SQL ishga tushirilmadi. O'rniga:

- backup ro'yxatida (`pg_restore --list`) `seos`, `seos_cmps`, beshta `components_seo_*` jadvali va
  o'chiriladigan `components_landing_page_tools`, `components_contacts_page_topics` ma'lumotlari bor;
- saytdagi SEO ochiq API orqali saqlandi:

```bash
Q='{"query":"query($l:I18NLocaleCode){seo(locale:$l){landingPage{title description} aboutPage{title description} pricePage{title description} oneGuaranteePage{title description} contactsPage{title description}}}","variables":{"l":"LOCALE"}}'
for l in en ru; do curl -s https://onebrandingbackend.up.railway.app/graphql -H 'Content-Type: application/json' --data "${Q/LOCALE/$l}" > seo-$l-before.json; done
for l in en ru; do curl -s "https://onebrandingbackend.up.railway.app/api/seo?locale=$l&populate=*" -o rest-$l-before.json; done
```

Natija: en'da beshta SEO yozuvi bor (hammasi "HomePage", "About Page title" kabi vaqtinchalik
matn, frontend ularni e'tiborsiz qoldirib i18n matnini ishlatadi), ru'da SEO hujjati yo'q (REST 404).
Demak migratsiya 5 ta yozuvni ko'chirishi kutilgan.

## 3. Deploy (2026-10-13 19:50 UTC)

`2065126` `main`ga fast-forward qilindi; Railway backend va frontendni o'zi deploy qildi.
Yangi backend migratsiyani 19:52:45 da bajardi, eski konteyner 19:53:08 da to'xtadi. Shu oraliqda
eski konteynerga kelgan yagona so'rov (kuzatuv uchun `curl`) 500 oldi: eski kod o'chirilgan
`components_seo_*` jadvalini so'radi. Sayt so'rovlari bu oraliqqa tushmadi.

## 4. Deploydan keyin tekshirish (bajarildi)

- Backend logi: `[merge-seo] moved {"seo.landing-page":1,"seo.about-page":1,"seo.price-page":1,"seo.one-guarantee-page":1,"seo.contacts-page":1} into shared.seo; dropped 0 broken link(s)` — kutilgan 5 ta.
- GraphQL `seo` (en, ru): oldingisi bilan bayt-ma-bayt bir xil.
- REST `/api/seo` (en): komponent `id`laridan tashqari bir xil (`id`lar endi 1–5); ru oldingidek 404.
- `/healthz` 200; `/`, `/about`, `/pricing`, `/one-guarantee`, `/contact`, `/ru`, `/ru/about`, `/projects`
  sahifalarining `<title>` va description'i joyida.
- GitHub Actions: `main` va branch'dagi CI yashil.

## Orqaga qaytarish

Faqat kodni qaytarish yetmaydi: eski kod `components_shared_seos`ni o'chiradi va SEO so'rovlarida
500 beradi. Ma'lumot `pg-backup` volume'idagi dumpda turadi.

1. Railway → `Backend` → oldingi muvaffaqiyatli deploy (`d085ff0`) → **Redeploy**.
2. `pg-backup` servisining start command'ini vaqtincha shunga almashtirib redeploy qiling:
   `sh -c 'pg_restore --dbname="$DATABASE_URL" --clean --if-exists --no-owner /backup/pre-seo-merge-20261013T194955Z.dump; echo RESTORE_DONE; exec sleep infinity'`
3. Logda `RESTORE_DONE` chiqqach `Backend`ni restart qiling va 4-qadamdagi GraphQL solishtiruvini takrorlang.

## Tozalash

`pg-backup` servisi (`sleep infinity` bilan) va `pg-backup-volume` faqat orqaga qaytarish uchun turibdi.
Bir necha kun muammo chiqmasa, ikkalasini ham Railway'dan o'chirish mumkin.
