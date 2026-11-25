# Railway deploy guide

## Arxitektura

Bu repo isolated monorepo:

- `/backend` — Strapi 5 (CMS, GraphQL, kontakt formasi)
- `/frontend` — Nuxt 4 (SSR sayt)
- `/microsites` — Nuxt 4 + Tailwind: mijoz loyihalarining subdomen saytlari
  (`ertex.onebrandingworld.com`, ...). Batafsil: [`microsites/README.md`](./microsites/README.md)
- `/dashboard` — Nuxt 4 + shadcn-vue + o‘z PostgreSQL bazasi: trafik, arizalar, CRM-voronka va
  pul (`admin.onebrandingworld.com`). Batafsil: [`dashboard/README.md`](./dashboard/README.md)

Railway'dagi `dazzling-bravery` project'ida 3 ta service bor:

| Service | Root | Domen | Port |
|---|---|---|---|
| `frontend` | `/frontend` | onebrandingworld.com (Cloudflare orqali), onebranding.up.railway.app | 8080 |
| `Backend` | `/backend` | onebrandingbackend.up.railway.app, ichki: `1branding.railway.internal` | 1337 |
| `Postgres` | — | faqat ichki tarmoq | 5432 |

Media fayllar (admin va kontakt formasi uploadlari) **Cloudflare R2** da saqlanadi
(`1branding` bucket, `https://pub-156bce602951490e82e2418f1402419f.r2.dev/uploads/...`).
Backend konteyneri disk saqlamaydi, shuning uchun volume kerak emas.

Ikkala service ham `main` branch'dan avtomatik deploy bo'ladi va faqat o'z papkasi
o'zgarganda qayta build qilinadi (watch patterns: `/backend/**`, `/frontend/**`).
Har birida healthcheck bor (`/healthz`): yangi deploy javob bermasa, trafik eski
deployda qoladi.

## Backend env

Namuna: [`backend/.env.railway.example`](./backend/.env.railway.example)

```env
HOST=::                      # ichki tarmoq IPv6 ham talab qilishi mumkin
PORT=1337
CORS_ORIGINS=https://onebrandingworld.com,https://www.onebrandingworld.com,https://onebranding.up.railway.app
APP_KEYS=...                 # tasodifiy qiymatlar; namuna qiymatlari bilan logda xato chiqadi
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
JWT_SECRET=...
ENCRYPTION_KEY=...
PUBLIC_BASE_URL=https://onebrandingbackend.up.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}   # bo'lsa client avtomatik postgres
DATABASE_POOL_MIN=0
UPLOAD_PROVIDER=r2
R2_ACCOUNT_ID=... / R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=1branding
R2_PUBLIC_URL=https://pub-....r2.dev
R2_ROOT_PATH=uploads
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...         # arizalar Telegram'ga shu chatga keladi
```

Deploydan keyin backend logida quyidagilar bo'lishi kerak:

- `[upload] R2 bucket "1branding" reachable` — aks holda R2 kalitlari noto'g'ri;
- `Insecure secrets` xatosi **bo'lmasligi** kerak.

## Frontend env

Namuna: [`frontend/.env.railway.example`](./frontend/.env.railway.example)

```env
NUXT_PUBLIC_GRAPHQL_URL=https://onebrandingbackend.up.railway.app/graphql
# Server render GraphQL'ni Railway ichki tarmog'i orqali so'raydi (tezroq);
# ishlamasa avtomatik ochiq URL'ga o'tadi.
NUXT_GRAPHQL_URL_INTERNAL=http://1branding.railway.internal:1337/graphql
# SEO: canonical, hreflang, robots.txt va sitemap shu domenni ishlatadi.
NUXT_PUBLIC_SITE_URL=https://onebrandingworld.com
```

Dashbord ulanganda (sayt trekeri va arizalar formasi `/api/ob/*` orqali dashbordga boradi;
dashbord bo‘lmasa forma eski Strapi yo‘lidan ketadi):

```env
NUXT_DASHBOARD_INTERNAL_URL=http://<dashboard servis nomi>.railway.internal:3000
NUXT_DASHBOARD_PROXY_SECRET=...      # dashboard'dagi NUXT_PROXY_SECRET bilan bir xil
# Teglar (ixtiyoriy, bo'sh bo'lsa yuklanmaydi):
NUXT_PUBLIC_GA4_ID=G-...
NUXT_PUBLIC_YANDEX_METRIKA_ID=...
NUXT_PUBLIC_GTM_ID=GTM-...
NUXT_PUBLIC_META_PIXEL_ID=...
NUXT_PUBLIC_GOOGLE_ADS_ID=AW-...
NUXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL=...
NUXT_PUBLIC_TURNSTILE_SITE_KEY=...
```

