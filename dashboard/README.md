# OneBranding — dashboard (admin.onebrandingworld.com)

Trafik, arizalar, CRM-voronka va pul — bitta ichki tizimda. TZ: «дашборд
OneBranding — трафик, заявки, воронка, деньги». Strapi’ga bog‘liq emas: o‘z
Nuxt 4 ilovasi, o‘z PostgreSQL bazasi, interfeysi shadcn-vue (rus tilida).

## Qanday ishlaydi

```
sayt (frontend) ── /api/ob/c, /api/ob/lead ──► dashboard /api/public/*   (Railway ichki tarmog‘i, maxfiy kalit bilan)
Telegram bot   ── /api/telegram/webhook ───► dashboard                  (biznes-xabarlar → lidlar)
Meta           ── /api/instagram/webhook ──► dashboard                  (Instagram Direct → lidlar)
dashboard ── har daqiqa ob:tick ──► Meta / Google Ads / Yandex Direkt xarajatlari, cbu.uz kurslari,
                                     eslatmalar va kunlik/haftalik hisobotlar Telegram’ga
```

- **Sayt trekeri** (`frontend/app/plugins/ob-tracker.client.ts`): `visitor_id`, first/last touch,
  UTM, gclid/yclid/fbclid, GA/Metrika/Meta id’lari, 3.3-bo‘limdagi hodisalar.
  Har tashrifchiga murojaat kodi beriladi (`OB-1001`), Telegram/WhatsApp tugmalariga qo‘shiladi.
- **Forma** `/api/ob/lead` ga boradi; dashbord ishlamasa forma eski Strapi yo‘liga qaytadi (lid yo‘qolmaydi).
- **Metrikalar** (TZ 7-bo‘lim): `server/utils/metrics.ts`. Pul har doim o‘z valyutasida va
  o‘sha kungi O‘zR MB kursi bilan saqlanadi; hisobot USD yoki UZS’da.
  Kanallar bo‘yicha CAC/ROMI/ROI — kogorta bo‘yicha.
- **Rollar**: ega / menejer / faqat ko‘rish. Huquqlar serverda tekshiriladi. Kirish: parol + 2FA (TOTP, majburiy).

## Papkalar

```
server/db/schema.ts          baza sxemasi (drizzle); migratsiyalar server/db/migrations
server/api/public/           sayt trekeri va formasi (proksi orqali)
server/api/...               dashbord API (auth, deals, reports, settings ...)
server/utils/metrics.ts      TZ 7-bo‘lim formulalari
server/utils/ads.ts          Meta / Google Ads / Yandex Direkt xarajatlari
server/utils/jobs.ts         jadval: kurslar, xarajatlar, eslatmalar, hisobotlar
app/pages/                   ekranlar: Сводка, Воронка, Сделка, Каналы, Сайт, Клиенты, Финансы, Расходы, Задачи, Настройки
app/components/ui/           shadcn-vue komponentlari (CLI bilan qo‘shilgan, qo‘lda o‘zgartirilmaydi)
tests/                       bun test: metrikalar (10 sdelka, 3 kanal, 2 valyuta), ish vaqti, UTM qoidalari, TOTP
```

## Lokal ishga tushirish

```bash
bun install
cp .env.example .env        # DATABASE_URL bo‘sh qolsa PGlite (.data/pglite) ishlatiladi
# .env: NUXT_SETUP_TOKEN=dev-setup-token, NUXT_AUTH_REQUIRE_2FA=false (faqat lokal)
bun run dev                 # http://localhost:3002
```

Demo ma’lumot (faqat `nuxt dev`, production’da 404):

```bash
curl -X POST -H "origin: http://127.0.0.1:3002" http://127.0.0.1:3002/api/dev/seed
```

Demo egasi: `demo@onebranding.local` / `demo-password-123` (faqat lokal baza uchun).

Saytni lokal dashbordga ulash: `frontend/.env` ga
`NUXT_DASHBOARD_INTERNAL_URL=http://127.0.0.1:3002` va `NUXT_DASHBOARD_PROXY_SECRET=...`,
dashbord `.env` ga xuddi shu qiymat bilan `NUXT_PROXY_SECRET=...`.

```bash
bun run lint && bun run typecheck && bun run test && bun run build
```

