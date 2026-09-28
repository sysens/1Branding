# Railway deploy guide

## Arxitektura

Bu repo isolated monorepo:

- `/backend` - Strapi 5 backend
- `/frontend` - Nuxt 4 frontend

Railway ichida bitta project ichida 3 ta service kerak:

1. `frontend`
2. `backend`
3. `Postgres`

Media fayllar serverning o'zidan beriladi. Railway'da uploadlar saqlanib qolishi uchun backend service'ga volume ulash tavsiya etiladi.

## Railway ichida qaysi variantni tanlash kerak

Yangi project yaratishda eng to'g'ri boshlanish:

1. `GitHub Repository` ni tanlang
2. reponi ulang
3. avval birinchi service yaratilgach, keyin loyiha ichida yana `+ Create` orqali:
   - ikkinchi GitHub service
   - `Database -> PostgreSQL`

Muqobil yo'l:

1. `Empty Project` ni tanlang
2. keyin `+ Create -> GitHub Repo` orqali `frontend`
3. yana `+ Create -> GitHub Repo` orqali `backend`
4. yana `+ Create -> Database -> PostgreSQL`

Amalda ikkalasi ham ishlaydi. Bu repo uchun `Empty Project` bilan boshlash boshqarish jihatidan qulayroq.

## Root directory

Service sozlamalarida root directory larni alohida qo'ying:

- `frontend` service: `/frontend`
- `backend` service: `/backend`

Har ikkala papkada ham `Dockerfile` bor, Railway shu Dockerfile lardan foydalanadi.

## Backend env

Namuna: [`backend/.env.railway.example`](./backend/.env.railway.example)

Majburiy minimum:

```env
HOST=0.0.0.0
PORT=1337
IS_PROXIED=true
APP_KEYS=...
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
JWT_SECRET=...
ENCRYPTION_KEY=...
PUBLIC_BASE_URL=https://api.example.com
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_POOL_MIN=0
UPLOAD_PROVIDER=local
UPLOAD_MAX_FILE_SIZE_MB=128
```

## Frontend env

Namuna: [`frontend/.env.railway.example`](./frontend/.env.railway.example)

```env
NUXT_PUBLIC_GRAPHQL_URL=https://api.example.com/graphql
# SEO uchun majburiy: canonical, hreflang, robots.txt va sitemap.xml shu domenni ishlatadi
NUXT_PUBLIC_SITE_URL=https://onebranding.uz
# Ixtiyoriy: Google uchun Organization JSON-LD kontaktlari (faqat haqiqiy ma'lumot)
NUXT_PUBLIC_ORG_PHONE=+998 XX XXX XX XX
NUXT_PUBLIC_ORG_EMAIL=hello@onebranding.uz
NUXT_PUBLIC_ORG_SAME_AS=https://www.instagram.com/...,https://t.me/...,https://www.behance.net/...
```

`NUXT_PUBLIC_SITE_URL` berilmasa sayt so'rov kelgan domenni ishlatadi — bu holda
`*.up.railway.app` va asosiy domen alohida sayt sifatida indekslanib, dublikat kontent bo'ladi.

## Tavsiya etilgan domainlar

- `frontend`: `onebranding.uz`
- `backend`: `api.onebranding.uz`
- `media`: `media.onebranding.uz`

## Deploy tartibi

1. `Postgres` service yarating.
2. `backend` service yarating va `/backend` root directory qo'ying.
3. `backend` env larni kiriting.
4. `backend` uchun Railway domain generatsiya qiling.
5. Strapi adminga kirib birinchi admin user yarating.
6. Media uploadlar saqlanib qolishi uchun `backend` service'ga volume ulang.
7. `frontend` service yarating va `/frontend` root directory qo'ying.
8. `frontend` ga `NUXT_PUBLIC_GRAPHQL_URL` va `NUXT_PUBLIC_SITE_URL` kiriting.
9. `frontend` uchun domain generatsiya qiling.
10. Railway custom domain larini Cloudflare DNS ga ulang.

## Muhim izohlar

- **Deploy tartibi:** avval `backend`, keyin `frontend`. Yangi frontend contact formasi spamga qarshi `meta` maydonini yuboradi; uni faqat yangi backend qabul qiladi (yangi backend esa eski frontend bilan ham ishlayveradi).
- `backend` Node 24 LTS'da ishlaydi (Node 20 muddati 2026-yil aprelda tugagan).
- `IS_PROXIED` Railway'da avtomatik yoqiladi (`RAILWAY_SERVICE_ID` orqali); boshqa hostingda qo'lda `IS_PROXIED=true` qo'ying.
- Public roldan qat'i nazar, anonim foydalanuvchilar uchun `/api/upload/files*`, `/api/users*`, `/api/users-permissions/*` va ro'yxatdan o'tish yopiq; ochiq ro'yxatdan o'tish har ishga tushishda o'chiriladi.
- `backend/bun.lock` va `frontend/bun.lock` Docker build uchun kerak — ularni o'chirmang (Railway har bir servisni o'z papkasidan build qiladi).

- Postgres uchun `pg` package kerak, package.json ga qo'shildi.
- Strapi Docker ichida ishlagani uchun `DATABASE_POOL_MIN=0` tavsiya etiladi.
- Frontend browserdan backendga ulanadi, shuning uchun `NUXT_PUBLIC_GRAPHQL_URL` public backend domain bo'lishi kerak.
- Telegramga yuboriladigan media linklar `PUBLIC_BASE_URL` to'g'ri bo'lishiga bog'liq.
