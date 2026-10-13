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

Lokal sinov (2026-10-14): eski kod bilan SQLite va Postgres 16 bazalarida en/ru SEO yozildi, nusxasida
yangi kod ishga tushirildi. GraphQL, REST va document service javoblari oldin va keyin bir xil
(komponent `id`laridan tashqari), qayta ishga tushirishda migratsiya takrorlanmaydi, admin
orqali tahrirlash ishlaydi, yangi jadval Strapi o'zi yaratadigan bilan bir xil.

## 1. Backup (birinchi qadam, majburiy)

1a. Railway → `Postgres` → **Backups** → **Create backup** (rejada bo'lsa).

1b. Har holda `pg_dump` ham (parollar konteyner env'ida, ko'rsatish shart emas):

```bash
railway ssh --service Postgres
pg_dump -h localhost -Fc -f /var/lib/postgresql/data/pre-seo-merge.dump
pg_restore --list /var/lib/postgresql/data/pre-seo-merge.dump | grep -c "TABLE DATA"
```

Oxirgi buyruq 0 dan katta son chiqarishi kerak.

## 2. Deploydan oldin tekshirish (faqat o'qish)

Shu `railway ssh` ichida `psql -h localhost`:

```sql
-- Nechta SEO yozuvi ko'chadi (keyin logdagi raqamlar bilan solishtiriladi)
SELECT component_type, count(*) FROM seos_cmps GROUP BY component_type ORDER BY 1;

-- O'chiriladigan jadvallarda nechta qator bor (ular backupda qoladi)
SELECT table_name,
       (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I', table_name), false, true, '')))[1]::text::int AS rows
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE 'components_seo_%'
       OR table_name LIKE 'components_contacts_page_write_to_one_brendings%'
       OR table_name IN ('components_contacts_page_topics', 'components_contacts_page_contacts',
                         'components_contacts_page_requested_services_messages',
                         'components_landing_page_projects_images', 'components_landing_page_tools'))
ORDER BY 1;
```

Saytdagi SEO matnlarini ham saqlab qo'ying (ochiq API, kompyuteringizda):

```bash
Q='{"query":"query($l:I18NLocaleCode){seo(locale:$l){landingPage{title description} aboutPage{title description} pricePage{title description} oneGuaranteePage{title description} contactsPage{title description}}}","variables":{"l":"LOCALE"}}'
for l in en ru; do curl -s https://onebrandingbackend.up.railway.app/graphql -H 'Content-Type: application/json' --data "${Q/LOCALE/$l}" > seo-$l-before.json; done
```

## 3. Deploy

- Kam trafikli vaqtda; deploy paytida admin'da SEO'ni tahrirlamang.
- Branch `main`ga merge qilinadi, Railway backend va frontendni o'zi deploy qiladi.
- Yangi deploy ishga tushguncha eski backend hali trafikda bo'ladi; migratsiyadan keyin u
  SEO'ni bo'sh qaytaradi va sayt i18n matnlariga tushadi. Sahifa keshi (5 daqiqa) shu
  sahifalarni ko'pi bilan 5 daqiqa saqlashi mumkin.

## 4. Deploydan keyin tekshirish

- Backend logi: `migrated 202610140001_merge_seo_components.js` va
  `[merge-seo] moved {...} into shared.seo; dropped 0 broken link(s)`. Raqamlar 2-qadamdagi
  `seos_cmps` sonlariga teng bo'lishi kerak.
- SQL: `SELECT component_type, count(*) FROM seos_cmps GROUP BY 1;` faqat `shared.seo` (jami o'sha
  son), `SELECT count(*) FROM components_shared_seos;` ham shu son; `components_seo_%` jadvallari yo'q.
- GraphQL: 2-qadamdagi tsiklni `seo-$l-after.json` bilan qayta ishlating;
  `diff seo-en-before.json seo-en-after.json` va `ru` uchun ham farq chiqarmasligi kerak.
- Admin: Content Manager → SEO → en va ru: matnlar joyida, har bir blok "SEO" deb nomlangan.
- 5 daqiqadan keyin `/`, `/about`, `/pricing`, `/one-guarantee`, `/contact` va `/ru/...` sahifalarining
  `<title>` va `description`'i oldingidek.

## Orqaga qaytarish

Faqat kodni qaytarish yetmaydi: eski kod SEO'ni bo'sh ko'rsatadi va `components_shared_seos`ni o'chiradi.
Ma'lumot backupda turadi.

1. Railway → `Backend` → oldingi muvaffaqiyatli deploy → **Redeploy**.
2. Backupni tiklash: 1a'dagi Railway backup'dan **Restore** yoki
   `pg_restore -h localhost --clean --if-exists --no-owner -d "$PGDATABASE" /var/lib/postgresql/data/pre-seo-merge.dump`.
3. `Backend` service'ni restart qiling va 4-qadamdagi GraphQL `diff`ni qayta tekshiring.