Sxema o‘zgarsa: `bun run db:generate` (yangi SQL migratsiya), server ishga tushganda o‘zi qo‘llaydi.

## Railway’ga joylash

1. **PostgreSQL**: shu project’da yangi Postgres servisi (masalan `DashboardPostgres`). Strapi bazasidan alohida.
2. **Servis**: New service → GitHub repo, Root Directory `/dashboard`, Watch Paths `/dashboard/**`,
   Healthcheck Path `/healthz`. Build `dashboard/Dockerfile` orqali.
3. **Env** (`.env.example` ga qarang): `DATABASE_URL=${{DashboardPostgres.DATABASE_URL}}`,
   `ENCRYPTION_KEY`, `NUXT_PROXY_SECRET`, `NUXT_SETUP_TOKEN`, `NUXT_PUBLIC_APP_URL`, `NUXT_PUBLIC_SITE_URL`.
4. **Domen**: Settings → Networking → Custom Domain `admin.onebrandingworld.com`;
   Cloudflare DNS’da Railway bergan CNAME (proxied).
5. **Sayt (frontend servisi) env**: `NUXT_DASHBOARD_INTERNAL_URL=http://<dashboard servis nomi>.railway.internal:3000`,
   `NUXT_DASHBOARD_PROXY_SECRET=<NUXT_PROXY_SECRET bilan bir xil>`.
6. `https://admin.onebrandingworld.com/login` → birinchi egani `NUXT_SETUP_TOKEN` bilan yarating, 2FA’ni yoqing,
   so‘ng `NUXT_SETUP_TOKEN` ni o‘chiring. Ikkinchi egani Настройки → Пользователи’da qo‘shing.

Bitta nusxa (replica) bilan ishlaydi: rejalashtirilgan vazifalar va so‘rov limitlari xotirada.

## Ulanishlar (Настройки → Подключения)

| Ulanish | Nima kerak |
|---|---|
| Telegram | @BotFather’da bot (Business Mode yoqilgan). Token va egalar chati ID’si (botni chatga qo‘shib `/id` yozing). «Подключить вебхук» tugmasi. Telegram → Sozlamalar → Telegram Business → Chat-botlar: botni ulang, faqat o‘qish, faqat yangi chatlar va kontaktda yo‘qlar. |
| Meta Ads | `ads_read` tokeni va reklama kabineti ID’si. Kampaniyani utm_campaign bilan bir xil nomlang. |
| Pixel + CAPI | Pixel ID va Conversions API tokeni (sayt: `NUXT_PUBLIC_META_PIXEL_ID`). |
| Instagram Direct | Professional akkaunt, Meta Business, ilova tekshiruvi. Webhook URL: `/api/instagram/webhook`, verify token va app secret. |
| Google Ads | Developer token (arizani darhol topshiring), OAuth client, refresh token, customer ID. |
| Yandex Direkt | OAuth token (+ agentlik bo‘lsa client login). |
| Turnstile | Secret key (sayt: `NUXT_PUBLIC_TURNSTILE_SITE_KEY`). |

## Looker Studio (TZ 8.5)

Looker Studio’ga bazani faqat o‘qish huquqi bilan ulang:

```sql
CREATE ROLE looker_readonly LOGIN PASSWORD '<kuchli parol>';
GRANT CONNECT ON DATABASE railway TO looker_readonly;
GRANT USAGE ON SCHEMA public TO looker_readonly;
GRANT SELECT ON visits, events, deals, stages, channels, campaigns, payments, expenses, clients TO looker_readonly;
```

Railway’da Postgres’ning TCP proxy manzilini ishlating; GA4 ni ikkinchi manba sifatida qo‘shing.
«Поведение на сайте» hisobotining havolasini Настройки → Общие’ga qo‘ying.

## Muhim

- Shaxsiy ma’lumotlar: O‘zbekiston fuqarolarining shaxsiy ma’lumotlarini mamlakat ichidagi serverlarda
  saqlash talabi bor. Baza hostingini tanlashdan oldin yurist bilan aniqlashtiring (TZ 11).
- `ENCRYPTION_KEY` ni o‘zgartirmang: saqlangan tokenlar o‘qilmay qoladi (ularni qayta kiritish kerak bo‘ladi).
- Bekap: Railway Postgres’da kunlik bekaplarni yoqing (30 kun saqlash).