## Dashboard (admin.onebrandingworld.com)

Alohida servis va alohida Postgres. Qadamlar, env va ulanishlar:
[`dashboard/README.md`](./dashboard/README.md#railwayga-joylash). Qisqasi:

1. New service → Postgres (`DashboardPostgres`).
2. New service → GitHub repo, Root Directory `/dashboard`, Watch Paths `/dashboard/**`,
   Healthcheck Path `/healthz` (build `dashboard/Dockerfile`).
3. Env: `DATABASE_URL=${{DashboardPostgres.DATABASE_URL}}`, `ENCRYPTION_KEY`, `NUXT_PROXY_SECRET`,
   `NUXT_SETUP_TOKEN`, `NUXT_PUBLIC_APP_URL=https://admin.onebrandingworld.com`.
4. Custom Domain `admin.onebrandingworld.com` + Cloudflare CNAME.
5. Frontend servisiga yuqoridagi `NUXT_DASHBOARD_*` qiymatlari.

## Microsites (loyiha subdomenlari)

`/microsites` alohida Railway servisi sifatida ishlaydi; env o'zgaruvchilari kerak emas
(saytlar ro'yxati va hostlari kodda: `microsites/shared/sites.ts`).

Servisni bir marta sozlash:

1. Railway → shu project → **New service → GitHub repo**, Root Directory: `/microsites`,
   Watch Paths: `/microsites/**`, Healthcheck Path: `/healthz`. Build `microsites/Dockerfile` orqali.
2. Settings → Networking → **Custom Domain**: `ertex.onebrandingworld.com`
   (har bir yangi sayt uchun o'z subdomeni yoki bir marta `*.onebrandingworld.com`).
3. Cloudflare DNS: Railway bergan qiymatga `CNAME ertex → <...>.up.railway.app` (proxied).
   Wildcard ishlatilsa: `CNAME * → <...>.up.railway.app` — `www` va boshqa aniq yozuvlar
   o'zgarmaydi.

Servisning `*.up.railway.app` domenida `/` saytlar ro'yxatini, `/ertex` esa preview'ni
ko'rsatadi; ular `noindex`. Yangi sayt qo'shish: [`microsites/README.md`](./microsites/README.md).

## Kesh

- Sahifalar serverda 5 daqiqa keshlanadi (stale-while-revalidate): CMS'dagi o'zgarish
  saytda 5 daqiqagacha kechikib ko'rinadi.
- `frontend/public` fayllari 1 yilga keshlanadi. Rasmni almashtirsangiz **yangi nom**
  bilan saqlang. Landing rasmlari `public/opt/` ga build vaqtida hash'li nom bilan
  yoziladi (`node scripts/optimize-images.mjs`).
- Cloudflare HTML'ni hozircha keshlamaydi. Tezlashtirish uchun Cloudflare'da
  **Caching → Cache Rules** da `onebrandingworld.com` uchun "Eligible for cache" +
  "Use cache-control header" qoidasini qo'shish mumkin (sayt `s-maxage=300` yuboradi).

## CI

GitHub Actions (`.github/workflows/ci.yml`) har push'da frontend testlari va build'ini,
backend typecheck va build'ini, microsites va dashboard lint, typecheck, test va build'ini tekshiradi.
Railway deployi CI'ga bog'liq emas.

## Muhim izohlar

- Backend Node 24 LTS'da, ikkala Dockerfile ham `node` (root emas) foydalanuvchi bilan ishlaydi; bun versiyasi qotirilgan (`oven/bun:1.4.3-alpine`).
- `backend/bun.lock` va `frontend/bun.lock` Docker build uchun kerak — o'chirmang.
- `IS_PROXIED` Railway'da avtomatik yoqiladi (`RAILWAY_SERVICE_ID` orqali).
- Anonim foydalanuvchilar uchun `/api/upload/files*`, `/api/users*`, `/api/users-permissions/*` va ro'yxatdan o'tish yopiq.
- Kontakt formasi faqat `CORS_ORIGINS` dagi domenlardan ishlaydi.
- Railway'dagi "Redeploy" oxirgi *deploy qilingan* commit'ni qayta ishga tushiradi, yangi kodni olmaydi — yangi kod uchun `main` ga push qiling.
